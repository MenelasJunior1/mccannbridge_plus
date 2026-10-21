defmodule McCannBridge.AssistantProviderStub do
  @behaviour McCannBridge.Assistant.Provider

  @impl true
  def generate(question, sources, opts) do
    if test_pid = Keyword.get(opts, :test_pid) do
      send(test_pid, {:assistant_generation_requested, question, sources})
    end

    opts
    |> Keyword.get(:on_generate, fn -> :ok end)
    |> then(fn callback -> callback.() end)

    Keyword.fetch!(opts, :stub_result)
  end
end
