/** Parse Chat Completions JSON mode output: optional ```json fences, then JSON.parse. */

function stripMarkdownCodeFence(text: string): string {
  const s = text.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s);
  return m ? m[1].trim() : s;
}

export function tryParseOpenAiJsonObject(content: string): Record<string, unknown> | null {
  if (!content || typeof content !== "string") return null;
  const candidate = stripMarkdownCodeFence(content);
  try {
    const v = JSON.parse(candidate);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
