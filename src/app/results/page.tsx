"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResumeWithFeedback } from "@/components/ResumeWithFeedback";
import { ThemedSummary } from "@/components/ThemedSummary";
import { Benchmark } from "@/components/Benchmark";
import { ReportGate } from "@/components/ReportGate";
import { CTABlock } from "@/components/CTABlock";
import { getReportPdfBlob } from "@/lib/generateReportPdf";
import type { AnalysisResult } from "@/types/resume";

export default function ResultsPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("resume-analysis");
    if (raw) {
      try {
        setAnalysis(JSON.parse(raw));
      } catch {
        setAnalysis(null);
      }
    }
  }, []);

  const handleRequestReport = async (email: string, acceptMarketing: boolean) => {
    if (!analysis) throw new Error("No analysis data");
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, acceptMarketing, analysis }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to send report");
    }
    const blob = await getReportPdfBlob(analysis);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-review-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-[var(--text-muted)] mb-4">No resume data found.</p>
        <Link
          href="/"
          className="text-[var(--accent-blue)] hover:underline font-medium"
        >
          Upload a resume
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface-elevated)]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-[var(--text)]">
            Big Tech Resume Review
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            New review
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 sm:py-12 space-y-14 sm:space-y-16 animate-fade-in">
        <div>
          <h1 className="section-heading text-2xl sm:text-3xl">Your results</h1>
          <p className="section-subheading max-w-xl">
            Feedback overlaid on your resume — hover highlights for tips. Then review your summary and benchmark.
          </p>
        </div>

        <ResumeWithFeedback analysis={analysis} />

        <ThemedSummary analysis={analysis} />

        <Benchmark data={analysis.benchmark} />

        <ReportGate onRequestReport={handleRequestReport} />

        <CTABlock />
      </main>

      <footer className="border-t border-[var(--border)] py-8 px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--text-muted)]">
          <a href="https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">
            Free YouTube course
          </a>
          <Link href="/" className="hover:text-[var(--text)] transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
