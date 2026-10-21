defmodule McCannBridge.KnowledgeTest do
  use McCannBridge.DataCase, async: true

  alias McCannBridge.AccountsFixtures
  alias McCannBridge.Knowledge
  alias McCannBridge.Knowledge.{Chunk, Chunker, Storage}
  alias McCannBridge.Organizations
  alias McCannBridge.Organizations.{Client, Membership}
  alias McCannBridge.Repo

  test "an approved upload becomes searchable only inside its client scope" do
    user = AccountsFixtures.user_fixture()
    client = client_fixture("Orange Cameroun")
    membership_fixture(user, client, "agency")
    scope = Organizations.scope_for_user(user, client.id)
    path = temp_document!("La campagne Ramadan privilégie la proximité et la confiance.")

    assert {:ok, %{document: document, version: version, chunks: chunks}} =
             Knowledge.ingest_upload(
               scope,
               client.id,
               %{"title" => "Guide Ramadan", "classification" => "internal"},
               %{path: path, filename: "guide.md", content_type: "text/markdown"}
             )

    on_exit(fn -> Storage.module().delete(version.storage_key) end)

    assert document.status == "draft"
    assert version.status == "needs_review"
    assert chunks != []
    assert {:ok, []} = Knowledge.search(scope, client.id, "proximité")

    assert {:ok, %{version: approved_version, document: active_document}} =
             Knowledge.approve_version(scope, version.id)

    assert approved_version.status == "approved"
    assert active_document.status == "active"
    assert {:ok, [result]} = Knowledge.search(scope, client.id, "proximité")
    assert result.document_version.document.id == document.id
  end

  test "write authorization is evaluated for the active client" do
    user = AccountsFixtures.user_fixture()
    allowed_client = client_fixture("Client autorisé")
    forbidden_client = client_fixture("Client interdit")
    membership_fixture(user, allowed_client, "agency")
    membership_fixture(user, forbidden_client, "client_reader")
    scope = Organizations.scope_for_user(user, allowed_client.id)
    path = temp_document!("Contenu confidentiel")

    assert {:error, :forbidden} =
             Knowledge.ingest_upload(
               scope,
               forbidden_client.id,
               %{"title" => "Hors périmètre"},
               %{path: path, filename: "source.txt", content_type: "text/plain"}
             )

    refute Repo.exists?(Chunk)

    reader_scope = Organizations.scope_for_user(user, forbidden_client.id)

    assert {:error, :forbidden} =
             Knowledge.ingest_upload(
               reader_scope,
               forbidden_client.id,
               %{"title" => "Lecture seule"},
               %{path: path, filename: "source.txt", content_type: "text/plain"}
             )
  end

  test "chunking is deterministic and bounded" do
    content = String.duplicate("a", 1_250) <> "\n\n" <> String.duplicate("b", 200)
    chunks = Chunker.split(content, max_size: 500)

    assert Enum.map(chunks, & &1.position) == Enum.to_list(0..(length(chunks) - 1))
    assert Enum.all?(chunks, &(String.length(&1.content) <= 500))
    assert chunks == Chunker.split(content, max_size: 500)
  end

  defp client_fixture(name) do
    slug = "client-#{System.unique_integer([:positive])}"
    Repo.insert!(Client.changeset(%Client{}, %{name: name, slug: slug, status: "active"}))
  end

  defp membership_fixture(user, client, role) do
    %Membership{user_id: user.id, client_id: client.id}
    |> Membership.changeset(%{role: role, status: "active", permissions: []})
    |> Repo.insert!()
  end

  defp temp_document!(content) do
    path = Path.join(System.tmp_dir!(), "mccann-#{System.unique_integer([:positive])}.txt")
    File.write!(path, content)
    on_exit(fn -> File.rm(path) end)
    path
  end
end
