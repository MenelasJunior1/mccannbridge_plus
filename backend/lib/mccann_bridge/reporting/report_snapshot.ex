defmodule McCannBridge.Reporting.ReportSnapshot do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "report_snapshots" do
    field :sequence, :integer
    field :metrics, :map, default: %{}
    field :sources, {:array, :map}, default: []
    field :quality, :map, default: %{}
    field :captured_at, :utc_datetime

    belongs_to :report_request, McCannBridge.Reporting.ReportRequest

    timestamps(type: :utc_datetime)
  end
end
