defmodule McCannBridge.Knowledge.Chunker do
  @moduledoc "Builds deterministic, bounded passages for lexical retrieval."

  @default_size 1_200

  def split(content, opts \\ []) when is_binary(content) do
    max_size = Keyword.get(opts, :max_size, @default_size)

    content
    |> String.replace("\r\n", "\n")
    |> String.split(~r/\n\s*\n/u, trim: true)
    |> Enum.flat_map(&split_long_paragraph(&1, max_size))
    |> Enum.reduce([], &append_paragraph(&1, &2, max_size))
    |> Enum.reverse()
    |> Enum.with_index()
    |> Enum.map(fn {text, position} ->
      %{position: position, content: text, content_sha256: sha256(text)}
    end)
  end

  defp split_long_paragraph(paragraph, max_size) do
    paragraph = String.trim(paragraph)

    if String.length(paragraph) <= max_size do
      [paragraph]
    else
      {head, tail} = String.split_at(paragraph, max_size)
      [String.trim(head) | split_long_paragraph(String.trim(tail), max_size)]
    end
  end

  defp append_paragraph("", chunks, _max_size), do: chunks
  defp append_paragraph(paragraph, [], _max_size), do: [paragraph]

  defp append_paragraph(paragraph, [current | rest] = chunks, max_size) do
    candidate = current <> "\n\n" <> paragraph

    if String.length(candidate) <= max_size do
      [candidate | rest]
    else
      [paragraph | chunks]
    end
  end

  defp sha256(content) do
    :crypto.hash(:sha256, content) |> Base.encode16(case: :lower)
  end
end
