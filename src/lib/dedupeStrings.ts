import type { FeedbackItem } from "@/types/resume";

/** Collapse duplicate lines (normalized) while keeping first occurrence order. */
export function dedupeStringsPreserveOrder(strings: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of strings) {
    const k = s.trim().toLowerCase().replace(/\s+/g, " ");
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

/**
 * Rule-based + LLM edge case: multiple items can share the same message.
 * Keeps the first occurrence and reassigns stable ids (prefix `f` for rule-based, `fb` for LLM).
 */
export function dedupeFeedbackByMessage(feedback: FeedbackItem[], idPrefix: "f" | "fb" = "f"): FeedbackItem[] {
  const seen = new Set<string>();
  const out: FeedbackItem[] = [];
  for (const f of feedback) {
    const key = `${f.type}|${f.category}|${f.message.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out.map((f, i) => ({ ...f, id: `${idPrefix}-${i + 1}` }));
}
