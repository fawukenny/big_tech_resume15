"use client";

import type { BenchmarkData } from "@/types/resume";

type Props = {
  benchmark: BenchmarkData;
  scoreLabel: string;
};

/**
 * Percentile position on a 0–100 spectrum, with reference ticks for industry and top-candidate averages (scores on same 0–100 scale).
 */
export function HowYouCompareBar({ benchmark, scoreLabel }: Props) {
  const pct = Math.min(100, Math.max(0, Number(benchmark.percentile) || 0));
  const industryPos = Math.min(100, Math.max(0, benchmark.industryAvg));
  const topPos = Math.min(100, Math.max(0, benchmark.topPerformersAvg));

  return (
    <div className="mt-6 w-full max-w-none rounded-xl border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-sm">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
        How you compare
      </p>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Distribution is illustrative: your marker uses <span className="text-[var(--text)] font-medium">percentile rank</span>;
        ticks show <span className="text-[var(--text)]/90">industry</span> and{" "}
        <span className="text-[var(--text)]/90">top-candidate</span> average scores on the same 0–100 scale.
      </p>

      <div className="relative pb-1 pt-1">
        <div className="relative mb-2 h-8 w-full">
          <span
            className="absolute top-0 max-w-[calc(100%-1rem)] -translate-x-1/2 truncate rounded-md bg-violet-600 px-2.5 py-1 text-center text-[10px] font-bold leading-tight text-white shadow-lg ring-1 ring-white/25 sm:max-w-none sm:whitespace-nowrap"
            style={{ left: `${pct}%` }}
          >
            You · {pct}th percentile
          </span>
        </div>

        <div
          className="relative h-4 w-full rounded-full bg-gradient-to-r from-red-500/35 via-amber-400/35 to-emerald-400/45 ring-1 ring-white/10"
          role="img"
          aria-label={`You are around the ${pct}th percentile among candidates in this sample`}
        >
          {/* Industry avg */}
          <div
            className="absolute bottom-0 top-0 z-[1] w-px bg-white/50"
            style={{ left: `${industryPos}%`, transform: "translateX(-50%)" }}
            title={`Industry average score: ${benchmark.industryAvg}`}
          />
          {/* Top candidates */}
          <div
            className="absolute bottom-0 top-0 z-[1] w-0.5 bg-emerald-300/80"
            style={{ left: `${topPos}%`, transform: "translateX(-50%)" }}
            title={`Top candidates average: ${benchmark.topPerformersAvg}`}
          />

          {/* Candidate percentile marker on bar */}
          <div
            className="absolute top-1/2 z-[2] h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400 shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
            style={{ left: `${pct}%` }}
            aria-hidden
          />
        </div>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] text-[var(--text-muted)]">
          <span>0 — lower</span>
          <span className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-px bg-white/50" aria-hidden /> Industry avg
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-0.5 bg-emerald-300/80" aria-hidden /> Top candidates
            </span>
          </span>
          <span>100 — higher</span>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-2 border-t border-white/10 pt-3 text-xs sm:grid-cols-3 sm:gap-4">
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Your score</dt>
          <dd className="mt-0.5 font-semibold text-[var(--text)]">
            {scoreLabel} · {benchmark.yourScore}/100
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Industry avg</dt>
          <dd className="mt-0.5 text-[var(--text)]">{benchmark.industryAvg}/100</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Top candidates</dt>
          <dd className="mt-0.5 text-[var(--text)]">{benchmark.topPerformersAvg}/100</dd>
        </div>
      </dl>
    </div>
  );
}
