defmodule McCannBridgeWeb.HealthController do
  use McCannBridgeWeb, :controller

  def show(conn, _params) do
    json(conn, %{status: "ok", service: "mccann_bridge", version: "0.1.0"})
  end
end
