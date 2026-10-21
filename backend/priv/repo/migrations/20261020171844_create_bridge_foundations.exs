defmodule McCannBridge.Repo.Migrations.CreateBridgeFoundations do
  use Ecto.Migration

  def change do
    create table(:clients, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :slug, :string, null: false
      add :status, :string, null: false, default: "active"

      timestamps(type: :utc_datetime)
    end

    create unique_index(:clients, [:slug])

    create table(:memberships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :client_id, references(:clients, type: :binary_id, on_delete: :delete_all), null: false
      add :role, :string, null: false
      add :status, :string, null: false, default: "active"
      add :permissions, {:array, :string}, null: false, default: []

      timestamps(type: :utc_datetime)
    end

    create unique_index(:memberships, [:user_id, :client_id])
    create index(:memberships, [:client_id, :status])

    create constraint(:memberships, :memberships_role_check,
             check:
               "role IN ('admin', 'agency', 'client_reviewer', 'client_contributor', 'client_reader')"
           )

    create constraint(:memberships, :memberships_status_check,
             check: "status IN ('invited', 'active', 'suspended', 'closed')"
           )

    create table(:documents, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_id, references(:clients, type: :binary_id, on_delete: :restrict), null: false
      add :owner_id, references(:users, type: :binary_id, on_delete: :restrict), null: false
      add :title, :string, null: false
      add :classification, :string, null: false, default: "internal"
      add :status, :string, null: false, default: "draft"
      add :current_version_number, :integer, null: false, default: 0

      timestamps(type: :utc_datetime)
    end

    create index(:documents, [:client_id, :status])

    create table(:document_versions, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :document_id, references(:documents, type: :binary_id, on_delete: :delete_all),
        null: false

      add :number, :integer, null: false
      add :storage_key, :string, null: false
      add :sha256, :string, null: false
      add :mime_type, :string, null: false
      add :byte_size, :bigint, null: false
      add :status, :string, null: false, default: "uploaded"
      add :uploaded_by_id, references(:users, type: :binary_id, on_delete: :restrict), null: false
      add :approved_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :approved_at, :utc_datetime
      add :extracted_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:document_versions, [:document_id, :number])
    create unique_index(:document_versions, [:document_id, :sha256])

    create table(:knowledge_chunks, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :document_version_id,
          references(:document_versions, type: :binary_id, on_delete: :delete_all),
          null: false

      add :page, :integer
      add :section, :string
      add :position, :integer, null: false
      add :content, :text, null: false
      add :language, :string, null: false, default: "fr"
      add :content_sha256, :string, null: false
      add :active, :boolean, null: false, default: true

      timestamps(type: :utc_datetime)
    end

    create unique_index(:knowledge_chunks, [:document_version_id, :position])
    create index(:knowledge_chunks, [:document_version_id, :active])

    execute(
      "CREATE INDEX knowledge_chunks_search_idx ON knowledge_chunks USING GIN (to_tsvector('french', content))"
    )

    create table(:assistant_conversations, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_id, references(:clients, type: :binary_id, on_delete: :delete_all), null: false
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :title, :string, null: false

      timestamps(type: :utc_datetime)
    end

    create index(:assistant_conversations, [:client_id, :user_id])

    create table(:assistant_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :conversation_id,
          references(:assistant_conversations, type: :binary_id, on_delete: :delete_all),
          null: false

      add :role, :string, null: false
      add :content, :text, null: false
      add :grounded, :boolean, null: false, default: false
      add :provider, :string
      add :model, :string
      add :limitations, {:array, :string}, null: false, default: []

      timestamps(type: :utc_datetime)
    end

    create index(:assistant_messages, [:conversation_id, :inserted_at])

    create table(:message_citations, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :message_id, references(:assistant_messages, type: :binary_id, on_delete: :delete_all),
        null: false

      add :knowledge_chunk_id,
          references(:knowledge_chunks, type: :binary_id, on_delete: :restrict),
          null: false

      add :rank, :integer, null: false
      add :excerpt, :text, null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:message_citations, [:message_id, :rank])

    create table(:report_requests, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_id, references(:clients, type: :binary_id, on_delete: :restrict), null: false

      add :requested_by_id, references(:users, type: :binary_id, on_delete: :restrict),
        null: false

      add :title, :string, null: false
      add :report_type, :string, null: false
      add :period_start, :date, null: false
      add :period_end, :date, null: false
      add :status, :string, null: false, default: "requested"
      add :requested_sections, {:array, :string}, null: false, default: []
      add :lock_version, :integer, null: false, default: 1

      timestamps(type: :utc_datetime)
    end

    create index(:report_requests, [:client_id, :status])

    create table(:report_snapshots, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :report_request_id,
          references(:report_requests, type: :binary_id, on_delete: :delete_all),
          null: false

      add :sequence, :integer, null: false
      add :metrics, :map, null: false, default: %{}
      add :sources, {:array, :map}, null: false, default: []
      add :quality, :map, null: false, default: %{}
      add :captured_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:report_snapshots, [:report_request_id, :sequence])

    create table(:report_versions, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :report_request_id,
          references(:report_requests, type: :binary_id, on_delete: :delete_all),
          null: false

      add :snapshot_id, references(:report_snapshots, type: :binary_id, on_delete: :restrict),
        null: false

      add :number, :integer, null: false
      add :status, :string, null: false, default: "draft"
      add :sections, :map, null: false, default: %{}
      add :provider, :string
      add :model, :string
      add :prompt_version, :string
      add :approved_by_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :approved_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:report_versions, [:report_request_id, :number])

    create table(:report_exports, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :report_version_id,
          references(:report_versions, type: :binary_id, on_delete: :delete_all),
          null: false

      add :format, :string, null: false
      add :storage_key, :string, null: false
      add :sha256, :string, null: false
      add :byte_size, :bigint, null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:report_exports, [:report_version_id, :format])

    create table(:audit_events, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :client_id, references(:clients, type: :binary_id, on_delete: :nilify_all)
      add :actor_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :action, :string, null: false
      add :resource_type, :string, null: false
      add :resource_id, :binary_id
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:audit_events, [:client_id, :inserted_at])
  end
end
