"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnalysisResult, ScorecardDimension, ReviewStep } from "@/types/resume";
import { ResumeWithFeedback } from "@/components/ResumeWithFeedback";

function ratingChip(rating: ScorecardDimension["rating"]) {
  if (rating === "High") return { label: "High", color: "var(--success)" };
  if (rating === "Medium") return { label: "Medium", color: "var(--warning)" };
  return { label: "Low", color: "var(--error)" };
}

function SignalText({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[var(--border)] bg-white/[0.04]" style={{ color }}>
      {label}
    </span>
  );
}

function ProgressIndicator({
  steps,
  activeIndex,
}: {
  steps: ReviewStep[];
  activeIndex: number;
}) {
  if (!steps.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
        Step {activeIndex + 1} of {steps.length}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {steps.map((s, idx) => (
          <span key={s.id} className={idx === activeIndex ? "text-[var(--text)] underline underline-offset-4" : "text-[var(--text-muted)]"}>
            {s.title}
            {idx < steps.length - 1 && <span className="mx-2 text-[var(--text-muted)]">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GuidedRecruiterReview({ analysis }: { analysis: AnalysisResult }) {
  const steps = analysis.reviewSteps ?? [];
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [didAdvanceThisStep, setDidAdvanceThisStep] = useState(false);

  const currentStep = steps[activeStepIdx];

  const activeFeedbackIds = useMemo(() => {
    return new Set(currentStep?.highlightFeedbackIds ?? []);
  }, [currentStep]);

  const recruiterVerdict = analysis.recruiterVerdict;

  const scorecardDimensions = analysis.scorecardDimensions ?? [];

  const stepHelpsBullets = useMemo(() => {
    if (!currentStep) return [];
    const ids = activeFeedbackIds;
    return analysis.feedback
      .filter((f) => ids.has(f.id) && f.type === "praise")
      .map((f) => f.message)
      .slice(0, 5);
  }, [analysis.feedback, activeFeedbackIds, currentStep]);

  const stepHurtsBullets = useMemo(() => {
    if (!currentStep) return [];
    const ids = activeFeedbackIds;
    return analysis.feedback
      .filter((f) => ids.has(f.id) && f.type !== "praise")
      .map((f) => f.message)
      .slice(0, 5);
  }, [analysis.feedback, activeFeedbackIds, currentStep]);

  useEffect(() => {
    setDidAdvanceThisStep(false);
  }, [activeStepIdx]);

  const handleFeedbackSelected = useCallback(() => {
    if (!steps.length) return;
    if (didAdvanceThisStep) return;
    if (activeStepIdx >= steps.length - 1) return;
    setDidAdvanceThisStep(true);
    setActiveStepIdx((v) => Math.min(steps.length - 1, v + 1));
  }, [activeStepIdx, didAdvanceThisStep, steps.length]);

  return (
    <div className="space-y-10">
      <div className="sticky top-[70px] z-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]/80 backdrop-blur-xl">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                Recruiter verdict
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold" style={{ color: recruiterVerdict?.hiringLikelihood === "High" ? "var(--success)" : recruiterVerdict?.hiringLikelihood === "Medium" ? "var(--warning)" : "var(--error)" }}>
                  {recruiterVerdict?.verdict ?? "Mixed Signal"}
                </span>
                {recruiterVerdict && (
                  <>
                    <SignalText label={recruiterVerdict.decision} color="var(--text)" />
                    <SignalText label={`Likelihood: ${recruiterVerdict.hiringLikelihood}`} color="var(--text-muted)" />
                  </>
                )}
              </div>
              {recruiterVerdict?.anchorNote && (
                <p className="text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                  {recruiterVerdict.anchorNote}
                </p>
              )}
            </div>

            {steps.length > 0 && (
              <div className="space-y-2 w-full sm:w-auto">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Guided review
                </p>
                <ProgressIndicator steps={steps} activeIndex={activeStepIdx} />
              </div>
            )}
          </div>

          {currentStep && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-sm text-[var(--text-muted)]">
                Let&apos;s walk through your resume the way a recruiter would.
              </p>
              <p className="text-[var(--text)] font-medium mt-1">{currentStep.title}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                {currentStep.prompt}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        {currentStep && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="section-heading text-lg sm:text-xl mb-1">Current lens: {currentStep.title}</h2>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {currentStep.title.toLowerCase().includes("first")
                    ? "In the first few seconds, a recruiter decides whether your resume looks credible and impact-driven."
                    : currentStep.title.toLowerCase().includes("experience")
                      ? "Recruiters scan for ownership: what you led, what changed, and the measurable result."
                      : currentStep.title.toLowerCase().includes("depth")
                        ? "Next, they look for technical depth and execution clarity—proof you can deliver at scale."
                        : currentStep.title.toLowerCase().includes("gap")
                          ? "Then comes risk: what could cause a fast rejection at the Big Tech bar."
                          : "Finally, focus on the fastest, highest-ROI fixes that move the decision."}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  What helps this step
                </p>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                  {stepHelpsBullets.map((b, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[var(--success)] mt-0.5">✔</span>
                      <span>{b}</span>
                    </li>
                  ))}
                  {!stepHelpsBullets.length && <li>No highlighted strengths yet.</li>}
                </ul>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-white/[0.02] p-4">
                <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                  What hurts this step
                </p>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                  {stepHurtsBullets.map((b, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[var(--error)] mt-0.5">✘</span>
                      <span>{b}</span>
                    </li>
                  ))}
                  {!stepHurtsBullets.length && <li>No highlighted risks yet.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <div>
        <ResumeWithFeedback
          analysis={analysis}
          activeFeedbackIds={Array.from(activeFeedbackIds)}
          onFeedbackSelected={handleFeedbackSelected}
          feedbackHeading={currentStep ? `Recruiter notes: ${currentStep.title}` : undefined}
          deEmphasizeSectionTitles={currentStep?.relatedSectionTitles}
        />

        {scorecardDimensions.length > 0 && (
          <div className="card p-5 sm:p-6 mt-6">
            <h2 className="section-heading text-lg sm:text-xl mb-2">Scorecard</h2>
            <div className="w-10 h-0.5 bg-white/30 mt-1 mb-4" aria-hidden />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scorecardDimensions.slice(0, 6).map((d) => {
                const chip = ratingChip(d.rating);
                return (
                  <div key={d.key} className="rounded-xl border border-[var(--border)] bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text)]">{d.label}</p>
                      <SignalText label={chip.label} color={chip.color} />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">{d.oneLineExplanation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 gap-4">
          <button
            type="button"
            onClick={() => setActiveStepIdx((v) => Math.max(0, v - 1))}
            disabled={activeStepIdx === 0}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setActiveStepIdx((v) => Math.min(steps.length - 1, v + 1))}
            disabled={activeStepIdx >= steps.length - 1}
            className="px-4 py-2 rounded-lg bg-white text-sm font-semibold text-[var(--surface)] hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-opacity"
          >
            Next insight
          </button>
        </div>
      </div>
    </div>
  );
}

