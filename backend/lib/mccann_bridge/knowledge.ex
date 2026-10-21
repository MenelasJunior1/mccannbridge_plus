defmodule McCannBridge.Knowledge do
  @moduledoc "Tenant-scoped document retrieval for the assistant and reports."

  import Ecto.Query

  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit
  alias Ecto.Multi
  alias McCannBridge.Knowledge.{Chunk, Chunker, Document, DocumentVersion, Extractor, Storage}
  alias McCannBridge.Organizations
  alias McCannBridge.Repo

  @default_limit 5
  @max_limit 10

  def list_documents(scope, client_id, search \\ "")

  def list_documents(%Scope{} = scope, client_id, search) do
    with {:ok, _scope} <- Organizations.require_client(scope, client_id) do
      query =
        Document
        |> where([document], document.client_id == ^client_id)
        |> order_by([document], desc: document.updated_at)
        |> preload([:owner, versions: [:uploaded_by, :approved_by]])

      query =
        case String.trim(search) do
          "" -> query
          term -> where(query, [document], ilike(document.title, ^"%#{term}%"))
        end

      {:ok, Repo.all(query)}
    end
  end

  def list_documents(_, _, _), do: {:error, :unauthenticated}

  def ingest_upload(%Scope{user: user} = scope, client_id, attrs, upload)
      when is_map(attrs) and is_map(upload) do
    filename = Map.fetch!(upload, :filename)
    path = Map.fetch!(upload, :path)

    result =
      with {:ok, current_scope} <- Organizations.require_current_client(scope, client_id),
           :ok <- authorize_ingestion(current_scope),
           {:ok, stat} <- File.stat(path),
           :ok <- validate_size(stat.size),
           {:ok, content} <- Extractor.extract(path, filename),
           chunks when chunks != [] <- Chunker.split(content),
           {:ok, storage_key} <- Storage.module().put(path, filename) do
        persist_ingestion(client_id, user.id, attrs, upload, stat, chunks, storage_key)
        |> cleanup_failed_upload(storage_key)
      else
        [] -> {:error, :empty_or_invalid_document}
        {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
        {:error, reason} -> {:error, reason}
      end

    audit_ingestion(scope, client_id, result)
    result
  end

  def ingest_upload(_, _, _, _), do: {:error, :unauthenticated}

  def approve_version(%Scope{user: user} = scope, version_id) do
    result =
      with {:ok, current_scope} <-
             Organizations.require_current_client(scope, scope.active_client_id),
           :ok <- authorize_approval(current_scope),
           %DocumentVersion{} = version <- version_for_scope(current_scope, version_id) do
        now = DateTime.utc_now(:second)

        Multi.new()
        |> Multi.update_all(
          :deactivate_old_chunks,
          from(chunk in Chunk,
            join: old_version in DocumentVersion,
            on: old_version.id == chunk.document_version_id,
            where: old_version.document_id == ^version.document_id
          ),
          set: [active: false, updated_at: now]
        )
        |> Multi.update_all(
          :activate_current_chunks,
          from(chunk in Chunk, where: chunk.document_version_id == ^version.id),
          set: [active: true, updated_at: now]
        )
        |> Multi.update(
          :version,
          Ecto.Changeset.change(version,
            status: "approved",
            approved_by_id: user.id,
            approved_at: now
          )
        )
        |> Multi.update(
          :document,
          Ecto.Changeset.change(version.document,
            status: "active",
            current_version_number: version.number
          )
        )
        |> Repo.transaction()
      else
        nil -> {:error, :not_found}
        {:error, reason} -> {:error, reason}
      end

    audit_approval(scope, result)
    result
  end

  def approve_version(_, _), do: {:error, :unauthenticated}

  def search(scope, client_id, query, opts \\ [])

  def search(%Scope{} = scope, client_id, query, opts) when is_binary(query) do
    with {:ok, _scope} <- Organizations.require_current_client(scope, client_id) do
      limit = opts |> Keyword.get(:limit, @default_limit) |> min(@max_limit) |> max(1)
      terms = query |> String.trim() |> String.split(~r/\s+/, trim: true) |> Enum.take(12)

      if terms == [] do
        {:ok, []}
      else
        tsquery = Enum.join(terms, " & ")

        results =
          Chunk
          |> join(:inner, [c], v in assoc(c, :document_version))
          |> join(:inner, [_c, v], d in assoc(v, :document))
          |> where([c, v, d], d.client_id == ^client_id and d.status == "active")
          |> where([c, v, _d], c.active and v.status == "approved")
          |> where(
            [c],
            fragment(
              "to_tsvector('french', ?) @@ plainto_tsquery('french', ?)",
              c.content,
              ^tsquery
            )
          )
          |> order_by([c],
            desc:
              fragment(
                "ts_rank(to_tsvector('french', ?), plainto_tsquery('french', ?))",
                c.content,
                ^tsquery
              )
          )
          |> limit(^limit)
          |> preload(document_version: :document)
          |> Repo.all()

        {:ok, results}
      end
    end
  end

  def search(_, _, _, _), do: {:error, :unauthenticated}

  @doc "Re-fetches candidate chunks after generation and rejects a changed access scope."
  def reauthorize_chunks(scope, client_id, chunk_ids)

  def reauthorize_chunks(%Scope{} = scope, client_id, chunk_ids) when is_list(chunk_ids) do
    unique_ids = Enum.uniq(chunk_ids)

    with {:ok, _scope} <- Organizations.require_current_client(scope, client_id) do
      chunks =
        Chunk
        |> join(:inner, [chunk], version in assoc(chunk, :document_version))
        |> join(:inner, [_chunk, version], document in assoc(version, :document))
        |> where(
          [chunk, version, document],
          chunk.id in ^unique_ids and document.client_id == ^client_id and
            document.status == "active" and chunk.active and version.status == "approved"
        )
        |> preload(document_version: :document)
        |> Repo.all()

      chunks_by_id = Map.new(chunks, &{&1.id, &1})

      if map_size(chunks_by_id) == length(unique_ids) do
        {:ok, Enum.map(unique_ids, &Map.fetch!(chunks_by_id, &1))}
      else
        {:error, :source_scope_changed}
      end
    else
      {:error, :forbidden} -> {:error, :source_scope_changed}
      {:error, reason} -> {:error, reason}
    end
  end

  def reauthorize_chunks(_, _, _), do: {:error, :unauthenticated}

  defp persist_ingestion(client_id, user_id, attrs, upload, stat, chunks, storage_key) do
    mime_type = Map.get(upload, :content_type) || "application/octet-stream"
    sha256 = File.stream!(Map.fetch!(upload, :path), [], 64_000) |> sha256_stream()

    Multi.new()
    |> Multi.insert(
      :document,
      %Document{client_id: client_id, owner_id: user_id}
      |> Document.changeset(%{
        title: Map.get(attrs, "title") || Map.fetch!(upload, :filename),
        classification: Map.get(attrs, "classification", "internal"),
        status: "draft"
      })
    )
    |> Multi.insert(:version, fn %{document: document} ->
      %DocumentVersion{
        document_id: document.id,
        uploaded_by_id: user_id,
        extracted_at: DateTime.utc_now(:second)
      }
      |> DocumentVersion.changeset(%{
        number: 1,
        storage_key: storage_key,
        sha256: sha256,
        mime_type: mime_type,
        byte_size: stat.size,
        status: "needs_review"
      })
    end)
    |> Multi.run(:chunks, fn repo, %{version: version} ->
      Enum.reduce_while(chunks, {:ok, []}, fn attrs, {:ok, inserted} ->
        changeset =
          %Chunk{document_version_id: version.id}
          |> Chunk.changeset(Map.put(attrs, :active, false))

        case repo.insert(changeset) do
          {:ok, chunk} -> {:cont, {:ok, [chunk | inserted]}}
          {:error, changeset} -> {:halt, {:error, changeset}}
        end
      end)
    end)
    |> Repo.transaction()
  end

  defp cleanup_failed_upload({:ok, result}, _storage_key), do: {:ok, result}

  defp cleanup_failed_upload({:error, _operation, reason, _changes}, storage_key) do
    _ = Storage.module().delete(storage_key)
    {:error, reason}
  end

  defp version_for_scope(scope, version_id) do
    DocumentVersion
    |> join(:inner, [version], document in assoc(version, :document))
    |> where(
      [version, document],
      version.id == ^version_id and document.client_id == ^scope.active_client_id
    )
    |> preload([_version, document], document: document)
    |> Repo.one()
  end

  defp authorize_ingestion(%Scope{role: role}) when role in ~w(super_admin admin agency), do: :ok

  defp authorize_ingestion(%Scope{permissions: permissions}) do
    if "knowledge.write" in permissions, do: :ok, else: {:error, :forbidden}
  end

  defp authorize_approval(%Scope{role: role}) when role in ~w(super_admin admin agency), do: :ok

  defp authorize_approval(%Scope{permissions: permissions}) do
    if "knowledge.approve" in permissions, do: :ok, else: {:error, :forbidden}
  end

  defp validate_size(size) when size > 0 and size <= 10_000_000, do: :ok
  defp validate_size(0), do: {:error, :empty_or_invalid_document}
  defp validate_size(_size), do: {:error, :file_too_large}

  defp sha256_stream(stream) do
    stream
    |> Enum.reduce(:crypto.hash_init(:sha256), &:crypto.hash_update(&2, &1))
    |> :crypto.hash_final()
    |> Base.encode16(case: :lower)
  end

  defp audit_ingestion(scope, client_id, {:ok, %{document: document, version: version}}) do
    Audit.record_safely(scope, "knowledge.document_ingested", "document",
      client_id: client_id,
      resource_id: document.id,
      metadata: %{
        "classification" => document.classification,
        "version_id" => version.id,
        "byte_size" => version.byte_size
      }
    )
  end

  defp audit_ingestion(scope, client_id, {:error, reason}) do
    Audit.record_safely(scope, "knowledge.document_ingestion_failed", "document",
      client_id: client_id,
      metadata: %{"reason" => audit_reason(reason)}
    )
  end

  defp audit_approval(scope, {:ok, %{document: document, version: version}}) do
    Audit.record_safely(scope, "knowledge.version_approved", "document_version",
      resource_id: version.id,
      metadata: %{"document_id" => document.id, "version_number" => version.number}
    )
  end

  defp audit_approval(scope, {:error, reason}) do
    Audit.record_safely(scope, "knowledge.version_approval_failed", "document_version",
      metadata: %{"reason" => audit_reason(reason)}
    )
  end

  defp audit_reason(%Ecto.Changeset{}), do: "validation_failed"
  defp audit_reason(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp audit_reason(_reason), do: "operation_failed"
end
