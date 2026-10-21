defmodule McCannBridge.Knowledge.Chunk do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "knowledge_chunks" do
    field :page, :integer
    field :section, :string
    field :position, :integer
    field :content, :string
    field :language, :string, default: "fr"
    field :content_sha256, :string
    field :active, :boolean, default: true

    belongs_to :document_version, McCannBridge.Knowledge.DocumentVersion

    timestamps(type: :utc_datetime)
  end

  def changeset(chunk, attrs) do
    chunk
    |> cast(attrs, [:page, :section, :position, :content, :language, :content_sha256, :active])
    |> validate_required([:position, :content, :language, :content_sha256, :active])
    |> validate_number(:position, greater_than_or_equal_to: 0)
    |> unique_constraint([:document_version_id, :position])
  end
end
