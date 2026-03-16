"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) {
      setError("Please select a rating.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message: message.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white/[0.04] p-5 text-center">
        <p className="text-sm font-medium text-[var(--success)]">Thanks for your feedback!</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">We use it to improve the experience.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--border)] bg-white/[0.04] p-5 space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--text)] mb-2">How was your experience?</p>
        <div className="flex gap-1" role="group" aria-label="Rate your experience 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="p-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
            >
              <span
                className={`text-xl leading-none ${
                  rating !== null && value <= rating
                    ? "text-[var(--warning)]"
                    : "text-[var(--text-muted)]/50"
                }`}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">Click to rate (1–5)</p>
      </div>
      <div>
        <label htmlFor="feedback-message" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
          Optional feedback
        </label>
        <textarea
          id="feedback-message"
          placeholder="What worked? What could be better?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-[var(--border)] bg-white/[0.06] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-white/20 resize-y"
          maxLength={2000}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--error)]">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || rating === null}
        className="w-full rounded-lg py-2.5 text-sm font-medium bg-white/10 text-[var(--text)] hover:bg-white/15 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        {loading ? "Sending…" : "Submit feedback"}
      </button>
    </form>
  );
}
