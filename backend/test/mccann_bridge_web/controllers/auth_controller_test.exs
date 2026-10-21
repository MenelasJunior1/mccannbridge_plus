defmodule McCannBridgeWeb.AuthControllerTest do
  use McCannBridgeWeb.ConnCase, async: true

  import McCannBridge.AccountsFixtures

  alias McCannBridge.Accounts.User
  alias McCannBridge.Repo

  test "confirms a magic link and exposes only the server-derived role", %{conn: conn} do
    user = user_fixture()

    user
    |> User.system_role_changeset(%{system_role: "super_admin"})
    |> Repo.update!()

    {token, _hashed_token} = generate_user_magic_link_token(user)

    conn = post(conn, "/api/v1/auth/magic-link/confirm", %{token: token})
    payload = json_response(conn, 200)

    assert payload["user"]["email"] == user.email
    assert payload["user"]["system_role"] == "super_admin"
    assert get_session(conn, :user_token)
  end

  test "does not disclose whether an email exists", %{conn: conn} do
    existing = user_fixture().email

    existing_response = post(conn, "/api/v1/auth/magic-link", %{email: existing})

    missing_response =
      post(build_conn(), "/api/v1/auth/magic-link", %{email: "missing@example.com"})

    assert json_response(existing_response, 202) == %{"message" => "magic_link_requested"}
    assert json_response(missing_response, 202) == %{"message" => "magic_link_requested"}
  end

  test "requires a signed session for the current account", %{conn: conn} do
    conn = get(conn, "/api/v1/auth/session")
    assert json_response(conn, 401) == %{"error" => "unauthenticated"}
  end
end
