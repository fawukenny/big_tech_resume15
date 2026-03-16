"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import type { AnalysisResult } from "@/types/resume";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("resume", file);
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      sessionStorage.setItem("resume-analysis", JSON.stringify(data));
      router.push("/results");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="text-base font-semibold tracking-tight text-[var(--text)]">
            Big Tech Resume Review
          </a>
          <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
            No signup
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-28">
        <h1 className="section-heading text-center max-w-2xl mx-auto text-3xl sm:text-4xl lg:text-[2.75rem]">
          Is your resume MAANG-ready?
        </h1>
        <div className="w-10 h-0.5 bg-white/30 mx-auto mt-3" aria-hidden />
        <p className="section-subheading text-center max-w-lg mx-auto mt-5 mb-14 sm:mb-16 text-[var(--text-muted)]">
          Get section-by-section feedback on your resume. We highlight what works and suggest
          concrete improvements — like notes on a printed draft.
        </p>
        <div className="w-full max-w-xl">
          <UploadZone onUpload={handleUpload} isLoading={loading} />
        </div>
        <p className="mt-12 text-sm text-[var(--text-muted)] text-center max-w-md leading-relaxed">
          PDF or DOCX, max 5MB. Processed in your browser, not stored. No account required.
        </p>
      </main>

      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[var(--text-muted)]">
          <a href="https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text)] transition-colors">
            Free YouTube course
          </a>
          <a href="#" className="hover:text-[var(--text)] transition-colors">Terms</a>
          <a href="#" className="hover:text-[var(--text)] transition-colors">Privacy</a>
        </div>
      </footer>
    </div>
  );
}
