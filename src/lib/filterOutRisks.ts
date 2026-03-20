import type { AnalysisResult, FeedbackItem, RecruiterVerdict } from "@/types/resume";

/**
 * Max number of "filter-out" / what-hurts bullets to show in UI and PDF report.
 * Stronger profiles: slightly fewer risks; Reject + medium/low likelihood: up to 5.
 */
export function getFilterOutRiskCap(rv: RecruiterVerdict | undefined): number {
  if (rv?.decision === "Reject" && (rv.hiringLikelihood === "Medium" || rv.hiringLikelihood === "Low")) {
    return 5;
  }
  return 4;
}

/** Build ordered list of filter-out messages (LLM bullets first, then non-praise feedback). */
/** Prefer LLM `whatHurts` bullets; otherwise non-praise feedback. Cap matches results + PDF report. */
export function resolveFilterOutRisksDisplay(analysis: AnalysisResult): string[] {
  const hurts = analysis.whatHurts?.bullets ?? [];
  const flags = analysis.feedback.filter((f: FeedbackItem) => f.type !== "praise");
  const cap = getFilterOutRiskCap(analysis.recruiterVerdict);
  const merged = hurts.length ? [...hurts] : flags.map((f) => f.message);
  return merged.slice(0, cap);
}
