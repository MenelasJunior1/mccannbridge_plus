defmodule McCannBridge.Reporting do
  @moduledoc "Tenant-scoped report requests and server-authoritative workflow."

  import Ecto.Query

  alias Ecto.Multi
  alias McCannBridge.Accounts.Scope
  alias McCannBridge.Organizations
  alias McCannBridge.Repo
  alias McCannBridge.Reporting.ReportRequest

  @transitions %{
    "requested" => ~w(collecting),
    "collecting" => ~w(needs_data draft),
    "needs_data" => ~w(collecting),
    "draft" => ~w(internal_review),
    "internal_review" => ~w(draft client_review),
    "client_review" => ~w(draft approved),
    "approved" => ~w(published),
    "published" => []
  }

  def list_report_requests(%Scope{} = scope, client_id) do
    with {:ok, _scope} <- Organizations.require_client(scope, client_id) do
      {:ok,
       ReportRequest
       |> where([r], r.client_id == ^client_id)
       |> order_by([r], desc: r.inserted_at)
       |> Repo.all()}
    end
  end

  def create_report_request(%Scope{user: user} = scope, client_id, attrs) do
    with {:ok, _scope} <- Organizations.require_client(scope, client_id) do
      report_request =
        %ReportRequest{client_id: client_id, requested_by_id: user.id}
        |> ReportRequest.changeset(attrs)

      audit_attrs = fn report ->
        %{
          id: Ecto.UUID.generate(),
          client_id: client_id,
          actor_id: user.id,
          action: "report.requested",
          resource_type: "report_request",
          resource_id: report.id,
          metadata: %{}
        }
      end

      Multi.new()
      |> Multi.insert(:report_request, report_request)
      |> Multi.run(:audit_event, fn repo, %{report_request: report} ->
        repo.insert_all("audit_events", [Map.merge(audit_attrs.(report), timestamps())])
        |> case do
          {1, _} -> {:ok, :recorded}
          _ -> {:error, :audit_failed}
        end
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{report_request: report}} -> {:ok, report}
        {:error, _step, reason, _changes} -> {:error, reason}
      end
    end
  end

  def transition_allowed?(from, to, role) do
    to in Map.get(@transitions, from, []) and role_allowed?(to, role)
  end

  defp role_allowed?("client_review", role), do: role in ~w(admin agency)
  defp role_allowed?("approved", role), do: role in ~w(admin client_reviewer)
  defp role_allowed?("published", role), do: role in ~w(admin agency)
  defp role_allowed?(_status, role), do: role in ~w(admin agency)

  defp timestamps do
    now = DateTime.utc_now(:second)
    %{inserted_at: now}
  end
end
