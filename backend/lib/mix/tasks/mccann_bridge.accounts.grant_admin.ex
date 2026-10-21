defmodule Mix.Tasks.MccannBridge.Accounts.GrantAdmin do
  use Mix.Task

  @shortdoc "Grants an existing account admin access to a client"

  @moduledoc """
  Grants an existing account admin access to a client workspace.

      mix mccann_bridge.accounts.grant_admin EMAIL CLIENT_SLUG "Client name"

  The task does not create the account or set a password. The user must reload
  their authenticated session after the membership changes.
  """

  @impl Mix.Task
  def run([email, slug, name]) do
    Mix.Task.run("app.start")

    case McCannBridge.Organizations.bootstrap_admin(email, %{"slug" => slug, "name" => name}) do
      {:ok, %{client: client}} ->
        Mix.shell().info("Admin access granted for #{email} on #{client.name} (#{client.slug}).")

      {:error, :user_not_found} ->
        Mix.raise("No account exists for #{email}. Register the account first.")

      {:error, %Ecto.Changeset{} = changeset} ->
        Mix.raise("Invalid client or membership: #{inspect(changeset.errors)}")
    end
  end

  def run(_args) do
    Mix.raise(~s(mix mccann_bridge.accounts.grant_admin EMAIL CLIENT_SLUG "Client name"))
  end
end
