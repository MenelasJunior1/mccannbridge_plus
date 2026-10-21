defmodule McCannBridgeWeb.AuthController do
  use McCannBridgeWeb, :controller

  alias McCannBridge.Accounts
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit
  alias McCannBridge.Organizations

  def request_magic_link(conn, %{"email" => email}) when is_binary(email) do
    if user = Accounts.get_user_by_email(String.trim(email)) do
      _ =
        Accounts.deliver_login_instructions(user, fn token ->
          frontend_url() <> "/login?token=" <> URI.encode_www_form(token)
        end)
    end

    conn
    |> put_status(:accepted)
    |> json(%{message: "magic_link_requested"})
  end

  def request_magic_link(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "email_required"})
  end

  def confirm_magic_link(conn, %{"token" => token}) when is_binary(token) do
    case Accounts.login_user_by_magic_link(token) do
      {:ok, {user, _expired_tokens}} ->
        Audit.record_safely(Scope.for_user(user), "authentication.login_succeeded", "session",
          metadata: %{"method" => "magic_link", "client" => "nextjs"}
        )

        log_in(conn, user)

      _ ->
        Audit.record_safely(nil, "authentication.login_failed", "session",
          metadata: %{"method" => "magic_link", "client" => "nextjs"}
        )

        conn |> put_status(:unauthorized) |> json(%{error: "invalid_or_expired_token"})
    end
  end

  def confirm_magic_link(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "token_required"})
  end

  def login(conn, %{"email" => email, "password" => password})
      when is_binary(email) and is_binary(password) do
    case Accounts.get_user_by_email_and_password(String.trim(email), password) do
      nil ->
        Audit.record_safely(nil, "authentication.login_failed", "session",
          metadata: %{"method" => "password", "client" => "nextjs"}
        )

        conn |> put_status(:unauthorized) |> json(%{error: "invalid_credentials"})

      user ->
        Audit.record_safely(Scope.for_user(user), "authentication.login_succeeded", "session",
          metadata: %{"method" => "password", "client" => "nextjs"}
        )

        log_in(conn, user)
    end
  end

  def login(conn, _params) do
    conn |> put_status(:unprocessable_entity) |> json(%{error: "email_and_password_required"})
  end

  def show(conn, _params) do
    json(conn, session_payload(conn.assigns.current_scope))
  end

  def delete(conn, _params) do
    scope = conn.assigns.current_scope
    token = get_session(conn, :user_token)
    token && Accounts.delete_user_session_token(token)

    Audit.record_safely(scope, "authentication.logout", "session",
      metadata: %{"client" => "nextjs"}
    )

    conn
    |> configure_session(drop: true)
    |> json(%{status: "signed_out"})
  end

  defp log_in(conn, user) do
    token = Accounts.generate_user_session_token(user)
    scope = Organizations.scope_for_user(user)

    conn
    |> configure_session(renew: true)
    |> clear_session()
    |> put_session(:user_token, token)
    |> put_session(:active_client_id, scope.active_client_id)
    |> json(session_payload(scope))
  end

  defp session_payload(scope) do
    clients = Organizations.list_clients(scope)

    %{
      user: %{
        id: scope.user.id,
        email: scope.user.email,
        system_role: scope.user.system_role
      },
      scope: %{
        active_client_id: scope.active_client_id,
        role: scope.role,
        permissions: scope.permissions,
        clients: Enum.map(clients, &%{id: &1.id, name: &1.name, slug: &1.slug})
      }
    }
  end

  defp frontend_url do
    Application.get_env(:mccann_bridge, :frontend_url, "http://localhost:3000")
    |> String.trim_trailing("/")
  end
end
