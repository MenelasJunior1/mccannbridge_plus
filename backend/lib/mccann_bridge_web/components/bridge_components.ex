defmodule McCannBridgeWeb.BridgeComponents do
  @moduledoc "Small dependency-free icon set for the McCann Bridge interface."

  use Phoenix.Component

  attr :name, :atom, required: true
  attr :class, :string, default: nil

  def bridge_icon(assigns) do
    ~H"""
    <svg
      class={["bridge-svg-icon", @class]}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <%= case @name do %>
        <% :menu -> %>
          <path d="M4 7h16M4 12h16M4 17h16" />
        <% :moon -> %>
          <path d="M20 15.5A8 8 0 0 1 8.5 4 8.2 8.2 0 1 0 20 15.5Z" />
        <% :chevron_down -> %>
          <path d="m7 10 5 5 5-5" />
        <% :settings -> %>
          <circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        <% :logout -> %>
          <path d="M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4M16 16l4-4-4-4M20 12H9" />
        <% :close -> %>
          <path d="m6 6 12 12M18 6 6 18" />
        <% :chevron_left -> %>
          <path d="m15 18-6-6 6-6" />
        <% :dashboard -> %>
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1"
          /><rect x="3" y="14" width="7" height="7" rx="1" /><rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="1"
          />
        <% :projects -> %>
          <path d="M6 3h9l3 3v15H6zM9 10h6M9 14h6M9 18h4" />
        <% :assistant -> %>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /><circle
            cx="12"
            cy="12"
            r="3"
          />
        <% :document -> %>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />
        <% :reports -> %>
          <path d="M5 20V10M12 20V4M19 20v-7" />
        <% :shield -> %>
          <path d="M12 3.5 5.5 6.5v5.2c0 4 2.8 6.9 6.5 8.3 3.7-1.4 6.5-4.3 6.5-8.3V6.5z" /><path d="m9 12 2 2 4-4" />
        <% :user -> %>
          <circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.2-3 3.5-4.5 6.5-4.5s5.3 1.5 6.5 4.5" />
        <% :upload -> %>
          <path d="M12 16V4M7 9l5-5 5 5M5 14v5h14v-5" />
        <% :stack -> %>
          <ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
        <% :clock -> %>
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        <% :search -> %>
          <circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" />
      <% end %>
    </svg>
    """
  end
end
