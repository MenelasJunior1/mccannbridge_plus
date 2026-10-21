defmodule McCannBridge.Knowledge.Storage.Local do
  @moduledoc "Development storage that keeps uploads outside the public static tree."

  @behaviour McCannBridge.Knowledge.Storage

  @impl true
  def put(source_path, filename) do
    key = Ecto.UUID.generate() <> String.downcase(Path.extname(filename))
    destination = Path.join(root(), key)

    with :ok <- File.mkdir_p(root()),
         {:ok, _bytes} <- File.copy(source_path, destination) do
      {:ok, key}
    end
  end

  @impl true
  def delete(storage_key) do
    case File.rm(Path.join(root(), Path.basename(storage_key))) do
      :ok -> :ok
      {:error, :enoent} -> :ok
      error -> error
    end
  end

  defp root do
    Application.get_env(
      :mccann_bridge,
      :knowledge_upload_dir,
      Application.app_dir(:mccann_bridge, "priv/uploads")
    )
  end
end
