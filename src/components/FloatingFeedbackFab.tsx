"use client";

import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";

/**
 * Always-visible entry point for product feedback (not buried in the footer).
 */
export function FloatingFeedbackFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-[var(--surface-elevated)]/95 backdrop-blur-md px-4 py-3 shadow-lg shadow-black/40 text-sm font-semibold text-[var(--text)] hover:border-[var(--accent-blue)]/60 hover:bg-white/[0.08] transition-all duration-200 animate-feedback-fab focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] w-full"
        aria-label="Open feedback form"
      >
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-blue)]" />
        </span>
        Feedback
      </button>
      <FeedbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
