/**
 * Map numeric score (0–100) to themed label and color for display.
 * Use these instead of raw numbers for clearer context.
 */

export type ScoreTheme = "strong" | "on_track" | "needs_work";

export function getScoreTheme(score: number): { label: string; theme: ScoreTheme; color: string } {
  if (score >= 75) return { label: "Strong", theme: "strong", color: "var(--success)" };
  if (score >= 50) return { label: "On track", theme: "on_track", color: "var(--warning)" };
  return { label: "Needs work", theme: "needs_work", color: "var(--error)" };
}
