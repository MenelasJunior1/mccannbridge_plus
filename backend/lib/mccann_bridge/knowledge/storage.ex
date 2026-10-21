defmodule McCannBridge.Knowledge.Storage do
  @moduledoc "Private storage boundary for source documents."

  @callback put(source_path :: String.t(), filename :: String.t()) ::
              {:ok, storage_key :: String.t()} | {:error, term()}
  @callback delete(storage_key :: String.t()) :: :ok | {:error, term()}

  def module do
    Application.get_env(
      :mccann_bridge,
      :knowledge_storage,
      McCannBridge.Knowledge.Storage.Local
    )
  end
end
