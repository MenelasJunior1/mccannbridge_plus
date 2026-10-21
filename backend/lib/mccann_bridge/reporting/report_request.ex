defmodule McCannBridge.Reporting.ReportRequest do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "report_requests" do
    field :title, :string
    field :report_type, :string
    field :period_start, :date
    field :period_end, :date
    field :status, :string, default: "requested"
    field :requested_sections, {:array, :string}, default: []
    field :lock_version, :integer, default: 1

    belongs_to :client, McCannBridge.Organizations.Client
    belongs_to :requested_by, McCannBridge.Accounts.User
    has_many :snapshots, McCannBridge.Reporting.ReportSnapshot
    has_many :versions, McCannBridge.Reporting.ReportVersion

    timestamps(type: :utc_datetime)
  end

  def changeset(report_request, attrs) do
    report_request
    |> cast(attrs, [:title, :report_type, :period_start, :period_end, :requested_sections])
    |> validate_required([:title, :report_type, :period_start, :period_end])
    |> validate_inclusion(:report_type, ~w(weekly monthly campaign benchmark executive ad_hoc))
    |> validate_period()
  end

  def transition_changeset(report_request, status) do
    report_request
    |> change(status: status)
    |> optimistic_lock(:lock_version)
  end

  defp validate_period(changeset) do
    start_date = get_field(changeset, :period_start)
    end_date = get_field(changeset, :period_end)

    if start_date && end_date && Date.after?(start_date, end_date) do
      add_error(changeset, :period_end, "must be on or after period_start")
    else
      changeset
    end
  end
end
