defmodule McCannBridge.AuditTest do
  use McCannBridge.DataCase, async: true

  import McCannBridge.AccountsFixtures

  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit

  test "only a currently authorized super administrator can read the audit trail" do
    user = user_fixture()
    scope = Scope.for_user(user)
    assert {:ok, _event} = Audit.record(scope, "test.action", "test_resource")
    assert {:error, :forbidden} = Audit.list_events(scope)

    super_admin = super_admin_fixture()
    assert {:ok, events} = Audit.list_events(Scope.for_user(super_admin))
    assert Enum.any?(events, &(&1.action == "test.action"))
  end
end
