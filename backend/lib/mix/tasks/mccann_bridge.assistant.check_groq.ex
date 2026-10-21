defmodule Mix.Tasks.MccannBridge.Assistant.CheckGroq do
  use Mix.Task

  alias McCannBridge.Assistant.GroqProvider

  @shortdoc "Checks Groq credentials and configured model without sending documents"

  @moduledoc """
  Checks the server-side Groq credentials and configured model.

      mix mccann_bridge.assistant.check_groq

  The task calls only Groq's model-list endpoint. It never sends a question or
  document excerpt and never prints the API key. This check does not enable
  external generation; the ZDR acknowledgement and generation flag remain
  separate runtime controls.
  """

  @impl Mix.Task
  def run([]) do
    Mix.Task.run("app.start")

    case GroqProvider.check_connection() do
      {:ok, %{model: model}} ->
        Mix.shell().info("Groq credentials accepted; configured model is available: #{model}")

      {:error, reason} ->
        Mix.raise(error_message(reason))
    end
  end

  def run(_args), do: Mix.raise("Usage: mix mccann_bridge.assistant.check_groq")

  defp error_message(:missing_api_key), do: "GROQ_API_KEY is not set for this process"

  defp error_message(:provider_authentication_failed),
    do: "Groq rejected the configured credentials"

  defp error_message(:configured_model_unavailable),
    do: "GROQ_MODEL is not available to this Groq project"

  defp error_message(:provider_rate_limited), do: "Groq rate limit reached"
  defp error_message(:provider_unavailable), do: "Groq is unreachable or unavailable"
  defp error_message(_reason), do: "Groq connection check failed"
end
