defmodule McCannBridge.Knowledge.Document do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "documents" do
    field :title, :string
    field :classification, :string, default: "internal"
    field :status, :string, default: "draft"
    field :current_version_number, :integer, default: 0

    belongs_to :client, McCannBridge.Organizations.Client
    belongs_to :owner, McCannBridge.Accounts.User
    has_many :versions, McCannBridge.Knowledge.DocumentVersion

    timestamps(type: :utc_datetime)
  end

  def changeset(document, attrs) do
    document
    |> cast(attrs, [:title, :classification, :status])
    |> validate_required([:title, :classification, :status])
    |> validate_inclusion(:classification, ~w(internal confidential client_shared))
    |> validate_inclusion(:status, ~w(draft active archived))
  end
end
