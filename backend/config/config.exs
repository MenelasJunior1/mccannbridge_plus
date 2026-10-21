# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :mccann_bridge, :scopes,
  user: [
    default: true,
    module: McCannBridge.Accounts.Scope,
    assign_key: :current_scope,
    access_path: [:user, :id],
    schema_key: :user_id,
    schema_type: :binary_id,
    schema_table: :users,
    test_data_fixture: McCannBridge.AccountsFixtures,
    test_setup_helper: :register_and_log_in_user
  ]

config :mccann_bridge,
  namespace: McCannBridge,
  ecto_repos: [McCannBridge.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

# Configure the endpoint
config :mccann_bridge, McCannBridgeWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: McCannBridgeWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: McCannBridge.PubSub

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

config :swoosh, :api_client, Swoosh.ApiClient.Req

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
