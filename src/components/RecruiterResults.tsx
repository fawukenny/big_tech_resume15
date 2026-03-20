"use client";

import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult, FeedbackItem, RecruiterVerdict } from "@/types/resume";
import { ResumeWithFeedback } from "@/components/ResumeWithFeedback";
import { HowYouCompareBar } from "@/components/HowYouCompareBar";
import { resolveFilterOutRisksDisplay } from "@/lib/filterOutRisks";
import { getScoreTheme } from "@/lib/scoreTheme";

function pillTone(kind: "good" | "warn" | "bad") {
  if (kind === "good") return "bg-[var(--success)]/15 text-[var(--success)] border-white/10";
  if (kind === "warn") return "bg-[var(--warning)]/15 text-[var(--warning)] border-white/10";
  return "bg-[var(--error)]/15 text-[var(--error)] border-white/10";
}

function DecisionPill({ label, tone }: { label: string; tone: "good" | "warn" | "bad" }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${pillTone(tone)}`}>
      {label}
    </span>
  );
}

function splitFeedback(feedback: FeedbackItem[]) {
  const praise = feedback.filter((f) => f.type === "praise");
  const flags = feedback.filter((f) => f.type !== "praise");
  return { praise, flags };
}

function verdictCardTheme(rv: RecruiterVerdict | undefined) {
  const verdict = rv?.verdict ?? "";
  const decision = rv?.decision;
  const like = rv?.hiringLikelihood;

  if (decision === "Interview" && verdict === "High Signal") {
    return {
      shell: "border-emerald-400/45 bg-gradient-to-br from-emerald-950/55 via-emerald-900/25 to-white/[0.02]",
      shadow: "shadow-[0_0_60px_-8px_rgba(52,211,153,0.38)]",
      bar: "from-emerald-400 via-teal-400 to-cyan-400",
      hint: "You’re in strong interview territory — keep sharpening differentiation and depth.",
    };
  }
  if (decision === "Interview") {
    return {
      shell: "border-emerald-400/30 bg-gradient-to-br from-emerald-950/35 to-white/[0.03]",
      shadow: "shadow-[0_0_48px_-12px_rgba(52,211,153,0.22)]",
      bar: "from-emerald-500 to-emerald-400/70",
      hint: "Solid signals — add sharper metrics and ownership language to push this fully “green.”",
    };
  }
  if (decision === "Reject" || verdict === "Low Signal") {
    return {
      shell: "border-amber-500/50 bg-gradient-to-br from-amber-950/45 via-red-950/25 to-white/[0.02]",
      shadow: "shadow-[0_0_55px_-8px_rgba(251,191,36,0.32)]",
      bar: "from-amber-400 via-orange-500 to-red-500",
      hint: "How you turn this green: address filter-out risks first, then rebuild proof of impact (metrics + scope).",
    };
  }
  if (like === "Low" || like === "Medium") {
    return {
      shell: "border-amber-400/40 bg-gradient-to-br from-amber-950/35 to-white/[0.03]",
      shadow: "shadow-[0_0_42px_-10px_rgba(251,191,36,0.22)]",
      bar: "from-amber-400 to-amber-600/70",
      hint: "Mixed signal — recruiters may pass; tighten risks below, then strengthen your headline proof points.",
    };
  }
  return {
    shell: "border-white/18 bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
    shadow: "shadow-xl shadow-black/25",
    bar: "from-zinc-400 to-zinc-500",
    hint: "Use the signals below to prioritize what to fix first.",
  };
}

export function RecruiterResults({ analysis }: { analysis: AnalysisResult }) {
  const rv = analysis.recruiterVerdict;
  const theme = useMemo(() => verdictCardTheme(rv), [rv]);

  const helps = useMemo(() => (analysis.whatHelps?.bullets ?? []).slice(0, 6), [analysis.whatHelps?.bullets]);
  const filterOutRisks = useMemo(() => resolveFilterOutRisksDisplay(analysis), [analysis]);

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"highlights" | "document">("document");
  const [feedbackTab, setFeedbackTab] = useState<"positive" | "improve">("positive");
  const [pdfRemountKey, setPdfRemountKey] = useState(0);

  const benchmark = analysis.benchmark;
  const scoreTheme = useMemo(() => getScoreTheme(analysis.overallScore), [analysis.overallScore]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fileUrl = mounted ? sessionStorage.getItem("resume-file-url") : null;
  const fileType = mounted ? sessionStorage.getItem("resume-file-type") : null;
  const isPdf = Boolean(
    fileUrl && (fileType?.toLowerCase() === "application/pdf" || fileUrl.toLowerCase().includes(".pdf"))
  );

  useEffect(() => {
    if (!mounted) return;
    if (!isPdf && view === "document") setView("highlights");
  }, [mounted, isPdf, view]);

  const { praise } = useMemo(() => splitFeedback(analysis.feedback), [analysis.feedback]);

  const helpsToShow = helps.length ? helps : praise.slice(0, 6).map((f) => f.message);
  const risksToShow = filterOutRisks;

  return (
    <div className="space-y-10">
      <section
        className={`relative overflow-hidden rounded-[22px] border p-6 sm:p-8 pb-8 backdrop-blur-md transition-shadow ${theme.shell} ${theme.shadow}`}
      >
        <div
          className={`pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b ${theme.bar} rounded-l-[22px]`}
          aria-hidden
        />
        <div className="relative pl-4 sm:pl-5 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Recruiter verdict
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[var(--text)] tracking-tight">
                {rv?.verdict ?? "Mixed Signal"}
              </span>
              {rv?.decision && (
                <DecisionPill
                  label={`Recommendation: ${rv.decision}`}
                  tone={rv.decision === "Interview" ? "good" : "bad"}
                />
              )}
              {rv?.hiringLikelihood && (
                <DecisionPill
                  label={`Interview likelihood: ${rv.hiringLikelihood}`}
                  tone={rv.hiringLikelihood === "High" ? "good" : rv.hiringLikelihood === "Medium" ? "warn" : "bad"}
                />
              )}
            </div>
            {rv?.anchorNote && (
              <>
                <p className="text-sm text-[var(--text)]/90 mt-3 leading-relaxed w-full max-w-none font-medium">
                  {rv.anchorNote}
                </p>
                <hr className="w-full border-0 border-t border-white/20 mt-4" />
              </>
            )}

            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-4 leading-relaxed w-full max-w-none">
              {theme.hint}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--border)] bg-black/20 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Interview signals (what helps you)
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                {helpsToShow.map((b, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-[var(--success)] mt-0.5 shrink-0">✔</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Filter-out risks (what hurts you)
              </p>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                {risksToShow.length === 0 ? (
                  <li className="text-[var(--text-muted)]/80 italic">No major filter-out risks were called out for this pass.</li>
                ) : (
                  risksToShow.map((b, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[var(--error)] mt-0.5 shrink-0">✘</span>
                      <span>{b}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <HowYouCompareBar benchmark={benchmark} scoreLabel={scoreTheme.label} />
        </div>
      </section>

      <section className="space-y-4 w-full max-w-5xl mx-auto">
        <div>
          <h2 className="section-heading text-xl sm:text-2xl">Resume</h2>
          <div className="section-heading-underline" />
          <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xl leading-relaxed">
            Resume on the left, recruiter notes on the right. Tabs switch PDF vs text view and positive vs improvement
            feedback.
          </p>
        </div>

        <ResumeWithFeedback
          analysis={analysis}
          feedbackHeading="Recruiter notes"
          pdfDocumentUrl={isPdf ? fileUrl : null}
          resumeDisplayMode={view === "document" && isPdf ? "pdf" : "structured"}
          pdfViewerRemountKey={pdfRemountKey}
          feedbackToneFilter={feedbackTab}
          resultsTabs={{
            resume: {
              view,
              setView,
              isPdf,
              onSelectDocument: () => setPdfRemountKey((k) => k + 1),
            },
            notes: { tab: feedbackTab, setTab: setFeedbackTab },
          }}
        />
      </section>
    </div>
  );
}
