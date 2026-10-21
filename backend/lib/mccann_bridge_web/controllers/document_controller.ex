defmodule McCannBridgeWeb.DocumentController do
  use McCannBridgeWeb, :controller

  alias McCannBridge.Knowledge

  def index(conn, %{"client_id" => client_id} = params) do
    case Knowledge.list_documents(
           conn.assigns.current_scope,
           client_id,
           Map.get(params, "search", "")
         ) do
      {:ok, documents} ->
        json(conn, %{documents: Enum.map(documents, &serialize_document/1)})

      {:error, :forbidden} ->
        conn |> put_status(:forbidden) |> json(%{error: "forbidden"})

      {:error, _reason} ->
        conn |> put_status(:bad_request) |> json(%{error: "documents_unavailable"})
    end
  end

  def index(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "client_id_required"})
  end

  def create(conn, %{"client_id" => client_id, "document" => attrs, "file" => upload}) do
    upload = %{path: upload.path, filename: upload.filename, content_type: upload.content_type}

    case Knowledge.ingest_upload(conn.assigns.current_scope, client_id, attrs, upload) do
      {:ok, %{document: document}} ->
        conn |> put_status(:created) |> json(serialize_document(document))

      {:error, :forbidden} ->
        conn |> put_status(:forbidden) |> json(%{error: "forbidden"})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: error_code(reason)})
    end
  end

  def create(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "document_and_file_required"})
  end

  def approve(conn, %{"id" => version_id}) do
    case Knowledge.approve_version(conn.assigns.current_scope, version_id) do
      {:ok, %{version: version}} ->
        json(conn, %{id: version.id, status: version.status})

      {:error, :forbidden} ->
        conn |> put_status(:forbidden) |> json(%{error: "forbidden"})

      {:error, :not_found} ->
        conn |> put_status(:not_found) |> json(%{error: "not_found"})

      {:error, reason} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: error_code(reason)})
    end
  end

  defp serialize_document(document) do
    versions =
      case document.versions do
        %Ecto.Association.NotLoaded{} -> []
        versions -> versions
      end

    current = if versions == [], do: nil, else: Enum.max_by(versions, & &1.number)

    %{
      id: document.id,
      client_id: document.client_id,
      title: document.title,
      classification: document.classification,
      status: document.status,
      current_version_number: document.current_version_number,
      current_version:
        current &&
          %{
            id: current.id,
            number: current.number,
            status: current.status,
            mime_type: current.mime_type,
            byte_size: current.byte_size
          },
      inserted_at: document.inserted_at,
      updated_at: document.updated_at
    }
  end

  defp error_code(%Ecto.Changeset{}), do: "validation_failed"
  defp error_code(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp error_code(_reason), do: "operation_failed"
end
