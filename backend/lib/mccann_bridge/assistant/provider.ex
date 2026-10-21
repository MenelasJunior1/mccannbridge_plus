defmodule McCannBridge.Assistant.Provider do
  @moduledoc "Server-side boundary for external text generation providers."

  @type source :: %{
          required(:id) => Ecto.UUID.t(),
          required(:ref) => String.t(),
          required(:title) => String.t(),
          required(:content) => String.t(),
          optional(:page) => non_neg_integer() | nil,
          optional(:document_version_id) => Ecto.UUID.t()
        }

  @type generation :: %{
          required(:answer) => String.t(),
          required(:used_source_ids) => [Ecto.UUID.t()],
          required(:limitations) => [String.t()],
          required(:provider) => String.t(),
          required(:model) => String.t()
        }

  @callback generate(String.t(), [source()], keyword()) ::
              {:ok, generation()} | {:error, term()}
end
