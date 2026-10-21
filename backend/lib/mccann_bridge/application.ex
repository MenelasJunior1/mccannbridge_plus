defmodule McCannBridge.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      McCannBridgeWeb.Telemetry,
      McCannBridge.Repo,
      {DNSCluster, query: Application.get_env(:mccann_bridge, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: McCannBridge.PubSub},
      # Start a worker by calling: McCannBridge.Worker.start_link(arg)
      # {McCannBridge.Worker, arg},
      # Start to serve requests, typically the last entry
      McCannBridgeWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: McCannBridge.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    McCannBridgeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
