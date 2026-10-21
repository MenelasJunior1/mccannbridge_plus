defmodule McCannBridgeWeb.DocumentsLiveTest do
  use McCannBridgeWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  alias McCannBridge.Organizations.{Client, Membership}
  alias McCannBridge.Repo

  setup :register_and_log_in_user

  setup %{user: user} do
    client =
      Repo.insert!(
        Client.changeset(%Client{}, %{
          name: "Orange Cameroun",
          slug: "orange-#{System.unique_integer([:positive])}",
          status: "active"
        })
      )

    Repo.insert!(
      Membership.changeset(
        %Membership{user_id: user.id, client_id: client.id},
        %{role: "agency", status: "active", permissions: []}
      )
    )

    %{client: client}
  end

  test "renders the responsive document workspace and upload dialog", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/documents")

    assert html =~ "Vos sources, prêtes pour l’intelligence."
    assert has_element?(view, "#documents-page")
    assert has_element?(view, ".documents-stats article", "Documents")
    assert has_element?(view, ".bridge-mobile-nav")
    assert has_element?(view, "#documents-empty")

    view |> element("#open-upload-button") |> render_click()

    assert has_element?(view, "#upload-modal")
    assert has_element?(view, "#document-upload-form")
    assert has_element?(view, "input[type=file]")
  end
end
