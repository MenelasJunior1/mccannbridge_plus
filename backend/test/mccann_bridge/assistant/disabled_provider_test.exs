defmodule McCannBridge.Assistant.DisabledProviderTest do
  use ExUnit.Case, async: true

  alias McCannBridge.Assistant.DisabledProvider

  test "external generation fails closed" do
    assert {:error, :external_generation_disabled} =
             DisabledProvider.generate("question", [], [])
  end
end
