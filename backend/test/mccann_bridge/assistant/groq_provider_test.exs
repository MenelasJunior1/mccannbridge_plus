defmodule McCannBridge.Assistant.GroqProviderTest do
  use ExUnit.Case, async: true

  alias McCannBridge.Assistant.GroqProvider

  @source %{
    id: "c7b68ec4-0aa7-4d8a-a50a-2f6212e02d64",
    ref: "S1",
    title: "Brief Ramadan",
    content: "La campagne met en avant la proximité.",
    page: 2
  }

  test "generation stays closed until enabled, ZDR-confirmed and configured" do
    assert {:error, :external_generation_disabled} =
             GroqProvider.generate("Question", [], config: [enabled: false])

    assert {:error, :zdr_not_confirmed} =
             GroqProvider.generate("Question", [],
               config: [enabled: true, zdr_confirmed: false, api_key: "key"]
             )

    assert {:error, :missing_api_key} =
             GroqProvider.generate("Question", [],
               config: [enabled: true, zdr_confirmed: true, api_key: ""]
             )
  end

  test "checks credentials and model availability without sending content" do
    test_pid = self()

    request_fun = fn url, options ->
      send(test_pid, {:groq_models_request, url, options})

      {:ok,
       %Req.Response{
         status: 200,
         body: %{"data" => [%{"id" => "openai/gpt-oss-20b", "active" => true}]}
       }}
    end

    assert {:ok, %{provider: "groq", model: "openai/gpt-oss-20b", model_available: true}} =
             GroqProvider.check_connection(
               config: enabled_config(),
               request_fun: request_fun
             )

    assert_receive {:groq_models_request, "https://api.groq.com/openai/v1/models", options}
    assert {"authorization", "Bearer test-key"} in options[:headers]
    refute Keyword.has_key?(options, :json)
  end

  test "uses Groq chat completions and parses the structured source contract" do
    test_pid = self()

    request_fun = fn url, options ->
      send(test_pid, {:groq_request, url, options})

      {:ok,
       %Req.Response{
         status: 200,
         body: %{
           "choices" => [
             %{
               "message" => %{
                 "content" =>
                   Jason.encode!(%{
                     answer: "La proximité est prioritaire [S1].",
                     used_source_ids: [@source.id],
                     limitations: []
                   })
               }
             }
           ]
         }
       }}
    end

    assert {:ok, generation} =
             GroqProvider.generate("Quel est l'axe ?", [@source],
               config: enabled_config(),
               request_fun: request_fun
             )

    assert generation == %{
             answer: "La proximité est prioritaire [S1].",
             used_source_ids: [@source.id],
             limitations: [],
             provider: "groq",
             model: "openai/gpt-oss-20b"
           }

    assert_receive {:groq_request, "https://api.groq.com/openai/v1/chat/completions", options}
    assert {"authorization", "Bearer test-key"} in options[:headers]
    refute Map.has_key?(options[:json], :store)
    assert options[:json].response_format.type == "json_schema"
    assert options[:json].model == "openai/gpt-oss-20b"

    [system_message, user_message] = options[:json].messages
    assert system_message.role == "system"
    assert user_message.role == "user"
    assert user_message.content =~ @source.id
    assert user_message.content =~ "S1"
  end

  test "normalizes provider failures without exposing their response body" do
    request_fun = fn _url, _options ->
      {:ok, %Req.Response{status: 429, body: %{"error" => "provider detail"}}}
    end

    assert {:error, :provider_rate_limited} =
             GroqProvider.generate("Question", [@source],
               config: enabled_config(),
               request_fun: request_fun
             )
  end

  test "rejects a malformed structured response" do
    request_fun = fn _url, _options ->
      {:ok,
       %Req.Response{
         status: 200,
         body: %{"choices" => [%{"message" => %{"content" => "not-json"}}]}
       }}
    end

    assert {:error, :invalid_provider_response} =
             GroqProvider.generate("Question", [@source],
               config: enabled_config(),
               request_fun: request_fun
             )
  end

  defp enabled_config do
    [
      enabled: true,
      zdr_confirmed: true,
      api_key: "test-key",
      base_url: "https://api.groq.com/openai/v1",
      model: "openai/gpt-oss-20b"
    ]
  end
end
