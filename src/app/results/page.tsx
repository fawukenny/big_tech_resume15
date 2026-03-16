"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResumeWithFeedback } from "@/components/ResumeWithFeedback";
import { ThemedSummary } from "@/components/ThemedSummary";
import { Benchmark } from "@/components/Benchmark";
import { ReportGate } from "@/components/ReportGate";
import { CTABlock } from "@/components/CTABlock";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { AppFooter } from "@/components/AppFooter";
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
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl sticky top-0 z-10">
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
          <div className="w-10 h-0.5 bg-white/30 mt-2" aria-hidden />
          <p className="section-subheading max-w-xl mt-3">
            Feedback overlaid on your resume — click a highlight to jump to the matching feedback. Review your summary and benchmark below.
          </p>
          {analysis.contextUsed && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 max-w-2xl">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Tailored to your request
              </p>
              <p className="text-sm text-[var(--text)] leading-relaxed line-clamp-3">
                {analysis.contextUsed}
              </p>
            </div>
          )}
        </div>

        <ResumeWithFeedback analysis={analysis} />

        <ThemedSummary analysis={analysis} />

        <Benchmark data={analysis.benchmark} />

        <ReportGate onRequestReport={handleRequestReport} />

        <CTABlock />

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">Help us improve</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Rate your experience and share optional feedback.
          </p>
          <div className="max-w-md">
            <FeedbackWidget />
          </div>
        </section>
      </main>

      <AppFooter showHomeLink maxWidth="max-w-5xl" />
    </div>
  );
}
