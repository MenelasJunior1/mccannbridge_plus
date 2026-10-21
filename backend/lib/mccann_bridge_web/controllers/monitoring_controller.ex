defmodule McCannBridgeWeb.MonitoringController do
  use McCannBridgeWeb, :controller

  alias McCannBridge.Monitoring

  def show(conn, _params) do
    case Monitoring.snapshot(conn.assigns.current_scope) do
      {:ok, snapshot} -> json(conn, serialize(snapshot))
      {:error, :forbidden} -> conn |> put_status(:forbidden) |> json(%{error: "forbidden"})
      {:error, _reason} -> conn |> put_status(:unauthorized) |> json(%{error: "unauthenticated"})
    end
  end

  defp serialize(snapshot) do
    %{
      counts: snapshot.counts,
      runtime: snapshot.runtime,
      assistant: snapshot.assistant,
      generated_at: snapshot.generated_at,
      events: Enum.map(snapshot.events, &serialize_event/1)
    }
  end

  defp serialize_event(event) do
    %{
      id: event.id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      metadata: event.metadata,
      inserted_at: event.inserted_at,
      actor: event.actor && %{id: event.actor.id, email: event.actor.email},
      client: event.client && %{id: event.client.id, name: event.client.name}
    }
  end
end
