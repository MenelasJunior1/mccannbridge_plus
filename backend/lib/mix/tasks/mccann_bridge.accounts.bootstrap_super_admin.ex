defmodule Mix.Tasks.MccannBridge.Accounts.BootstrapSuperAdmin do
  use Mix.Task

  @shortdoc "Creates or promotes the system super administrator"

  @moduledoc """
  Creates an account when necessary and grants the system-wide super-admin role.

      mix mccann_bridge.accounts.bootstrap_super_admin EMAIL

  No password or secret is accepted by this task. The account signs in through
  the existing magic-link flow, and every bootstrap is written to the audit log.
  """

  @impl Mix.Task
  def run([email]) do
    Mix.Task.run("app.start")

    case McCannBridge.Accounts.bootstrap_super_admin(email) do
      {:ok, %{user: user, created?: created?}} ->
        operation = if created?, do: "created", else: "promoted"

        Mix.shell().info(
          "Super-admin account #{operation}: #{user.email}. Use the magic-link login flow."
        )

      {:error, %Ecto.Changeset{} = changeset} ->
        Mix.raise("Unable to bootstrap super admin: #{inspect(changeset.errors)}")
    end
  end

  def run(_args) do
    Mix.raise("mix mccann_bridge.accounts.bootstrap_super_admin EMAIL")
  end
end
