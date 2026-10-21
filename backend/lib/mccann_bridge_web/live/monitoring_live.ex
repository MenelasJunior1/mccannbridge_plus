defmodule McCannBridgeWeb.MonitoringLive do
  use McCannBridgeWeb, :live_view

  alias McCannBridge.Monitoring

  on_mount {McCannBridgeWeb.SuperAdminAuth, :require_super_admin}

  @impl true
  def mount(_params, _session, socket) do
    {:ok, load_snapshot(socket)}
  end

  @impl true
  def handle_event("refresh", _params, socket) do
    {:noreply, load_snapshot(socket)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.bridge flash={@flash} current_scope={@current_scope} active_nav={:monitoring}>
      <section class="monitoring-page" id="monitoring-page">
        <header class="monitoring-header">
          <div>
            <p class="eyebrow">Administration système</p>
            <h1>Audit & monitoring</h1>
            <p>État opérationnel, configuration de l’assistant et trace des actions sensibles.</p>
          </div>
          <button
            id="refresh-monitoring"
            type="button"
            phx-click="refresh"
            class="bridge-button bridge-button-primary"
          >
            Actualiser
          </button>
        </header>

        <section class="monitoring-cards" aria-label="Indicateurs système">
          <.metric_card label="Utilisateurs" value={@snapshot.counts.users} />
          <.metric_card label="Clients actifs" value={@snapshot.counts.clients} />
          <.metric_card label="Documents" value={@snapshot.counts.documents} />
          <.metric_card label="Chunks actifs" value={@snapshot.counts.active_chunks} />
          <.metric_card label="Événements / 24 h" value={@snapshot.counts.audit_24h} />
          <.metric_card
            label="Échecs IA / 24 h"
            value={@snapshot.counts.assistant_failures_24h}
            tone={if @snapshot.counts.assistant_failures_24h > 0, do: "warning", else: "success"}
          />
        </section>

        <section class="monitoring-health-grid">
          <article class="monitoring-panel" id="runtime-status">
            <div class="monitoring-panel-heading">
              <div>
                <p class="eyebrow">Runtime</p>
                <h2>Application Phoenix</h2>
              </div>
              <span class="status-pill is-success">Opérationnelle</span>
            </div>
            <dl class="monitoring-definition-list">
              <div>
                <dt>Base de données</dt>
                <dd>{@snapshot.runtime.database}</dd>
              </div>
              <div>
                <dt>Uptime</dt>
                <dd>{format_duration(@snapshot.runtime.uptime_seconds)}</dd>
              </div>
              <div>
                <dt>Mémoire BEAM</dt>
                <dd>{format_bytes(@snapshot.runtime.memory_bytes)}</dd>
              </div>
              <div>
                <dt>Processus</dt>
                <dd>{@snapshot.runtime.process_count} / {@snapshot.runtime.process_limit}</dd>
              </div>
              <div>
                <dt>Schedulers</dt>
                <dd>{@snapshot.runtime.schedulers}</dd>
              </div>
            </dl>
          </article>

          <article class="monitoring-panel" id="assistant-status">
            <div class="monitoring-panel-heading">
              <div>
                <p class="eyebrow">Génération externe</p>
                <h2>Assistant IA</h2>
              </div>
              <span class={status_class(@snapshot.assistant.state)}>
                {status_label(@snapshot.assistant.state)}
              </span>
            </div>
            <dl class="monitoring-definition-list">
              <div>
                <dt>Fournisseur</dt>
                <dd>{@snapshot.assistant.provider}</dd>
              </div>
              <div>
                <dt>Modèle</dt>
                <dd>{@snapshot.assistant.model || "Non configuré"}</dd>
              </div>
              <div :if={Map.has_key?(@snapshot.assistant, :api_key_present)}>
                <dt>Clé serveur</dt>
                <dd>{if @snapshot.assistant.api_key_present, do: "Présente", else: "Absente"}</dd>
              </div>
              <div :if={Map.has_key?(@snapshot.assistant, :zdr_confirmed)}>
                <dt>Zero Data Retention</dt>
                <dd>{if @snapshot.assistant.zdr_confirmed, do: "Confirmé", else: "À confirmer"}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section class="monitoring-panel audit-panel" id="audit-log">
          <div class="monitoring-panel-heading">
            <div>
              <p class="eyebrow">Journal immuable</p>
              <h2>Derniers événements</h2>
            </div>
            <small>Actualisé le {format_datetime(@snapshot.generated_at)}</small>
          </div>
          <div class="audit-table-wrap">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Acteur</th>
                  <th>Client</th>
                  <th>Détails</th>
                </tr>
              </thead>
              <tbody id="audit-events" phx-update="stream">
                <tr :for={{dom_id, event} <- @streams.events} id={dom_id}>
                  <td>{format_datetime(event.inserted_at)}</td>
                  <td><strong>{event.action}</strong><small>{event.resource_type}</small></td>
                  <td>{actor_label(event)}</td>
                  <td>{client_label(event)}</td>
                  <td><code>{metadata_label(event.metadata)}</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p :if={@events_empty} class="audit-empty">Aucun événement d’audit enregistré.</p>
        </section>
      </section>
    </Layouts.bridge>
    """
  end

  attr :label, :string, required: true
  attr :value, :any, required: true
  attr :tone, :string, default: "default"

  defp metric_card(assigns) do
    ~H"""
    <article class={["monitoring-card", "is-#{@tone}"]}>
      <small>{@label}</small><strong>{@value}</strong>
    </article>
    """
  end

  defp load_snapshot(socket) do
    {:ok, snapshot} = Monitoring.snapshot(socket.assigns.current_scope)

    socket
    |> assign(:snapshot, snapshot)
    |> assign(:events_empty, snapshot.events == [])
    |> stream(:events, snapshot.events, reset: true)
  end

  defp actor_label(%{actor: nil}), do: "Système"
  defp actor_label(%{actor: actor}), do: actor.email
  defp client_label(%{client: nil}), do: "Global"
  defp client_label(%{client: client}), do: client.name

  defp metadata_label(metadata) when metadata == %{}, do: "—"
  defp metadata_label(metadata), do: Jason.encode!(metadata)

  defp status_class("ready"), do: "status-pill is-success"
  defp status_class(_state), do: "status-pill is-warning"

  defp status_label("ready"), do: "Prêt"
  defp status_label("disabled"), do: "Désactivé"
  defp status_label("zdr_not_confirmed"), do: "ZDR requis"
  defp status_label("missing_api_key"), do: "Clé absente"
  defp status_label(_state), do: "Configuré"

  defp format_datetime(datetime) do
    Calendar.strftime(datetime, "%d/%m/%Y %H:%M:%S UTC")
  end

  defp format_duration(seconds) do
    days = div(seconds, 86_400)
    hours = seconds |> rem(86_400) |> div(3_600)
    "#{days} j #{hours} h"
  end

  defp format_bytes(bytes) when bytes >= 1_073_741_824,
    do: "#{Float.round(bytes / 1_073_741_824, 1)} Go"

  defp format_bytes(bytes), do: "#{Float.round(bytes / 1_048_576, 1)} Mo"
end
