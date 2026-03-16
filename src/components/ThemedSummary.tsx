"use client";

import { useMemo } from "react";
import { getScoreTheme } from "@/lib/scoreTheme";
import type { AnalysisResult, SectionScore } from "@/types/resume";

type Props = { analysis: AnalysisResult };

function SectionPill({
  label,
  sectionScore,
}: {
  label: string;
  sectionScore: SectionScore | undefined;
}) {
  if (!sectionScore) return null;
  const { label: themeLabel, color } = getScoreTheme(sectionScore.score);
  const why = sectionScore.feedback?.[0] ?? "";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {themeLabel}
        </span>
      </div>
      {why && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{why}</p>
      )}
    </div>
  );
}

export function ThemedSummary({ analysis }: Props) {
  const overall = getScoreTheme(analysis.overallScore);
  const sectionScoresByKey = useMemo(() => {
    const map = new Map<string, SectionScore>();
    for (const s of analysis.sectionScores) {
      map.set(s.section, s);
    }
    return map;
  }, [analysis.sectionScores]);

  const sectionsFromCv = useMemo(() => {
    const labels: Record<string, string> = {
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      summary: "Summary",
      projects: "Projects",
      other: "Other",
    };
    return analysis.structuredContent
      .map((block) => ({
        label: (block.title && block.title.trim()) || labels[block.section] || block.section,
        sectionKey: block.section,
        sectionScore: sectionScoresByKey.get(block.section),
      }))
      .filter((item) => item.sectionScore != null);
  }, [analysis.structuredContent, sectionScoresByKey]);

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="section-heading text-xl sm:text-2xl">Summary</h2>
      <div className="section-heading-underline" />
      <p className="section-subheading mb-6">
        Where you stand and why for each section of your resume.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-[var(--text-muted)] text-sm">Overall</span>
        <span className="font-semibold text-lg tracking-tight" style={{ color: overall.color }}>
          {overall.label}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sectionsFromCv.map((item, i) => (
          <SectionPill
            key={`${item.sectionKey}-${i}-${item.label}`}
            label={item.label}
            sectionScore={item.sectionScore}
          />
        ))}
      </div>
    </section>
  );
}
