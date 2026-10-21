defmodule McCannBridge.Organizations do
  @moduledoc """
  Owns client memberships and derives the server-authoritative request scope.
  """

  import Ecto.Query

  alias McCannBridge.Accounts.{Scope, User}
  alias McCannBridge.Accounts
  alias McCannBridge.Organizations.Client
  alias McCannBridge.Organizations.Membership
  alias McCannBridge.Repo

  def list_clients(%Scope{client_ids: client_ids}) do
    Client
    |> where([client], client.id in ^client_ids and client.status == "active")
    |> order_by([client], asc: client.name)
    |> Repo.all()
  end

  def list_clients(_), do: []

  @doc "Bootstraps an admin membership for an existing account from a trusted server task."
  def bootstrap_admin(email, %{"name" => name, "slug" => slug}) do
    case Accounts.get_user_by_email(email) do
      nil ->
        {:error, :user_not_found}

      user ->
        Repo.transaction(fn ->
          client =
            Repo.get_by(Client, slug: slug) ||
              insert_or_rollback(Client.changeset(%Client{}, %{name: name, slug: slug}))

          membership =
            Repo.get_by(Membership, user_id: user.id, client_id: client.id) ||
              %Membership{user_id: user.id, client_id: client.id}

          membership =
            membership
            |> Membership.changeset(%{role: "admin", status: "active", permissions: []})
            |> insert_or_update_or_rollback()

          %{client: client, membership: membership}
        end)
    end
  end

  defp insert_or_rollback(changeset) do
    case Repo.insert(changeset) do
      {:ok, record} -> record
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end

  defp insert_or_update_or_rollback(%Ecto.Changeset{data: %{id: nil}} = changeset),
    do: insert_or_rollback(changeset)

  defp insert_or_update_or_rollback(changeset) do
    case Repo.update(changeset) do
      {:ok, record} -> record
      {:error, changeset} -> Repo.rollback(changeset)
    end
  end

  def scope_for_user(user, active_client_id \\ nil)

  def scope_for_user(nil, _active_client_id), do: nil

  def scope_for_user(user, active_client_id) do
    if user.system_role == "super_admin" do
      super_admin_scope(user, active_client_id)
    else
      membership_scope(user, active_client_id)
    end
  end

  defp membership_scope(user, active_client_id) do
    memberships =
      Membership
      |> where([m], m.user_id == ^user.id and m.status == "active")
      |> preload(:client)
      |> Repo.all()

    client_ids = Enum.map(memberships, & &1.client_id)

    selected_client_id =
      if active_client_id in client_ids do
        active_client_id
      else
        List.first(client_ids)
      end

    selected_membership = Enum.find(memberships, &(&1.client_id == selected_client_id))

    %Scope{
      user: user,
      system_role: user.system_role,
      client_ids: client_ids,
      active_client_id: selected_client_id,
      role: selected_membership && selected_membership.role,
      permissions: (selected_membership && selected_membership.permissions) || []
    }
  end

  defp super_admin_scope(user, active_client_id) do
    client_ids =
      Client
      |> where([client], client.status == "active")
      |> order_by([client], asc: client.name)
      |> select([client], client.id)
      |> Repo.all()

    selected_client_id =
      if active_client_id in client_ids, do: active_client_id, else: List.first(client_ids)

    %Scope{
      user: user,
      system_role: "super_admin",
      client_ids: client_ids,
      active_client_id: selected_client_id,
      role: "super_admin",
      permissions: ["*"]
    }
  end

  def client_allowed?(%Scope{client_ids: client_ids}, client_id) when is_binary(client_id) do
    client_id in client_ids
  end

  def client_allowed?(_, _), do: false

  def require_client(%Scope{} = scope, client_id) do
    if client_allowed?(scope, client_id), do: {:ok, scope}, else: {:error, :forbidden}
  end

  def require_client(_, _), do: {:error, :unauthenticated}

  @doc "Revalidates a client membership from the database for a sensitive operation."
  def require_current_client(%Scope{user: %{id: user_id}} = scope, client_id)
      when is_binary(client_id) do
    case Repo.get(User, user_id) do
      %User{system_role: "super_admin"} ->
        case Repo.get_by(Client, id: client_id, status: "active") do
          %Client{} ->
            {:ok,
             %{
               scope
               | active_client_id: client_id,
                 system_role: "super_admin",
                 role: "super_admin",
                 permissions: ["*"]
             }}

          nil ->
            {:error, :forbidden}
        end

      %User{} ->
        require_current_membership(scope, user_id, client_id)

      nil ->
        {:error, :forbidden}
    end
  end

  def require_current_client(%Scope{}, _client_id), do: {:error, :forbidden}
  def require_current_client(_, _client_id), do: {:error, :unauthenticated}

  defp require_current_membership(scope, user_id, client_id) do
    Membership
    |> join(:inner, [membership], client in assoc(membership, :client))
    |> where(
      [membership, client],
      membership.user_id == ^user_id and membership.client_id == ^client_id and
        membership.status == "active" and client.status == "active"
    )
    |> Repo.one()
    |> case do
      %Membership{} = membership ->
        {:ok,
         %{
           scope
           | active_client_id: client_id,
             role: membership.role,
             permissions: membership.permissions
         }}

      nil ->
        {:error, :forbidden}
    end
  end

  def require_active_client(%Scope{active_client_id: client_id} = scope, client_id)
      when is_binary(client_id),
      do: {:ok, scope}

  def require_active_client(%Scope{}, _client_id), do: {:error, :forbidden}
  def require_active_client(_, _client_id), do: {:error, :unauthenticated}
end
