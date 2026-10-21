defmodule McCannBridgeWeb.AssistantController do
  use McCannBridgeWeb, :controller

  alias McCannBridge.Assistant

  def create(conn, %{"client_id" => client_id, "question" => question}) do
    case Assistant.ask(conn.assigns.current_scope, client_id, question) do
      {:ok, response} ->
        json(conn, response)

      {:error, :service_unavailable, response} ->
        conn |> put_status(:service_unavailable) |> json(response)

      {:error, :forbidden} ->
        conn |> put_status(:forbidden) |> json(%{error: "forbidden"})

      {:error, :invalid_question} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: "invalid_question"})

      {:error, :source_scope_changed} ->
        conn |> put_status(:conflict) |> json(%{error: "source_scope_changed"})

      {:error, _reason} ->
        conn |> put_status(:bad_request) |> json(%{error: "assistant_request_failed"})
    end
  end

  def create(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "client_id_and_question_required"})
  end
end
