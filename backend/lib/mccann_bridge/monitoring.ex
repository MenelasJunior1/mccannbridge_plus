defmodule McCannBridge.Monitoring do
  @moduledoc "Safe operational snapshot reserved for system super administrators."

  import Ecto.Query

  alias McCannBridge.Accounts
  alias McCannBridge.Accounts.{Scope, User}
  alias McCannBridge.Assistant
  alias McCannBridge.Audit
  alias McCannBridge.Audit.Event
  alias McCannBridge.Knowledge.{Chunk, Document}
  alias McCannBridge.Organizations.Client
  alias McCannBridge.Repo

  def snapshot(%Scope{} = scope) do
    with {:ok, current_scope} <- Accounts.require_super_admin(scope),
         {:ok, events} <- Audit.list_events(current_scope, limit: 60) do
      {:ok,
       %{
         counts: counts(),
         runtime: runtime(),
         assistant: Assistant.configuration_status(),
         events: events,
         generated_at: DateTime.utc_now(:second)
       }}
    end
  end

  def snapshot(_), do: {:error, :unauthenticated}

  defp counts do
    since = DateTime.utc_now(:second) |> DateTime.add(-24, :hour)

    %{
      users: Repo.aggregate(User, :count),
      clients: Repo.aggregate(from(client in Client, where: client.status == "active"), :count),
      documents: Repo.aggregate(Document, :count),
      active_chunks: Repo.aggregate(from(chunk in Chunk, where: chunk.active), :count),
      audit_24h: Repo.aggregate(from(event in Event, where: event.inserted_at >= ^since), :count),
      assistant_failures_24h:
        Repo.aggregate(
          from(event in Event,
            where: event.inserted_at >= ^since and event.action == "assistant.query.failed"
          ),
          :count
        )
    }
  end

  defp runtime do
    {uptime_ms, _since_last_call} = :erlang.statistics(:wall_clock)
    memory = :erlang.memory()

    %{
      database: "available",
      uptime_seconds: div(uptime_ms, 1_000),
      memory_bytes: Keyword.fetch!(memory, :total),
      process_count: :erlang.system_info(:process_count),
      process_limit: :erlang.system_info(:process_limit),
      schedulers: :erlang.system_info(:schedulers_online)
    }
  end
end
