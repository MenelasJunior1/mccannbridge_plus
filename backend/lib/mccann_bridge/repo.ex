defmodule McCannBridge.Repo do
  use Ecto.Repo,
    otp_app: :mccann_bridge,
    adapter: Ecto.Adapters.Postgres
end
