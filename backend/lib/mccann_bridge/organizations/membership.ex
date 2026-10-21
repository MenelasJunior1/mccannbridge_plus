defmodule McCannBridge.Organizations.Membership do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @roles ~w(admin agency client_reviewer client_contributor client_reader)
  @statuses ~w(invited active suspended closed)

  schema "memberships" do
    field :role, :string
    field :status, :string, default: "active"
    field :permissions, {:array, :string}, default: []

    belongs_to :user, McCannBridge.Accounts.User
    belongs_to :client, McCannBridge.Organizations.Client

    timestamps(type: :utc_datetime)
  end

  def changeset(membership, attrs) do
    membership
    |> cast(attrs, [:role, :status, :permissions])
    |> validate_required([:role, :status])
    |> validate_inclusion(:role, @roles)
    |> validate_inclusion(:status, @statuses)
    |> unique_constraint([:user_id, :client_id])
  end
end
