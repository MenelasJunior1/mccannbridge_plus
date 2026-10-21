defmodule McCannBridge.Assistant do
  @moduledoc """
  Orchestrates tenant-scoped retrieval and generation.

  External generation is disabled by default. The provider never receives a
  browser supplied role, system prompt, or document chunk.
  """

  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit
  alias McCannBridge.Assistant.{DisabledProvider, GroqProvider}
  alias McCannBridge.Knowledge

  @retrieval_limit 5

  def ask(scope, client_id, question, opts \\ [])

  def ask(%Scope{} = scope, client_id, question, opts) when is_binary(question) do
    started_at = System.monotonic_time()
    request_id = Ecto.UUID.generate()
    provider = Keyword.get(opts, :provider, provider())

    result =
      with :ok <- validate_question(question),
           {:ok, chunks} <- Knowledge.search(scope, client_id, question, limit: @retrieval_limit),
           sources = provider_sources(chunks),
           {:ok, generation} <-
             provider.generate(question, sources, Keyword.delete(opts, :provider)),
           :ok <- validate_generation(generation, sources),
           {:ok, current_chunks} <-
             Knowledge.reauthorize_chunks(scope, client_id, Enum.map(chunks, & &1.id)) do
        used_chunks = select_used_chunks(current_chunks, generation.used_source_ids)
        grounded = used_chunks != []

        {:ok,
         %{
           request_id: request_id,
           answer: answer_with_grounding_notice(generation.answer, grounded),
           grounded: grounded,
           citations: citations(used_chunks, sources),
           limitations: limitations(generation.limitations, chunks, used_chunks),
           provider: generation.provider,
           model: generation.model
         }}
      else
        {:error, :external_generation_disabled} ->
          unavailable(request_id, "external_generation_disabled")

        {:error, :zdr_not_confirmed} ->
          unavailable(request_id, "zdr_not_confirmed")

        {:error, :missing_api_key} ->
          unavailable(request_id, "missing_api_key")

        {:error, reason}
        when reason in [
               :provider_authentication_failed,
               :provider_rate_limited,
               :provider_unavailable,
               :provider_request_rejected,
               :invalid_provider_response
             ] ->
          unavailable(request_id, Atom.to_string(reason))

        {:error, reason} ->
          {:error, reason}
      end

    observe_request(scope, client_id, request_id, result, started_at)
    result
  end

  def ask(_, _, _, _), do: {:error, :unauthenticated}

  @doc "Returns provider readiness without exposing credentials."
  def configuration_status do
    case provider() do
      GroqProvider -> GroqProvider.configuration_status()
      DisabledProvider -> %{provider: "disabled", model: nil, state: "disabled"}
      module -> %{provider: inspect(module), model: nil, state: "configured"}
    end
  end

  defp provider do
    Application.get_env(
      :mccann_bridge,
      :assistant_provider,
      McCannBridge.Assistant.DisabledProvider
    )
  end

  defp validate_question(question) do
    length = question |> String.trim() |> String.length()

    if length in 1..4_000, do: :ok, else: {:error, :invalid_question}
  end

  defp provider_sources(chunks) do
    chunks
    |> Enum.with_index(1)
    |> Enum.map(fn {chunk, index} ->
      %{
        id: chunk.id,
        ref: "S#{index}",
        title: chunk.document_version.document.title,
        content: chunk.content,
        page: chunk.page,
        document_version_id: chunk.document_version_id
      }
    end)
  end

  defp citations(chunks, sources) do
    refs_by_id = Map.new(sources, &{&1.id, &1.ref})

    chunks
    |> Enum.with_index(1)
    |> Enum.map(fn {chunk, rank} ->
      %{
        rank: rank,
        ref: Map.fetch!(refs_by_id, chunk.id),
        chunk_id: chunk.id,
        document_version_id: chunk.document_version_id,
        title: chunk.document_version.document.title,
        page: chunk.page,
        excerpt: String.slice(chunk.content, 0, 280)
      }
    end)
  end

  defp validate_generation(
         %{
           answer: answer,
           used_source_ids: used_source_ids,
           limitations: limitations,
           provider: provider,
           model: model
         },
         sources
       )
       when is_binary(answer) and is_list(used_source_ids) and is_list(limitations) and
              is_binary(provider) and is_binary(model) do
    source_refs = Map.new(sources, &{&1.id, &1.ref})

    valid_source_references? =
      Enum.all?(used_source_ids, fn source_id ->
        case Map.fetch(source_refs, source_id) do
          {:ok, ref} -> String.contains?(answer, "[#{ref}]")
          :error -> false
        end
      end)

    if valid_source_references? and Enum.all?(limitations, &is_binary/1) do
      :ok
    else
      {:error, :invalid_provider_response}
    end
  end

  defp validate_generation(_generation, _sources), do: {:error, :invalid_provider_response}

  defp select_used_chunks(chunks, used_source_ids) do
    chunks_by_id = Map.new(chunks, &{&1.id, &1})

    used_source_ids
    |> Enum.uniq()
    |> Enum.map(&Map.fetch!(chunks_by_id, &1))
  end

  defp limitations(provider_limitations, candidate_chunks, used_chunks) do
    grounding_limitations =
      cond do
        used_chunks != [] -> []
        candidate_chunks == [] -> ["no_verified_source_found"]
        true -> ["no_verified_source_used"]
      end

    (provider_limitations ++ grounding_limitations)
    |> Enum.filter(&is_binary/1)
    |> Enum.uniq()
  end

  defp answer_with_grounding_notice(answer, true), do: answer

  defp answer_with_grounding_notice(answer, false) do
    "Réponse non fondée sur la base documentaire interne. " <> answer
  end

  defp unavailable(request_id, limitation) do
    {:error, :service_unavailable,
     %{
       request_id: request_id,
       answer: "Le service de génération n'est pas disponible pour le moment.",
       grounded: false,
       citations: [],
       limitations: [limitation]
     }}
  end

  defp observe_request(scope, client_id, request_id, result, started_at) do
    duration = System.monotonic_time() - started_at
    {action, metadata} = audit_metadata(result)

    :telemetry.execute(
      [:mccann_bridge, :assistant, :request, :stop],
      %{duration: duration},
      Map.put(metadata, :status, if(action == "assistant.query.completed", do: :ok, else: :error))
    )

    Audit.record_safely(scope, action, "assistant_request",
      client_id: client_id,
      resource_id: request_id,
      metadata: Map.new(metadata, fn {key, value} -> {to_string(key), value} end)
    )
  end

  defp audit_metadata({:ok, response}) do
    {"assistant.query.completed",
     %{
       grounded: response.grounded,
       citation_count: length(response.citations),
       provider: response.provider,
       model: response.model
     }}
  end

  defp audit_metadata({:error, :service_unavailable, response}) do
    {"assistant.query.failed",
     %{grounded: false, limitation: List.first(response.limitations), provider: "unavailable"}}
  end

  defp audit_metadata({:error, reason}) do
    {"assistant.query.failed",
     %{grounded: false, limitation: inspect(reason), provider: "unknown"}}
  end
end
