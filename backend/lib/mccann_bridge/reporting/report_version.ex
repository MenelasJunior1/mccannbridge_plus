defmodule McCannBridge.Reporting.ReportVersion do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "report_versions" do
    field :number, :integer
    field :status, :string, default: "draft"
    field :sections, :map, default: %{}
    field :provider, :string
    field :model, :string
    field :prompt_version, :string
    field :approved_at, :utc_datetime

    belongs_to :report_request, McCannBridge.Reporting.ReportRequest
    belongs_to :snapshot, McCannBridge.Reporting.ReportSnapshot
    belongs_to :approved_by, McCannBridge.Accounts.User

    timestamps(type: :utc_datetime)
  end
end
