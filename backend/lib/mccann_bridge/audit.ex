defmodule McCannBridge.Audit do
  @moduledoc "Append-only audit trail for security and business-sensitive actions."

  import Ecto.Query

  alias McCannBridge.Accounts
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Audit.Event
  alias McCannBridge.Repo

  require Logger

  def record(scope, action, resource_type, opts \\ [])

  def record(scope, action, resource_type, opts)
      when (is_struct(scope, Scope) or is_nil(scope)) and is_binary(action) and
             is_binary(resource_type) and is_list(opts) do
    actor_id = Keyword.get(opts, :actor_id, scope_value(scope, :user_id))
    client_id = Keyword.get(opts, :client_id, scope_value(scope, :client_id))

    %Event{actor_id: actor_id, client_id: client_id}
    |> Event.changeset(%{
      action: action,
      resource_type: resource_type,
      resource_id: Keyword.get(opts, :resource_id),
      metadata: Keyword.get(opts, :metadata, %{})
    })
    |> Repo.insert()
  end

  @doc "Records an event without changing the result of the operation being observed."
  def record_safely(scope, action, resource_type, opts \\ []) do
    case record(scope, action, resource_type, opts) do
      {:ok, event} ->
        {:ok, event}

      {:error, changeset} = error ->
        Logger.error("audit event rejected",
          action: action,
          resource_type: resource_type,
          errors: inspect(changeset.errors)
        )

        error
    end
  end

  def list_events(scope, opts \\ [])

  def list_events(%Scope{} = scope, opts) do
    with {:ok, _scope} <- Accounts.require_super_admin(scope) do
      limit = opts |> Keyword.get(:limit, 50) |> min(100) |> max(1)

      events =
        Event
        |> order_by([event], desc: event.inserted_at, desc: event.id)
        |> limit(^limit)
        |> preload([:actor, :client])
        |> Repo.all()

      {:ok, events}
    end
  end

  def list_events(_, _), do: {:error, :unauthenticated}

  defp scope_value(%Scope{user: %{id: id}}, :user_id), do: id
  defp scope_value(%Scope{active_client_id: id}, :client_id), do: id
  defp scope_value(_, _), do: nil
end
