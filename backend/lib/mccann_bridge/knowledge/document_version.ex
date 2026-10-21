defmodule McCannBridge.Knowledge.DocumentVersion do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "document_versions" do
    field :number, :integer
    field :storage_key, :string
    field :sha256, :string
    field :mime_type, :string
    field :byte_size, :integer
    field :status, :string, default: "uploaded"
    field :approved_at, :utc_datetime
    field :extracted_at, :utc_datetime

    belongs_to :document, McCannBridge.Knowledge.Document
    belongs_to :uploaded_by, McCannBridge.Accounts.User
    belongs_to :approved_by, McCannBridge.Accounts.User
    has_many :chunks, McCannBridge.Knowledge.Chunk

    timestamps(type: :utc_datetime)
  end

  def changeset(version, attrs) do
    version
    |> cast(attrs, [:number, :storage_key, :sha256, :mime_type, :byte_size, :status])
    |> validate_required([:number, :storage_key, :sha256, :mime_type, :byte_size, :status])
    |> validate_number(:number, greater_than: 0)
    |> validate_number(:byte_size, greater_than: 0)
    |> validate_inclusion(
      :status,
      ~w(uploaded extracting needs_review approved rejected failed revoked)
    )
    |> unique_constraint([:document_id, :number])
    |> unique_constraint([:document_id, :sha256])
  end
end
