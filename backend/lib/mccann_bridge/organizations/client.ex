defmodule McCannBridge.Organizations.Client do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "clients" do
    field :name, :string
    field :slug, :string
    field :status, :string, default: "active"

    has_many :memberships, McCannBridge.Organizations.Membership

    timestamps(type: :utc_datetime)
  end

  def changeset(client, attrs) do
    client
    |> cast(attrs, [:name, :slug, :status])
    |> validate_required([:name, :slug, :status])
    |> validate_format(:slug, ~r/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    |> validate_inclusion(:status, ~w(active suspended closed))
    |> unique_constraint(:slug)
  end
end
