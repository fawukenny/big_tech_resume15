"use client";

import type { SectionScore, ScorecardCriteria } from "@/types/resume";

type Props = {
  overallScore: number;
  sectionScores: SectionScore[];
  criteria: ScorecardCriteria[];
};

function Bar({ score, max = 100, label }: { score: number; max?: number; label: string }) {
  const pct = Math.min(100, (score / max) * 100);
  const color =
    pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)";
  return (
    <div className="grid grid-cols-[1fr,auto] gap-3 items-center">
      <div className="h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm tabular-nums font-medium w-10 text-right">{score}/{max}</span>
      <span className="text-sm text-[var(--text-muted)] col-span-2">{label}</span>
    </div>
  );
}

export function Scorecard({ overallScore, sectionScores, criteria }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] overflow-hidden">
      <div className="p-6 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-1">Resume Score</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Holistic and section breakdown</p>
        <div className="flex items-baseline gap-3">
          <span
            className="text-4xl font-bold tabular-nums"
            style={{
              color:
                overallScore >= 75
                  ? "var(--success)"
                  : overallScore >= 50
                    ? "var(--warning)"
                    : "var(--error)",
            }}
          >
            {overallScore}
          </span>
          <span className="text-[var(--text-muted)]">/ 100</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          By section
        </h3>
        {sectionScores.map((s) => (
          <Bar key={s.section} score={s.score} max={s.max} label={s.label} />
        ))}
      </div>

      <div className="p-6 pt-0 space-y-5 border-t border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Criteria
        </h3>
        {criteria.map((c) => (
          <Bar key={c.key} score={c.score} max={c.max} label={c.label} />
        ))}
      </div>
    </div>
  );
}
