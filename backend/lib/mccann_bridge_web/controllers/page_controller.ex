defmodule McCannBridgeWeb.PageController do
  use McCannBridgeWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
