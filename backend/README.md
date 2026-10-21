# McCann Bridge Backend

Phoenix is the authority for authentication, client scope, documents, RAG and
report workflows. The React application remains the transitional frontend.

## Local startup

```bash
docker compose up -d db
mix setup
mix phx.server
```

After registering the first account, bootstrap its client membership from the
server and then reload the session:

```bash
mix mccann_bridge.accounts.grant_admin you@example.com orange-cameroun "Orange Cameroun"
```

The task requires an existing account and never creates or stores a password.

The authenticated Phoenix interface starts at `GET /documents`. This first
vertical slice supports responsive navigation, tenant-scoped PDF/TXT/Markdown
uploads, text extraction, deterministic chunking and human approval before a
version becomes searchable by the RAG layer. PDF extraction requires the
`pdftotext` executable (Poppler).

The Phoenix frontend uses the interface in the parent `web` project as its
design reference: self-hosted Sora, navy/blue/teal palette, fixed header,
collapsible desktop navigation, bottom mobile navigation and light/dark themes.
Its CAERA-specific identity and API flows are deliberately not copied.

Uploaded originals are private and stored under the application data directory
in development. Configure `:knowledge_storage` with persistent private object
storage before production deployment.

The health endpoint is `GET /api/health`. The first protected assistant
contract is `POST /api/v1/assistant/query`; it requires an authenticated
Phoenix session and a client membership.

External generation is fail-closed by default through
`McCannBridge.Assistant.DisabledProvider`. The Groq adapter uses the official
OpenAI-compatible chat-completions endpoint through `Req`, requests a strict
JSON response, validates the source identifiers returned by the model and
rechecks the membership and approved chunks before exposing citations.

Configure Groq only in the Phoenix runtime environment:

```bash
export GROQ_API_KEY="..."
export GROQ_MODEL="openai/gpt-oss-20b"
export GROQ_ZDR_CONFIRMED="true"
export RAG_EXTERNAL_GENERATION_ENABLED="true"
```

Validate a newly configured key and model without sending questions or document
content:

```bash
mix mccann_bridge.assistant.check_groq
```

This command calls only `GET /openai/v1/models`, does not print the key and does
not activate document generation.

`GROQ_ZDR_CONFIRMED` is an explicit operational acknowledgement that Zero Data
Retention has been enabled for the Groq organization. The provider stays closed
if generation is disabled, the acknowledgement is absent or the key is missing.
Never expose these variables through a `VITE_` prefixed value.

Successful assistant responses contain `request_id`, `answer`, `grounded`,
`citations`, `limitations`, `provider` and `model`. A response is marked as
grounded only when Groq cites retrieved source identifiers and Phoenix validates
those exact sources again after generation. Ungrounded responses always contain
an empty `citations` list and an explicit notice in `answer`.

See `../docs/ARCHITECTURE_BACKEND_PHOENIX_RAG_RAPPORTS.md` for the target
architecture and migration sequence.
