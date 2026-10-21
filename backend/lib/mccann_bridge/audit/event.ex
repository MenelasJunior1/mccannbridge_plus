defmodule McCannBridge.Audit.Event do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "audit_events" do
    field :action, :string
    field :resource_type, :string
    field :resource_id, :binary_id
    field :metadata, :map, default: %{}

    belongs_to :client, McCannBridge.Organizations.Client
    belongs_to :actor, McCannBridge.Accounts.User

    timestamps(type: :utc_datetime, updated_at: false)
  end

  def changeset(event, attrs) do
    event
    |> cast(attrs, [:action, :resource_type, :resource_id, :metadata])
    |> validate_required([:action, :resource_type, :metadata])
    |> validate_length(:action, max: 120)
    |> validate_length(:resource_type, max: 80)
  end
end
