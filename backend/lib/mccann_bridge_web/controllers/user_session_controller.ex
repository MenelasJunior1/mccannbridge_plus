defmodule McCannBridgeWeb.UserSessionController do
  use McCannBridgeWeb, :controller

  alias McCannBridge.Accounts
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit
  alias McCannBridgeWeb.UserAuth

  def create(conn, %{"_action" => "confirmed"} = params) do
    create(conn, params, "User confirmed successfully.")
  end

  def create(conn, params) do
    create(conn, params, "Welcome back!")
  end

  # magic link login
  defp create(conn, %{"user" => %{"token" => token} = user_params}, info) do
    case Accounts.login_user_by_magic_link(token) do
      {:ok, {user, tokens_to_disconnect}} ->
        UserAuth.disconnect_sessions(tokens_to_disconnect)

        Audit.record_safely(Scope.for_user(user), "authentication.login_succeeded", "session",
          metadata: %{"method" => "magic_link"}
        )

        conn
        |> put_flash(:info, info)
        |> UserAuth.log_in_user(user, user_params)

      _ ->
        Audit.record_safely(nil, "authentication.login_failed", "session",
          metadata: %{"method" => "magic_link"}
        )

        conn
        |> put_flash(:error, "The link is invalid or it has expired.")
        |> redirect(to: ~p"/users/log-in")
    end
  end

  # email + password login
  defp create(conn, %{"user" => user_params}, info) do
    %{"email" => email, "password" => password} = user_params

    if user = Accounts.get_user_by_email_and_password(email, password) do
      Audit.record_safely(Scope.for_user(user), "authentication.login_succeeded", "session",
        metadata: %{"method" => "password"}
      )

      conn
      |> put_flash(:info, info)
      |> UserAuth.log_in_user(user, user_params)
    else
      Audit.record_safely(nil, "authentication.login_failed", "session",
        metadata: %{
          "method" => "password",
          "email_fingerprint" => email_fingerprint(email)
        }
      )

      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      conn
      |> put_flash(:error, "Invalid email or password")
      |> put_flash(:email, String.slice(email, 0, 160))
      |> redirect(to: ~p"/users/log-in")
    end
  end

  def update_password(conn, %{"user" => user_params} = params) do
    user = conn.assigns.current_scope.user
    true = Accounts.sudo_mode?(user)
    {:ok, {_user, expired_tokens}} = Accounts.update_user_password(user, user_params)

    # disconnect all existing LiveViews with old sessions
    UserAuth.disconnect_sessions(expired_tokens)

    conn
    |> put_session(:user_return_to, ~p"/users/settings")
    |> create(params, "Password updated successfully!")
  end

  def delete(conn, _params) do
    Audit.record_safely(conn.assigns.current_scope, "authentication.logout", "session")

    conn
    |> put_flash(:info, "Logged out successfully.")
    |> UserAuth.log_out_user()
  end

  defp email_fingerprint(email) do
    email
    |> String.trim()
    |> String.downcase()
    |> then(&:crypto.hash(:sha256, &1))
    |> Base.encode16(case: :lower)
  end
end
