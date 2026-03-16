"use client";

import { getScoreTheme } from "@/lib/scoreTheme";
import type { BenchmarkData } from "@/types/resume";

type Props = { data: BenchmarkData };

export function Benchmark({ data }: Props) {
  const { yourScore, topPerformersAvg, industryAvg, percentile } = data;
  const theme = getScoreTheme(yourScore);

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="section-heading text-xl sm:text-2xl">How you compare</h2>
      <div className="section-heading-underline" />
      <p className="section-subheading mb-6">
        Benchmarked against high-performing MAANG resumes and industry averages.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white/[0.04] p-4 sm:p-5 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Your score
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: theme.color }}>
            {theme.label}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">({yourScore}/100)</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-4 sm:p-5 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Top performers (avg)
          </p>
          <p className="text-2xl font-bold tabular-nums text-[var(--text)]">{topPerformersAvg}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-4 sm:p-5 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Industry avg
          </p>
          <p className="text-2xl font-bold tabular-nums text-[var(--text)]">{industryAvg}</p>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-4 sm:p-5 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Percentile
          </p>
          <p className="text-2xl font-bold tabular-nums text-[var(--success)]">{percentile}%</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 rounded-full bg-white/[0.08] overflow-hidden flex">
          <div
            className="bg-[var(--error)] shrink-0 transition-all"
            style={{ width: `${industryAvg}%` }}
            title="Industry average"
          />
          <div
            className="bg-[var(--accent-blue)] shrink-0 transition-all"
            style={{ width: `${Math.min(100 - industryAvg, Math.max(0, yourScore - industryAvg))}%` }}
            title="Your score"
          />
          <div
            className="bg-[var(--success)] shrink-0 transition-all"
            style={{ width: `${Math.max(0, topPerformersAvg - Math.max(yourScore, industryAvg))}%` }}
            title="Top performers"
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
          <span>0</span>
          <span>100</span>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6 mt-3" role="list" aria-label="Bar legend">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[var(--error)] shrink-0" aria-hidden />
            <span className="text-sm text-[var(--text-muted)]">Industry avg ({industryAvg})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[var(--accent-blue)] shrink-0" aria-hidden />
            <span className="text-sm text-[var(--text-muted)]">You ({yourScore})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[var(--success)] shrink-0" aria-hidden />
            <span className="text-sm text-[var(--text-muted)]">Top performers ({topPerformersAvg})</span>
          </div>
        </div>
      </div>
    </section>
  );
}
