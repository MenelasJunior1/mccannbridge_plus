defmodule McCannBridge.Repo.Migrations.AddSystemRoleToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :system_role, :string, null: false, default: "user"
    end

    create index(:users, [:system_role])

    create constraint(:users, :users_system_role_check,
             check: "system_role IN ('user', 'super_admin')"
           )
  end
end
