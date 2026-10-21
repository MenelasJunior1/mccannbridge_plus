defmodule McCannBridge.AssistantTest do
  use McCannBridge.DataCase, async: true

  alias McCannBridge.AccountsFixtures
  alias McCannBridge.Assistant
  alias McCannBridge.AssistantProviderStub
  alias McCannBridge.Audit.Event
  alias McCannBridge.Knowledge
  alias McCannBridge.Knowledge.Storage
  alias McCannBridge.Organizations
  alias McCannBridge.Organizations.{Client, Membership}
  alias McCannBridge.Repo

  test "returns only the source identifiers cited and reauthorized by Phoenix" do
    %{scope: scope, client: client, chunk: chunk} = approved_source_fixture()

    result = %{
      answer: "La proximité est l'axe prioritaire [S1].",
      used_source_ids: [chunk.id],
      limitations: [],
      provider: "groq",
      model: "openai/gpt-oss-20b"
    }

    assert {:ok, response} =
             Assistant.ask(scope, client.id, "proximité",
               provider: AssistantProviderStub,
               stub_result: {:ok, result},
               test_pid: self()
             )

    assert response.grounded
    assert response.provider == "groq"
    assert response.model == "openai/gpt-oss-20b"
    assert response.limitations == []
    assert [%{chunk_id: chunk_id, ref: "S1"}] = response.citations
    assert chunk_id == chunk.id
    assert is_binary(response.request_id)

    assert audit_event =
             Repo.get_by(Event,
               action: "assistant.query.completed",
               resource_id: response.request_id
             )

    assert audit_event.metadata["grounded"]
    assert audit_event.metadata["citation_count"] == 1
    refute Map.has_key?(audit_event.metadata, "question")

    assert_receive {:assistant_generation_requested, "proximité", [source]}
    assert source.id == chunk.id
    assert source.ref == "S1"
  end

  test "marks an answer without a verified source as ungrounded" do
    %{scope: scope, client: client} = approved_source_fixture()

    result = %{
      answer: "Je ne dispose pas d'une source interne pertinente.",
      used_source_ids: [],
      limitations: ["insufficient_context"],
      provider: "groq",
      model: "openai/gpt-oss-20b"
    }

    assert {:ok, response} =
             Assistant.ask(scope, client.id, "question totalement absente",
               provider: AssistantProviderStub,
               stub_result: {:ok, result}
             )

    refute response.grounded
    assert response.citations == []
    assert response.answer =~ "Réponse non fondée sur la base documentaire interne"
    assert "insufficient_context" in response.limitations
    assert "no_verified_source_found" in response.limitations
  end

  test "rejects invented source identifiers from the provider" do
    %{scope: scope, client: client} = approved_source_fixture()
    invented_id = Ecto.UUID.generate()

    result = %{
      answer: "Affirmation [S1].",
      used_source_ids: [invented_id],
      limitations: [],
      provider: "groq",
      model: "openai/gpt-oss-20b"
    }

    assert {:error, :service_unavailable, response} =
             Assistant.ask(scope, client.id, "proximité",
               provider: AssistantProviderStub,
               stub_result: {:ok, result}
             )

    assert response.citations == []
    assert response.limitations == ["invalid_provider_response"]
  end

  test "fails closed when membership is revoked during external generation" do
    %{scope: scope, client: client, membership: membership, chunk: chunk} =
      approved_source_fixture()

    result = %{
      answer: "La proximité est prioritaire [S1].",
      used_source_ids: [chunk.id],
      limitations: [],
      provider: "groq",
      model: "openai/gpt-oss-20b"
    }

    revoke_membership = fn ->
      membership
      |> Membership.changeset(%{status: "suspended"})
      |> Repo.update!()
    end

    assert {:error, :source_scope_changed} =
             Assistant.ask(scope, client.id, "proximité",
               provider: AssistantProviderStub,
               stub_result: {:ok, result},
               on_generate: revoke_membership
             )
  end

  defp approved_source_fixture do
    user = AccountsFixtures.user_fixture()
    client = client_fixture()
    membership = membership_fixture(user, client)
    scope = Organizations.scope_for_user(user, client.id)
    path = temp_document!("La campagne Ramadan privilégie la proximité et la confiance.")

    assert {:ok, %{version: version}} =
             Knowledge.ingest_upload(
               scope,
               client.id,
               %{"title" => "Guide Ramadan", "classification" => "internal"},
               %{path: path, filename: "guide.md", content_type: "text/markdown"}
             )

    on_exit(fn -> Storage.module().delete(version.storage_key) end)
    assert {:ok, _approved} = Knowledge.approve_version(scope, version.id)
    assert {:ok, [chunk]} = Knowledge.search(scope, client.id, "proximité")

    %{scope: scope, client: client, membership: membership, chunk: chunk}
  end

  defp client_fixture do
    suffix = System.unique_integer([:positive])

    Repo.insert!(
      Client.changeset(%Client{}, %{
        name: "Client #{suffix}",
        slug: "client-#{suffix}",
        status: "active"
      })
    )
  end

  defp membership_fixture(user, client) do
    %Membership{user_id: user.id, client_id: client.id}
    |> Membership.changeset(%{role: "agency", status: "active", permissions: []})
    |> Repo.insert!()
  end

  defp temp_document!(content) do
    path = Path.join(System.tmp_dir!(), "assistant-#{System.unique_integer([:positive])}.txt")
    File.write!(path, content)
    on_exit(fn -> File.rm(path) end)
    path
  end
end
