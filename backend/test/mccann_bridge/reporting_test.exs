defmodule McCannBridge.ReportingTest do
  use ExUnit.Case, async: true

  alias McCannBridge.Reporting

  test "only client reviewers and admins can approve a report" do
    assert Reporting.transition_allowed?("client_review", "approved", "client_reviewer")
    assert Reporting.transition_allowed?("client_review", "approved", "admin")
    refute Reporting.transition_allowed?("client_review", "approved", "agency")
    refute Reporting.transition_allowed?("draft", "published", "admin")
  end

  test "published reports are terminal" do
    refute Reporting.transition_allowed?("published", "draft", "admin")
  end
end
