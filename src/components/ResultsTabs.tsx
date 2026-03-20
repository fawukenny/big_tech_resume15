"use client";

type ResumeView = "document" | "highlights";

export function ResumeViewTabs({
  value,
  onChange,
  isPdf,
  onSelectDocument,
}: {
  value: ResumeView;
  onChange: (v: ResumeView) => void;
  isPdf: boolean;
  onSelectDocument: () => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Resume view"
      className="flex shrink-0 items-end gap-0.5 border-b border-white/10 bg-black/20 px-2 pt-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "document"}
        disabled={!isPdf}
        className={`shrink-0 rounded-t-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
          value === "document"
            ? "relative z-[1] -mb-px border border-b-0 border-white/15 bg-violet-500/20 text-white ring-1 ring-violet-400/40"
            : "border border-transparent border-b-0 text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
        }`}
        onClick={() => {
          onSelectDocument();
          onChange("document");
        }}
      >
        Document (PDF)
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "highlights"}
        className={`shrink-0 rounded-t-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
          value === "highlights"
            ? "relative z-[1] -mb-px border border-b-0 border-white/15 bg-violet-500/20 text-white ring-1 ring-violet-400/40"
            : "border border-transparent border-b-0 text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-[var(--text)]"
        }`}
        onClick={() => onChange("highlights")}
      >
        Text highlights
      </button>
    </div>
  );
}

export function RecruiterNotesTabs({
  value,
  onChange,
}: {
  value: "positive" | "improve";
  onChange: (v: "positive" | "improve") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Recruiter notes"
      className="flex shrink-0 items-end gap-0.5 border-b border-white/10 bg-black/15 px-2 pt-2"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "positive"}
        className={`shrink-0 rounded-t-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
          value === "positive"
            ? "relative z-[1] -mb-px border border-b-0 border-emerald-500/35 bg-emerald-950/45 text-emerald-100 ring-1 ring-emerald-400/30"
            : "border border-transparent border-b-0 text-[var(--text-muted)] hover:bg-emerald-950/20 hover:text-emerald-100/90"
        }`}
        onClick={() => onChange("positive")}
      >
        What&apos;s working
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "improve"}
        className={`shrink-0 rounded-t-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
          value === "improve"
            ? "relative z-[1] -mb-px border border-b-0 border-amber-500/40 bg-amber-950/50 text-amber-50 ring-1 ring-amber-400/35"
            : "border border-transparent border-b-0 text-[var(--text-muted)] hover:bg-amber-950/25 hover:text-amber-100/90"
        }`}
        onClick={() => onChange("improve")}
      >
        Improvements &amp; risks
      </button>
    </div>
  );
}
