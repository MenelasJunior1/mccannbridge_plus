defmodule McCannBridgeWeb.Layouts do
  @moduledoc """
  This module holds layouts and related functionality
  used by your application.
  """
  use McCannBridgeWeb, :html

  # Embed all files in layouts/* within this module.
  # The default root.html.heex file contains the HTML
  # skeleton of your application, namely HTML headers
  # and other static content.
  embed_templates "layouts/*"

  @doc """
  Renders your app layout.

  This function is typically invoked from every template,
  and it often contains your application menu, sidebar,
  or similar.

  ## Examples

      <Layouts.app flash={@flash}>
        <h1>Content</h1>
      </Layouts.app>

  """
  attr :flash, :map, required: true, doc: "the map of flash messages"

  attr :current_scope, :map,
    default: nil,
    doc: "the current [scope](https://hexdocs.pm/phoenix/scopes.html)"

  slot :inner_block, required: true

  def app(assigns) do
    ~H"""
    <div class="auth-shell">
      <aside class="auth-story">
        <.link navigate={~p"/"} class="bridge-wordmark">
          <span class="bridge-wordmark-mark">M</span>
          <span><strong>McCann Bridge</strong><small>Intelligence workspace</small></span>
        </.link>
        <div class="auth-story-copy">
          <p class="eyebrow">Workspace unifié</p>
          <h1>Transformez vos données en décisions utiles.</h1>
          <p>
            Documents, campagnes, rapports et assistant IA réunis dans un espace sécurisé.
          </p>
        </div>
        <div class="auth-story-grid" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </aside>
      <main class="auth-main">
        <div class="auth-mobile-brand">
          <span class="bridge-wordmark-mark">M</span><strong>McCann Bridge</strong>
        </div>
        <section class="auth-card">{render_slot(@inner_block)}</section>
      </main>
    </div>
    <.flash_group flash={@flash} />
    """
  end

  @doc "McCann Bridge application shell, adapted from the existing React interface."
  attr :flash, :map, required: true
  attr :current_scope, :map, required: true
  attr :active_nav, :atom, default: nil
  slot :inner_block, required: true

  def bridge(assigns) do
    ~H"""
    <div id="bridge-shell" class="bridge-shell" phx-hook="BridgeShell">
      <header class="bridge-header">
        <div class="bridge-header-left">
          <button
            type="button"
            class="bridge-icon-button bridge-menu-button"
            data-bridge-menu
            aria-label="Ouvrir le menu"
          >
            <.bridge_icon name={:menu} />
          </button>
          <.link navigate={~p"/documents"} class="bridge-header-brand">
            <span class="bridge-wordmark-mark">M</span><strong>McCann Bridge</strong>
          </.link>
          <div class="bridge-breadcrumb">
            <span>Espace de travail</span><b>/</b><strong>{nav_title(@active_nav)}</strong>
          </div>
        </div>
        <div class="bridge-header-right">
          <span class="bridge-online"><i></i> En ligne</span>
          <button
            type="button"
            class="bridge-icon-button"
            data-bridge-theme
            aria-label="Changer de thème"
          >
            <.bridge_icon name={:moon} />
          </button>
          <details class="bridge-account">
            <summary aria-label="Ouvrir le menu du compte">
              <span class="bridge-avatar">{initials(@current_scope.user.email)}</span>
              <span class="bridge-account-copy">
                <strong>{@current_scope.user.email}</strong><small>{scope_role(@current_scope)}</small>
              </span>
              <.bridge_icon name={:chevron_down} />
            </summary>
            <div class="bridge-account-menu">
              <.link navigate={~p"/users/settings"}>
                <.bridge_icon name={:settings} /> Paramètres
              </.link>
              <.link href={~p"/users/log-out"} method="delete" class="is-danger">
                <.bridge_icon name={:logout} /> Déconnexion
              </.link>
            </div>
          </details>
        </div>
      </header>

      <aside class="bridge-sidebar" aria-label="Navigation principale">
        <div class="bridge-sidebar-head">
          <.link navigate={~p"/documents"} class="bridge-wordmark" id="bridge-brand-link">
            <span class="bridge-wordmark-mark">M</span>
            <span><strong>McCann Bridge</strong><small>Intelligence workspace</small></span>
          </.link>
          <button
            type="button"
            class="bridge-sidebar-close"
            data-bridge-close
            aria-label="Fermer le menu"
          >
            <.bridge_icon name={:close} />
          </button>
        </div>
        <button
          type="button"
          class="bridge-sidebar-toggle"
          data-bridge-collapse
          aria-label="Replier le menu"
        >
          <.bridge_icon name={:chevron_left} />
        </button>

        <nav class="bridge-nav" id="bridge-primary-nav">
          <span class="bridge-nav-label">Pilotage</span>
          <span class="bridge-nav-item bridge-nav-item-muted">
            <.bridge_icon name={:dashboard} /><span class="bridge-nav-copy">Vue d’ensemble</span>
          </span>
          <span class="bridge-nav-item bridge-nav-item-muted">
            <.bridge_icon name={:projects} /><span class="bridge-nav-copy">Briefs & projets</span>
          </span>
          <span class="bridge-nav-label">Intelligence</span>
          <.link
            navigate={~p"/assistant"}
            class={["bridge-nav-item", @active_nav == :assistant && "is-active"]}
            id="assistant-nav-link"
          >
            <.bridge_icon name={:assistant} /><span class="bridge-nav-copy">Assistant IA</span>
          </.link>
          <.link
            navigate={~p"/documents"}
            class={["bridge-nav-item", @active_nav == :documents && "is-active"]}
            id="documents-nav-link"
          >
            <.bridge_icon name={:document} /><span class="bridge-nav-copy">Documents & RAG</span>
          </.link>
          <span class="bridge-nav-item bridge-nav-item-muted">
            <.bridge_icon name={:reports} /><span class="bridge-nav-copy">Rapports</span>
          </span>
          <.link
            :if={@current_scope.system_role == "super_admin"}
            navigate={~p"/monitoring"}
            class={["bridge-nav-item", @active_nav == :monitoring && "is-active"]}
            id="monitoring-nav-link"
          >
            <.bridge_icon name={:shield} /><span class="bridge-nav-copy">Audit & monitoring</span>
          </.link>
        </nav>

        <div class="bridge-sidebar-foot">
          <div class="bridge-security-cue">
            <.bridge_icon name={:shield} />
            <span><strong>Espace sécurisé</strong><small>Droits contrôlés par Phoenix</small></span>
          </div>
        </div>
      </aside>

      <button
        type="button"
        class="bridge-sidebar-backdrop"
        data-bridge-close
        aria-label="Fermer le menu"
      >
      </button>

      <main class="bridge-main">
        <div class="bridge-content">{render_slot(@inner_block)}</div>
      </main>

      <nav class="bridge-mobile-nav" aria-label="Navigation mobile">
        <span><.bridge_icon name={:dashboard} /><small>Accueil</small></span>
        <.link navigate={~p"/documents"} class={@active_nav == :documents && "is-active"}>
          <.bridge_icon name={:document} /><small>Documents</small>
        </.link>
        <.link
          navigate={~p"/assistant"}
          class={["bridge-mobile-main", @active_nav == :assistant && "is-active"]}
        >
          <.bridge_icon name={:assistant} /><small>Assistant</small>
        </.link>
        <.link
          :if={@current_scope.system_role == "super_admin"}
          navigate={~p"/monitoring"}
          class={@active_nav == :monitoring && "is-active"}
        >
          <.bridge_icon name={:shield} /><small>Monitoring</small>
        </.link>
        <span :if={@current_scope.system_role != "super_admin"}>
          <.bridge_icon name={:reports} /><small>Rapports</small>
        </span>
        <.link navigate={~p"/users/settings"}>
          <.bridge_icon name={:user} /><small>Compte</small>
        </.link>
      </nav>
    </div>
    <.flash_group flash={@flash} />
    """
  end

  defp initials(email) do
    email
    |> String.split(~r/[^[:alnum:]]/u, trim: true)
    |> Enum.take(2)
    |> Enum.map_join(&String.first/1)
    |> String.upcase()
  end

  defp nav_title(:assistant), do: "Assistant IA"
  defp nav_title(:documents), do: "Documents & RAG"
  defp nav_title(:monitoring), do: "Audit & monitoring"
  defp nav_title(_active_nav), do: "Espace de travail"

  defp scope_role(%{system_role: "super_admin"}), do: "super administrateur"
  defp scope_role(scope), do: scope.role || "membre"

  @doc """
  Shows the flash group with standard titles and content.

  ## Examples

      <.flash_group flash={@flash} />
  """
  attr :flash, :map, required: true, doc: "the map of flash messages"
  attr :id, :string, default: "flash-group", doc: "the optional id of flash container"

  def flash_group(assigns) do
    ~H"""
    <div id={@id} aria-live="polite">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />
    </div>
    """
  end
end
