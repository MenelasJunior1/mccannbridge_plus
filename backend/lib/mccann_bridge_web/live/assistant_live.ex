defmodule McCannBridgeWeb.AssistantLive do
  use McCannBridgeWeb, :live_view

  alias McCannBridge.Assistant
  alias McCannBridge.Organizations

  @impl true
  def mount(_params, _session, socket) do
    scope = socket.assigns.current_scope
    clients = Organizations.list_clients(scope)
    client_id = scope.active_client_id || (List.first(clients) && List.first(clients).id)

    {:ok,
     socket
     |> assign(:page_title, "Assistant IA")
     |> assign(:clients, clients)
     |> assign(:client_id, client_id)
     |> assign(:messages, [])
     |> assign(:question_form, question_form())}
  end

  @impl true
  def handle_event("select-client", %{"client_id" => client_id}, socket) do
    if client_id in socket.assigns.current_scope.client_ids do
      scope = Organizations.scope_for_user(socket.assigns.current_scope.user, client_id)

      {:noreply,
       socket
       |> assign(:current_scope, scope)
       |> assign(:client_id, client_id)
       |> assign(:messages, [])}
    else
      {:noreply, put_flash(socket, :error, "Périmètre client non autorisé.")}
    end
  end

  def handle_event("use-suggestion", %{"question" => question}, socket) do
    {:noreply, assign(socket, :question_form, question_form(question))}
  end

  def handle_event("ask", %{"assistant" => %{"question" => question}}, socket) do
    trimmed_question = String.trim(question)

    if trimmed_question == "" do
      {:noreply, put_flash(socket, :error, "Saisissez une question.")}
    else
      user_message = %{role: :user, content: trimmed_question, id: Ecto.UUID.generate()}

      case Assistant.ask(
             socket.assigns.current_scope,
             socket.assigns.client_id,
             trimmed_question
           ) do
        {:ok, response} ->
          assistant_message = %{
            role: :assistant,
            content: response.answer,
            citations: response.citations,
            grounded: response.grounded,
            limitations: response.limitations,
            request_id: response.request_id,
            provider: response.provider,
            model: response.model,
            id: Ecto.UUID.generate()
          }

          {:noreply,
           socket
           |> assign(:messages, socket.assigns.messages ++ [user_message, assistant_message])
           |> assign(:question_form, question_form())}

        {:error, :service_unavailable, response} ->
          error_message = %{
            role: :assistant,
            content: provider_error(response.limitations),
            citations: [],
            grounded: false,
            limitations: response.limitations,
            request_id: response.request_id,
            provider: nil,
            model: nil,
            id: Ecto.UUID.generate()
          }

          {:noreply,
           socket
           |> assign(:messages, socket.assigns.messages ++ [user_message, error_message])
           |> assign(:question_form, question_form())}

        {:error, reason} ->
          {:noreply, put_flash(socket, :error, request_error(reason))}
      end
    end
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.bridge flash={@flash} current_scope={@current_scope} active_nav={:assistant}>
      <section class="assistant-page" id="assistant-page">
        <header class="assistant-header">
          <div>
            <p class="eyebrow">Intelligence documentaire</p>
            <h1>Interrogez vos sources.</h1>
            <p>
              Phoenix sélectionne les documents autorisés, Groq orchestre la réponse et chaque citation est contrôlée avant affichage.
            </p>
          </div>
          <form :if={@client_id} id="assistant-client-form" phx-change="select-client">
            <label for="assistant-client">Espace client</label>
            <select id="assistant-client" name="client_id">
              <option :for={client <- @clients} value={client.id} selected={client.id == @client_id}>
                {client.name}
              </option>
            </select>
          </form>
        </header>

        <div :if={!@client_id} class="documents-empty" id="assistant-no-client">
          <.bridge_icon name={:shield} />
          <h2>Aucun espace client attribué</h2>
          <p>Un administrateur doit rattacher votre compte avant d’utiliser l’assistant.</p>
        </div>

        <section
          :if={@client_id}
          class="assistant-workspace"
          aria-label="Conversation avec l'assistant"
        >
          <div class="assistant-thread" id="assistant-thread">
            <div :if={@messages == []} class="assistant-empty" id="assistant-empty">
              <span><.bridge_icon name={:assistant} /></span>
              <p class="eyebrow">Assistant McCann Bridge</p>
              <h2>Que souhaitez-vous comprendre ?</h2>
              <p>
                Posez une question sur les versions documentaires validées de cet espace client.
              </p>
              <div class="assistant-suggestions">
                <button
                  type="button"
                  phx-click="use-suggestion"
                  phx-value-question="Résume les principaux axes de campagne disponibles."
                >
                  Résumer les axes de campagne
                </button>
                <button
                  type="button"
                  phx-click="use-suggestion"
                  phx-value-question="Quelles recommandations sont soutenues par les sources validées ?"
                >
                  Identifier les recommandations
                </button>
              </div>
            </div>

            <article
              :for={message <- @messages}
              id={"assistant-message-#{message.id}"}
              class={["assistant-message", "is-#{message.role}"]}
            >
              <div class="assistant-message-label">
                <span>{if message.role == :user, do: "Vous", else: "Assistant IA"}</span>
                <small :if={message.role == :assistant && message.provider}>
                  {message.provider} · {message.model}
                </small>
              </div>
              <p>{message.content}</p>
              <div
                :if={message.role == :assistant && message.citations != []}
                class="assistant-citations"
              >
                <strong>Sources vérifiées</strong>
                <article :for={citation <- message.citations}>
                  <span>{citation.ref}</span>
                  <div>
                    <b>{citation.title}</b>
                    <small :if={citation.page}>Page {citation.page}</small>
                    <p>{citation.excerpt}</p>
                  </div>
                </article>
              </div>
              <div
                :if={message.role == :assistant && message.limitations != []}
                class="assistant-limitations"
              >
                Limites : {Enum.join(message.limitations, ", ")}
              </div>
            </article>
          </div>

          <.form
            for={@question_form}
            id="assistant-question-form"
            phx-submit="ask"
            class="assistant-composer"
          >
            <.input
              field={@question_form[:question]}
              type="textarea"
              label="Votre question"
              placeholder="Interrogez la base documentaire…"
              required
            />
            <button
              id="assistant-submit"
              type="submit"
              class="bridge-button bridge-button-primary"
              phx-disable-with="Analyse en cours…"
            >
              <.bridge_icon name={:assistant} /> Envoyer
            </button>
          </.form>
        </section>
      </section>
    </Layouts.bridge>
    """
  end

  defp question_form(question \\ ""), do: to_form(%{"question" => question}, as: :assistant)

  defp provider_error(["external_generation_disabled" | _]),
    do:
      "La génération Groq est désactivée sur ce serveur. Activez les variables RAG après validation ZDR."

  defp provider_error(["zdr_not_confirmed" | _]),
    do: "Groq reste désactivé tant que la validation Zero Data Retention n’est pas confirmée."

  defp provider_error(["missing_api_key" | _]),
    do: "La clé Groq n’est pas disponible dans le processus Phoenix."

  defp provider_error(["provider_authentication_failed" | _]),
    do: "Groq a refusé la clé configurée. Créez une nouvelle clé et relancez Phoenix."

  defp provider_error(["provider_rate_limited" | _]),
    do: "La limite de requêtes Groq est atteinte. Réessayez dans quelques instants."

  defp provider_error(_limitations),
    do: "Le service Groq est temporairement indisponible. Réessayez dans quelques instants."

  defp request_error(:invalid_question),
    do: "La question doit contenir entre 1 et 4 000 caractères."

  defp request_error(:source_scope_changed),
    do: "Les accès aux sources ont changé. Relancez la question."

  defp request_error(:forbidden), do: "Vous n’avez plus accès à cet espace client."
  defp request_error(_reason), do: "La demande n’a pas pu être traitée."
end
