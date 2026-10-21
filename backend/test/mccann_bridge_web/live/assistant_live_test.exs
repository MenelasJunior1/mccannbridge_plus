defmodule McCannBridgeWeb.AssistantLiveTest do
  use McCannBridgeWeb.ConnCase, async: true

  import Phoenix.LiveViewTest

  alias McCannBridge.Organizations.{Client, Membership}
  alias McCannBridge.Repo

  setup :register_and_log_in_user

  setup %{user: user} do
    suffix = System.unique_integer([:positive])

    client =
      Repo.insert!(
        Client.changeset(%Client{}, %{
          name: "Client #{suffix}",
          slug: "assistant-client-#{suffix}",
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

  test "renders the authenticated assistant and reports disabled generation", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/assistant")

    assert html =~ "Interrogez vos sources."
    assert has_element?(view, "#assistant-page")
    assert has_element?(view, "#assistant-question-form")
    assert has_element?(view, "#assistant-nav-link.is-active")

    view
    |> form("#assistant-question-form", assistant: %{question: "Quels sont les axes ?"})
    |> render_submit()

    assert has_element?(view, ".assistant-message.is-user", "Quels sont les axes ?")

    assert has_element?(
             view,
             ".assistant-message.is-assistant",
             "La génération Groq est désactivée"
           )
  end
end
