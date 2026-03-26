/** Best-effort parse for Chat Completions JSON mode (handles fences, prose, truncation). */

function stripMarkdownCodeFence(text: string): string {
  const s = text.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```/im.exec(s);
  return m ? m[1].trim() : s;
}

/** Find first top-level `{ ... }` with brace balancing (ignores strings crudely). */
function extractBalancedJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse model output that should be one JSON object.
 * @returns parsed object or null
 */
export function tryParseOpenAiJsonObject(content: string): Record<string, unknown> | null {
  if (!content || typeof content !== "string") return null;
  let candidate = stripMarkdownCodeFence(content);
  const tryParse = (s: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(s);
      return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  let parsed = tryParse(candidate);
  if (parsed) return parsed;
  const extracted = extractBalancedJsonObject(candidate);
  if (extracted && extracted !== candidate) {
    parsed = tryParse(extracted);
    if (parsed) return parsed;
  }
  return null;
}
