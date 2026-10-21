defmodule McCannBridgeWeb.SuperAdminAuth do
  @moduledoc false

  use McCannBridgeWeb, :verified_routes

  alias McCannBridge.Accounts

  def on_mount(:require_super_admin, _params, _session, socket) do
    case Accounts.require_super_admin(socket.assigns.current_scope) do
      {:ok, current_scope} ->
        {:cont, Phoenix.Component.assign(socket, :current_scope, current_scope)}

      {:error, _reason} ->
        socket =
          socket
          |> Phoenix.LiveView.put_flash(:error, "Accès réservé au super administrateur.")
          |> Phoenix.LiveView.redirect(to: ~p"/documents")

        {:halt, socket}
    end
  end
end
