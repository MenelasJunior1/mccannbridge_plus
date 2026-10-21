defmodule McCannBridge.Knowledge.Extractor do
  @moduledoc "Extracts plain text from the document formats accepted by the RAG library."

  @text_extensions ~w(.txt .md)

  def extract(path, filename) when is_binary(path) and is_binary(filename) do
    case filename |> Path.extname() |> String.downcase() do
      extension when extension in @text_extensions -> read_text(path)
      ".pdf" -> read_pdf(path)
      _extension -> {:error, :unsupported_file_type}
    end
  end

  defp read_text(path) do
    with {:ok, content} <- File.read(path),
         true <- String.valid?(content),
         content <- String.trim(content),
         true <- content != "" do
      {:ok, content}
    else
      false -> {:error, :empty_or_invalid_document}
      {:error, _reason} -> {:error, :unreadable_document}
    end
  end

  defp read_pdf(path) do
    case System.cmd("pdftotext", ["-layout", path, "-"], stderr_to_stdout: true) do
      {content, 0} ->
        case String.trim(content) do
          "" -> {:error, :empty_or_scanned_pdf}
          text -> {:ok, text}
        end

      {_output, _status} ->
        {:error, :pdf_extraction_failed}
    end
  rescue
    ErlangError -> {:error, :pdf_extractor_unavailable}
  end
end
