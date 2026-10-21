defmodule McCannBridgeWeb.ApiAuth do
  @moduledoc false

  import Plug.Conn
  import Phoenix.Controller

  alias McCannBridge.Accounts
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Organizations

  def fetch_current_scope(conn, _opts) do
    scope =
      with token when is_binary(token) <- get_session(conn, :user_token),
           {user, _inserted_at} <- Accounts.get_user_by_session_token(token) do
        Organizations.scope_for_user(user, get_session(conn, :active_client_id))
      else
        _ -> Scope.for_user(nil)
      end

    assign(conn, :current_scope, scope)
  end

  def require_authenticated_user(conn, _opts) do
    if conn.assigns.current_scope && conn.assigns.current_scope.user do
      conn
    else
      conn
      |> put_status(:unauthorized)
      |> json(%{error: "unauthenticated"})
      |> halt()
    end
  end
end
