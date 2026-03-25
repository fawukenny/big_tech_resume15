"use client";

import { trackClientEvent } from "@/lib/trackClient";

const YOUTUBE_PLAYLIST =
  "https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz";

/** Floating CTA aligned with the Feedback FAB (stacked above it in ClientChrome). */
export function FloatingCourseLink() {
  return (
    <a
      href={YOUTUBE_PLAYLIST}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClientEvent("course_click", "floating_course_link")}
      className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-[var(--surface-elevated)]/95 backdrop-blur-md px-4 py-2.5 shadow-lg shadow-black/40 text-xs sm:text-sm font-semibold text-[var(--text)] hover:border-red-500/40 hover:bg-white/[0.08] transition-all duration-200 animate-feedback-fab focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] w-full text-center"
      aria-label="Free YouTube course: elevate your resume for Big Tech"
    >
      <svg className="w-4 h-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
      <span className="leading-tight">Free resume course</span>
    </a>
  );
}
