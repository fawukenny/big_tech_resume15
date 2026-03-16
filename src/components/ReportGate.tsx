"use client";

import { useState } from "react";

type Props = {
  onRequestReport: (email: string, acceptMarketing: boolean) => Promise<void>;
  disabled?: boolean;
};

export function ReportGate({ onRequestReport, disabled }: Props) {
  const [email, setEmail] = useState("");
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onRequestReport(email.trim(), acceptMarketing);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="card p-6 sm:p-8 text-center">
        <p className="text-[var(--success)] font-semibold">Report downloaded!</p>
        <p className="section-subheading mt-2">
          Your PDF has been saved. We’ve recorded your email for tips and course updates.
        </p>
      </div>
    );
  }

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="section-heading text-xl sm:text-2xl">Download your report</h2>
      <p className="section-subheading mb-6">
        Get a PDF summary of your score, strengths, and areas to improve. We’ll send it to your
        email and, if you opt in, occasional tips and course updates.
      </p>
      <div className="space-y-5">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow"
          disabled={disabled}
        />
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptMarketing}
            onChange={(e) => setAcceptMarketing(e.target.checked)}
            className="mt-1 rounded border-[var(--border)] text-[var(--accent)]"
          />
          <span className="text-sm text-[var(--text-muted)] leading-relaxed">
            I accept the terms and agree to receive marketing emails (course launches, resume tips,
            and product updates). I can unsubscribe anytime.
          </span>
        </label>
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={disabled || loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending…" : "Email my PDF report"}
        </button>
      </div>
    </section>
  );
}
