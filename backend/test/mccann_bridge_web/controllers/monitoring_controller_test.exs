defmodule McCannBridgeWeb.MonitoringControllerTest do
  use McCannBridgeWeb.ConnCase, async: true

  import McCannBridge.AccountsFixtures

  alias McCannBridge.Accounts.User
  alias McCannBridge.Repo

  test "rejects a regular authenticated account", %{conn: conn} do
    user = user_fixture()
    conn = conn |> log_in_user(user) |> get("/api/v1/monitoring")
    assert json_response(conn, 403) == %{"error" => "forbidden"}
  end

  test "returns a secret-free snapshot to a super administrator", %{conn: conn} do
    user = user_fixture()

    user =
      user
      |> User.system_role_changeset(%{system_role: "super_admin"})
      |> Repo.update!()

    conn = conn |> log_in_user(user) |> get("/api/v1/monitoring")
    payload = json_response(conn, 200)

    assert payload["runtime"]["database"] == "available"
    assert is_list(payload["events"])
    refute Map.has_key?(payload["assistant"], "api_key")
  end
end
