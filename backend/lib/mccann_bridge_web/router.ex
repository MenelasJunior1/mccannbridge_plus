defmodule McCannBridgeWeb.Router do
  use McCannBridgeWeb, :router

  import McCannBridgeWeb.ApiAuth

  pipeline :api do
    plug :accepts, ["json"]
    plug :put_secure_browser_headers
  end

  pipeline :session_api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :put_secure_browser_headers
    plug :fetch_current_scope
  end

  pipeline :authenticated_api do
    plug :accepts, ["json"]
    plug :fetch_session
    plug :put_secure_browser_headers
    plug :fetch_current_scope
    plug :require_authenticated_user
  end

  scope "/api", McCannBridgeWeb do
    pipe_through :api

    get "/health", HealthController, :show
  end

  scope "/api/v1", McCannBridgeWeb do
    pipe_through :session_api

    post "/auth/login", AuthController, :login
    post "/auth/magic-link", AuthController, :request_magic_link
    post "/auth/magic-link/confirm", AuthController, :confirm_magic_link
  end

  scope "/api/v1", McCannBridgeWeb do
    pipe_through :authenticated_api

    get "/auth/session", AuthController, :show
    delete "/auth/session", AuthController, :delete
    post "/assistant/query", AssistantController, :create
    get "/documents", DocumentController, :index
    post "/documents", DocumentController, :create
    post "/document-versions/:id/approve", DocumentController, :approve
    get "/monitoring", MonitoringController, :show
  end
end
