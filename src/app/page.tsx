"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { AppFooter } from "@/components/AppFooter";
import type { AnalysisResult } from "@/types/resume";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSelectFile = (file: File) => {
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("resume", selectedFile);
      if (context.trim()) formData.set("context", context.trim());
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Analysis failed");
      }
      const data: AnalysisResult = await res.json();
      sessionStorage.setItem("resume-analysis", JSON.stringify(data));
      // Best-effort: keep a document URL for rendering on results (same-tab session only).
      try {
        const url = URL.createObjectURL(selectedFile);
        sessionStorage.setItem("resume-file-url", url);
        sessionStorage.setItem("resume-file-name", selectedFile.name);
        sessionStorage.setItem("resume-file-type", selectedFile.type || "");
      } catch {
        // ignore
      }
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

      <main className="flex-1 flex flex-col items-center px-6 py-12 sm:py-16">
        <h1 className="section-heading text-center max-w-3xl mx-auto text-2xl sm:text-3xl lg:text-[2.35rem]">
          Make your resume Big Tech ready
        </h1>
        <div className="w-10 h-0.5 bg-white/30 mx-auto mt-3" aria-hidden />
        <p className="section-subheading text-center max-w-xl mx-auto mt-5 mb-8 text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
          Get tailored feedback so you get past ATS and stand out to recruiters at MAANG and top tech companies.
        </p>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10 opacity-90">
          {["Meta", "Google", "Amazon", "Apple", "Microsoft", "Netflix"].map((name, i) => (
            <span
              key={name}
              className="text-sm font-semibold text-white/70 tracking-wide animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              {name}
            </span>
          ))}
        </div>

        <div className="w-full max-w-xl space-y-6">
          <div className="card p-5 sm:p-6">
            <label htmlFor="context" className="block text-sm font-medium text-[var(--text)] mb-2">
              Context (optional)
            </label>
            <textarea
              id="context"
              placeholder="Paste a job description, or describe the feedback you want — e.g. “Focus on impact and metrics for PM roles” or “Tailor for senior backend at FAANG”"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--border)] bg-white/[0.06] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-white/20 resize-y min-h-[88px]"
              disabled={loading}
            />
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Better context → more relevant, actionable feedback.
            </p>
          </div>

          <div className="space-y-4">
            <UploadZone onUpload={handleSelectFile} isLoading={loading} />
            {selectedFile && (
              <div className="rounded-xl border border-[var(--border)] bg-white/[0.04] px-3 py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Ready when you are. Add context above if you want it tailored.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors shrink-0"
                  disabled={loading}
                >
                  Change
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
              className="btn-primary w-full disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Analyzing…" : "Analyze my resume"}
            </button>
            <p className="text-xs text-[var(--text-muted)] text-center">
              You can upload first, then paste a job description before running analysis.
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs sm:text-sm text-[var(--text-muted)] text-center max-w-md leading-relaxed">
          PDF or DOCX, max 5MB. Analysis uses AI when configured. No account required.
        </p>
      </main>

      <AppFooter maxWidth="max-w-3xl" />
    </div>
  );
}
