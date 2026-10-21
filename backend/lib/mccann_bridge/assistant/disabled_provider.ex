defmodule McCannBridge.Assistant.DisabledProvider do
  @behaviour McCannBridge.Assistant.Provider

  @impl true
  def generate(_question, _sources, _opts), do: {:error, :external_generation_disabled}
end
