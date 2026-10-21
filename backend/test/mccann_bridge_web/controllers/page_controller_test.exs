defmodule McCannBridgeWeb.PageControllerTest do
  use McCannBridgeWeb.ConnCase

  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    assert html_response(conn, 200) =~ "Un seul espace pour piloter, comprendre et décider."
  end
end
