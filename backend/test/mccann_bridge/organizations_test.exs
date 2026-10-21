defmodule McCannBridge.OrganizationsTest do
  use McCannBridge.DataCase, async: true

  alias McCannBridge.AccountsFixtures
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Organizations

  test "client access is derived from the server-side scope" do
    allowed_id = Ecto.UUID.generate()
    other_id = Ecto.UUID.generate()
    scope = %Scope{client_ids: [allowed_id], active_client_id: allowed_id}

    assert Organizations.client_allowed?(scope, allowed_id)
    assert {:ok, ^scope} = Organizations.require_client(scope, allowed_id)
    assert {:ok, ^scope} = Organizations.require_active_client(scope, allowed_id)
    refute Organizations.client_allowed?(scope, other_id)
    assert {:error, :forbidden} = Organizations.require_client(scope, other_id)
    assert {:error, :forbidden} = Organizations.require_active_client(scope, other_id)
  end

  test "missing scope is unauthenticated" do
    assert {:error, :unauthenticated} = Organizations.require_client(nil, Ecto.UUID.generate())
  end

  test "bootstrap_admin only grants an existing account" do
    assert {:error, :user_not_found} =
             Organizations.bootstrap_admin("missing@example.com", %{
               "name" => "Orange Cameroun",
               "slug" => "orange-cameroun"
             })

    user = AccountsFixtures.user_fixture()

    assert {:ok, %{client: client, membership: membership}} =
             Organizations.bootstrap_admin(user.email, %{
               "name" => "Orange Cameroun",
               "slug" => "orange-cameroun"
             })

    assert membership.role == "admin"
    assert membership.client_id == client.id
    assert Organizations.scope_for_user(user, client.id).role == "admin"
  end
end
