defmodule McCannBridgeWeb.MonitoringLiveTest do
  use McCannBridgeWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  alias McCannBridge.Accounts.User
  alias McCannBridge.Repo

  setup :register_and_log_in_user

  test "redirects a regular authenticated user", %{conn: conn} do
    assert {:error, {:redirect, %{to: "/documents"}}} = live(conn, ~p"/monitoring")
  end

  test "renders operational status and audit events for a super administrator", %{
    conn: conn,
    user: user
  } do
    user
    |> User.system_role_changeset(%{system_role: "super_admin"})
    |> Repo.update!()

    {:ok, view, html} = live(conn, ~p"/monitoring")

    assert html =~ "Audit &amp; monitoring"
    assert has_element?(view, "#monitoring-page")
    assert has_element?(view, "#runtime-status", "Application Phoenix")
    assert has_element?(view, "#assistant-status", "Assistant IA")
    assert has_element?(view, "#audit-events")
    assert has_element?(view, "#monitoring-nav-link")

    view |> element("#refresh-monitoring") |> render_click()
    assert has_element?(view, "#audit-log")
  end
end
