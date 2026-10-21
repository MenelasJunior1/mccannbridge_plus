defmodule McCannBridgeWeb.DocumentsLive do
  use McCannBridgeWeb, :live_view

  alias McCannBridge.Knowledge
  alias McCannBridge.Organizations

  @impl true
  def mount(_params, _session, socket) do
    scope = socket.assigns.current_scope
    clients = Organizations.list_clients(scope)
    client_id = scope.active_client_id || (List.first(clients) && List.first(clients).id)

    socket =
      socket
      |> assign(:page_title, "Documents & RAG")
      |> assign(:clients, clients)
      |> assign(:client_id, client_id)
      |> assign(:search, "")
      |> assign(:show_upload, false)
      |> assign(:can_write, can_write?(scope))
      |> assign(:upload_form, upload_form())
      |> allow_upload(:document,
        accept: ~w(.pdf .txt .md),
        max_entries: 1,
        max_file_size: 10_000_000
      )
      |> load_documents()

    {:ok, socket}
  end

  @impl true
  def handle_event("show-upload", _params, socket) do
    {:noreply, assign(socket, :show_upload, true)}
  end

  def handle_event("hide-upload", _params, socket) do
    {:noreply, assign(socket, :show_upload, false)}
  end

  def handle_event("validate-upload", _params, socket), do: {:noreply, socket}

  def handle_event("save-upload", %{"document" => attrs}, socket) do
    results =
      consume_uploaded_entries(socket, :document, fn %{path: path}, entry ->
        upload = %{path: path, filename: entry.client_name, content_type: entry.client_type}

        {:ok,
         Knowledge.ingest_upload(
           socket.assigns.current_scope,
           socket.assigns.client_id,
           attrs,
           upload
         )}
      end)

    case results do
      [{:ok, _ingestion}] ->
        {:noreply,
         socket
         |> put_flash(:info, "Document extrait. Validez sa version pour l'activer dans le RAG.")
         |> assign(:show_upload, false)
         |> assign(:upload_form, upload_form())
         |> load_documents()}

      [{:error, reason}] ->
        {:noreply, put_flash(socket, :error, ingestion_error(reason))}

      [] ->
        {:noreply, put_flash(socket, :error, "Sélectionnez un fichier PDF, TXT ou Markdown.")}
    end
  end

  def handle_event("approve-version", %{"id" => version_id}, socket) do
    case Knowledge.approve_version(socket.assigns.current_scope, version_id) do
      {:ok, _result} ->
        {:noreply,
         socket
         |> put_flash(:info, "Version validée et activée dans la base RAG.")
         |> load_documents()}

      {:error, reason} ->
        {:noreply, put_flash(socket, :error, ingestion_error(reason))}
    end
  end

  def handle_event("search", %{"search" => search}, socket) do
    {:noreply, socket |> assign(:search, search) |> load_documents()}
  end

  def handle_event("select-client", %{"client_id" => client_id}, socket) do
    if client_id in socket.assigns.current_scope.client_ids do
      scope = Organizations.scope_for_user(socket.assigns.current_scope.user, client_id)

      {:noreply,
       socket
       |> assign(:current_scope, scope)
       |> assign(:client_id, client_id)
       |> assign(:can_write, can_write?(scope))
       |> assign(:search, "")
       |> load_documents()}
    else
      {:noreply, put_flash(socket, :error, "Périmètre client non autorisé.")}
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.bridge flash={@flash} current_scope={@current_scope} active_nav={:documents}>
      <section class="documents-page" id="documents-page">
        <header class="documents-hero">
          <div class="documents-hero-copy">
            <p class="eyebrow">Base de connaissance</p>
            <h1>Vos sources, prêtes pour l’intelligence.</h1>
            <p>
              Centralisez vos documents, contrôlez chaque version et choisissez précisément les sources que l’assistant peut citer.
            </p>
          </div>
          <button
            :if={@can_write && @client_id}
            id="open-upload-button"
            type="button"
            phx-click="show-upload"
            class="bridge-button bridge-button-primary"
          >
            <.bridge_icon name={:upload} /> Importer un document
          </button>
        </header>

        <section :if={@client_id} class="documents-stats" aria-label="Synthèse documentaire">
          <article>
            <span class="stat-icon is-blue"><.bridge_icon name={:document} /></span>
            <div>
              <small>Documents</small><strong>{@stats.total}</strong>
              <p>dans cet espace client</p>
            </div>
          </article>
          <article>
            <span class="stat-icon is-teal"><.bridge_icon name={:stack} /></span>
            <div>
              <small>Sources actives</small><strong>{@stats.active}</strong>
              <p>interrogeables par le RAG</p>
            </div>
          </article>
          <article>
            <span class="stat-icon is-amber"><.bridge_icon name={:clock} /></span>
            <div>
              <small>À valider</small><strong>{@stats.review}</strong>
              <p>en attente de revue humaine</p>
            </div>
          </article>
        </section>

        <div :if={@client_id} class="documents-toolbar">
          <form id="document-search-form" phx-change="search" class="document-search">
            <.bridge_icon name={:search} />
            <input
              id="document-search"
              name="search"
              value={@search}
              type="search"
              placeholder="Rechercher un document…"
              phx-debounce="250"
            />
          </form>
          <form id="client-selector-form" phx-change="select-client">
            <label for="client-selector">Client</label>
            <select id="client-selector" name="client_id">
              <option :for={client <- @clients} value={client.id} selected={client.id == @client_id}>
                {client.name}
              </option>
            </select>
          </form>
        </div>

        <div :if={!@client_id} class="documents-empty" id="documents-no-client">
          <span>◎</span>
          <h2>Aucun espace client attribué</h2>
          <p>Un administrateur doit rattacher votre compte à un client avant tout dépôt.</p>
        </div>

        <div :if={@client_id} id="documents" phx-update="stream" class="documents-grid">
          <article :for={{dom_id, document} <- @streams.documents} id={dom_id} class="document-card">
            <div class="document-card-top">
              <span class="document-file-icon">
                <.bridge_icon name={:document} /><small>{file_icon(current_version(document))}</small>
              </span>
              <div class="document-badges">
                <span class="document-badge">{document.classification}</span>
                <span class={["rag-badge", document.status == "active" && "is-active"]}>
                  {if document.status == "active", do: "✓ RAG actif", else: "○ En révision"}
                </span>
              </div>
            </div>
            <h2>{document.title}</h2>
            <p class="document-meta">
              Version {max(document.current_version_number, 1)} · {format_size(
                current_version(document)
              )}
            </p>
            <div class="document-owner">
              <span>{initials(document.owner.email)}</span>
              <div>
                <small>Déposé par</small>
                <strong>{document.owner.email}</strong>
              </div>
            </div>
            <div class="document-card-actions">
              <span class="document-status">{version_label(current_version(document))}</span>
              <button
                :if={@can_write && approvable?(current_version(document))}
                id={"approve-version-#{current_version(document).id}"}
                type="button"
                phx-click="approve-version"
                phx-value-id={current_version(document).id}
                class="bridge-button bridge-button-small"
              >
                Valider & activer
              </button>
            </div>
          </article>
        </div>

        <div :if={@client_id && @documents_empty} class="documents-empty" id="documents-empty">
          <span>▤</span>
          <h2>Aucun document</h2>
          <p>Importez une première source pour préparer la base documentaire de l’assistant.</p>
        </div>
      </section>

      <div :if={@show_upload} class="bridge-modal-backdrop" id="upload-modal">
        <div class="bridge-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
          <div class="bridge-modal-head">
            <div>
              <p class="eyebrow">Nouvelle source</p>
              <h2 id="upload-title">Importer dans la base documentaire</h2>
            </div>
            <button id="close-upload-button" type="button" phx-click="hide-upload" aria-label="Fermer">
              ×
            </button>
          </div>

          <.form
            for={@upload_form}
            id="document-upload-form"
            phx-change="validate-upload"
            phx-submit="save-upload"
          >
            <.input field={@upload_form[:title]} type="text" label="Titre du document" required />
            <.input
              field={@upload_form[:classification]}
              type="select"
              label="Classification"
              options={[
                {"Interne", "internal"},
                {"Confidentiel", "confidential"},
                {"Partagé client", "client_shared"}
              ]}
            />
            <div class={["upload-dropzone", @uploads.document.entries != [] && "has-file"]}>
              <.live_file_input upload={@uploads.document} id="document-file-input" />
              <strong>{upload_name(@uploads.document.entries)}</strong>
              <small>PDF texte, TXT ou Markdown · 10 Mo maximum</small>
            </div>
            <p :for={error <- upload_errors(@uploads.document)} class="upload-error">
              {upload_error(error)}
            </p>
            <div class="bridge-modal-actions">
              <button type="button" phx-click="hide-upload" class="bridge-button">Annuler</button>
              <button
                id="submit-upload-button"
                type="submit"
                class="bridge-button bridge-button-primary"
                phx-disable-with="Extraction en cours…"
              >
                Extraire le contenu
              </button>
            </div>
          </.form>
        </div>
      </div>
    </Layouts.bridge>
    """
  end

  defp load_documents(%{assigns: %{client_id: nil}} = socket) do
    socket
    |> assign(:documents_empty, true)
    |> assign(:stats, %{total: 0, active: 0, review: 0})
    |> stream(:documents, [], reset: true)
  end

  defp load_documents(socket) do
    {:ok, documents} =
      Knowledge.list_documents(
        socket.assigns.current_scope,
        socket.assigns.client_id,
        socket.assigns.search
      )

    socket
    |> assign(:documents_empty, documents == [])
    |> assign(:stats, document_stats(documents))
    |> stream(:documents, documents, reset: true)
  end

  defp document_stats(documents) do
    %{
      total: length(documents),
      active: Enum.count(documents, &(&1.status == "active")),
      review:
        Enum.count(documents, fn document ->
          match?(%{status: "needs_review"}, current_version(document))
        end)
    }
  end

  defp upload_form do
    to_form(%{"title" => "", "classification" => "internal"}, as: :document)
  end

  defp can_write?(%{role: role}) when role in ~w(super_admin admin agency), do: true
  defp can_write?(%{permissions: permissions}), do: "knowledge.write" in permissions

  defp current_version(%{versions: []}), do: nil
  defp current_version(%{versions: versions}), do: Enum.max_by(versions, & &1.number)

  defp approvable?(%{status: "needs_review"}), do: true
  defp approvable?(_version), do: false

  defp version_label(%{status: "approved"}), do: "Version validée"
  defp version_label(%{status: "needs_review"}), do: "Validation requise"
  defp version_label(_version), do: "Dépôt en traitement"

  defp file_icon(%{mime_type: "application/pdf"}), do: "PDF"
  defp file_icon(_version), do: "TXT"

  defp format_size(nil), do: "—"
  defp format_size(%{byte_size: size}) when size < 1_000, do: "#{size} o"

  defp format_size(%{byte_size: size}) when size < 1_000_000,
    do: "#{Float.round(size / 1_000, 1)} Ko"

  defp format_size(%{byte_size: size}), do: "#{Float.round(size / 1_000_000, 1)} Mo"

  defp initials(email) do
    email
    |> String.split(~r/[^[:alnum:]]/u, trim: true)
    |> Enum.take(2)
    |> Enum.map_join(&String.first/1)
    |> String.upcase()
  end

  defp upload_name([]), do: "Déposez ou choisissez un fichier"
  defp upload_name([entry | _entries]), do: entry.client_name

  defp upload_error(:too_large), do: "Le fichier dépasse 10 Mo."
  defp upload_error(:too_many_files), do: "Un seul fichier peut être importé à la fois."
  defp upload_error(:not_accepted), do: "Format non pris en charge."
  defp upload_error(_error), do: "Le fichier ne peut pas être importé."

  defp ingestion_error(:forbidden), do: "Vous n’avez pas la permission d’effectuer cette action."
  defp ingestion_error(:file_too_large), do: "Le fichier dépasse 10 Mo."
  defp ingestion_error(:unsupported_file_type), do: "Format non pris en charge."
  defp ingestion_error(:empty_or_scanned_pdf), do: "Ce PDF ne contient pas de texte extractible."
  defp ingestion_error(:pdf_extractor_unavailable), do: "L’extracteur PDF n’est pas disponible."
  defp ingestion_error(:pdf_extraction_failed), do: "L’extraction du PDF a échoué."
  defp ingestion_error(:empty_or_invalid_document), do: "Le document est vide ou invalide."
  defp ingestion_error(%Ecto.Changeset{}), do: "Les métadonnées du document sont invalides."
  defp ingestion_error(_reason), do: "Le document n’a pas pu être importé."
end
