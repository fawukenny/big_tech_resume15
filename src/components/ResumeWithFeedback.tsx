"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { AnalysisResult, FeedbackItem } from "@/types/resume";

type Props = { analysis: AnalysisResult };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MIN_SNIPPET_LENGTH_BODY = 5;
const MIN_SNIPPET_LENGTH_TITLE = 2;

/** True if this feedback's snippet appears in the given text (so it can be highlighted on the resume). */
function feedbackHasHighlightInBody(text: string, snippet: string): boolean {
  if (!snippet || snippet.length < MIN_SNIPPET_LENGTH_BODY) return false;
  const clean = snippet.replace(/\s+/g, " ").trim().slice(0, 60);
  if (text.indexOf(clean) !== -1) return true;
  const words = clean.split(/\s+/).slice(0, 4).join(" ");
  return words.length >= MIN_SNIPPET_LENGTH_BODY && text.search(new RegExp(escapeRegex(words), "i")) !== -1;
}

/** True if snippet matches the section title (for section-level feedback, e.g. "Profile Summary", "Education and Certifications"). */
function snippetMatchesSectionTitle(snippet: string, sectionTitle: string): boolean {
  if (!snippet || !sectionTitle) return false;
  const a = snippet.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 80);
  const b = sectionTitle.replace(/\s+/g, " ").trim().toLowerCase();
  if (a.length < MIN_SNIPPET_LENGTH_TITLE || b.length < MIN_SNIPPET_LENGTH_TITLE) return false;
  return a === b || b.includes(a) || a.includes(b);
}

function highlightSnippet(text: string, snippet: string, feedback: FeedbackItem): string {
  if (!snippet || snippet.length < MIN_SNIPPET_LENGTH_BODY) return text;
  const clean = snippet.replace(/\s+/g, " ").trim().slice(0, 60);
  const idx = text.indexOf(clean);
  if (idx === -1) {
    const words = clean.split(/\s+/).slice(0, 4).join(" ");
    const idx2 = text.search(new RegExp(escapeRegex(words), "i"));
    if (idx2 === -1) return text;
    const before = text.slice(0, idx2);
    const match = text.slice(idx2, idx2 + 80);
    const after = text.slice(idx2 + 80);
    const id = feedback.id.replace(/\s/g, "-");
    return `${before}<span class="resume-highlight resume-highlight-clickable ${feedback.type === "praise" ? "strong" : ""}" data-feedback-id="${id}" title="Click to see feedback">${match}</span>${after}`;
  }
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + snippet.length);
  const after = text.slice(idx + snippet.length);
  const id = feedback.id.replace(/\s/g, "-");
  return `${before}<span class="resume-highlight resume-highlight-clickable ${feedback.type === "praise" ? "strong" : ""}" data-feedback-id="${id}" title="Click to see feedback">${match}</span>${after}`;
}

/** Order feedback by appearance in the resume: section order, then title-only feedback first in section, then by body position. */
function getOrderedFeedback(
  structuredContent: { section: string; title: string; body: string }[],
  feedback: FeedbackItem[]
): FeedbackItem[] {
  const ordered: FeedbackItem[] = [];
  const seen = new Set<string>();
  for (const block of structuredContent) {
    const forSection = feedback.filter((f) => {
      if (f.section !== block.section || !f.snippet) return false;
      return feedbackHasHighlightInBody(block.body, f.snippet) || snippetMatchesSectionTitle(f.snippet, block.title);
    });
    forSection.sort((a, b) => {
      const aTitleOnly = snippetMatchesSectionTitle(a.snippet, block.title) && !feedbackHasHighlightInBody(block.body, a.snippet);
      const bTitleOnly = snippetMatchesSectionTitle(b.snippet, block.title) && !feedbackHasHighlightInBody(block.body, b.snippet);
      if (aTitleOnly && !bTitleOnly) return -1;
      if (!aTitleOnly && bTitleOnly) return 1;
      const posA = block.body.indexOf(a.snippet.trim().slice(0, 40));
      const posB = block.body.indexOf(b.snippet.trim().slice(0, 40));
      return (posA === -1 ? 9999 : posA) - (posB === -1 ? 9999 : posB);
    });
    for (const f of forSection) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        ordered.push(f);
      }
    }
  }
  const remaining = feedback.filter((f) => !seen.has(f.id));
  return [...ordered, ...remaining];
}

/** Split feedback into items linked to resume (body or section header) vs high-level / missing. */
function partitionFeedback(
  structuredContent: { section: string; title: string; body: string }[],
  feedback: FeedbackItem[]
): { linked: FeedbackItem[]; generic: FeedbackItem[] } {
  const linked: FeedbackItem[] = [];
  const generic: FeedbackItem[] = [];
  for (const f of feedback) {
    const block = structuredContent.find((b) => b.section === f.section);
    const hasHighlight =
      block &&
      f.snippet &&
      (feedbackHasHighlightInBody(block.body, f.snippet) || snippetMatchesSectionTitle(f.snippet, block.title));
    if (hasHighlight) linked.push(f);
    else generic.push(f);
  }
  return { linked, generic };
}

export function ResumeWithFeedback({ analysis }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightFlash, setHighlightFlash] = useState<string | null>(null);
  const resumeColRef = useRef<HTMLDivElement>(null);
  const feedbackColRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const { structuredContent, feedback } = analysis;

  const { linked: linkedFeedback, generic: genericFeedback } = useMemo(
    () => partitionFeedback(structuredContent, feedback),
    [structuredContent, feedback]
  );

  const orderedLinkedFeedback = useMemo(
    () => getOrderedFeedback(structuredContent, linkedFeedback),
    [structuredContent, linkedFeedback]
  );

  const contentWithHighlights = useMemo(() => {
    return structuredContent.map((block) => {
      let body = block.body;
      const forSection = linkedFeedback.filter((f) => f.section === block.section);
      for (const f of forSection) {
        if (f.snippet && feedbackHasHighlightInBody(block.body, f.snippet)) body = highlightSnippet(body, f.snippet, f);
      }
      const titleMatch = forSection.find(
        (f) => f.snippet && snippetMatchesSectionTitle(f.snippet, block.title)
      );
      return {
        ...block,
        body,
        titleHighlightId: titleMatch ? titleMatch.id.replace(/\s/g, "-") : null,
      };
    });
  }, [structuredContent, linkedFeedback]);

  useEffect(() => {
    const resize = () => {
      if (resumeColRef.current && feedbackColRef.current) {
        const h = resumeColRef.current.offsetHeight;
        feedbackColRef.current.style.maxHeight = `${h}px`;
      }
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (resumeColRef.current) obs.observe(resumeColRef.current);
    return () => obs.disconnect();
  }, [contentWithHighlights]);

  useEffect(() => {
    const container = resumeColRef.current;
    if (!container) return;
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.("[data-feedback-id]");
      if (!target) return;
      const id = (target as HTMLElement).getAttribute("data-feedback-id");
      if (!id) return;
      setSelectedId(id);
      setHighlightFlash(id);
      const el = itemRefs.current[id];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => setHighlightFlash(null), 1200);
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  const handleFeedbackClick = (id: string) => {
    setSelectedId(id);
    const el = itemRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const span = resumeColRef.current?.querySelector<HTMLElement>(`[data-feedback-id="${id}"]`);
    if (span) {
      span.classList.add("resume-highlight-flash");
      span.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(() => span.classList.remove("resume-highlight-flash"), 1200);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8 items-start">
      <div ref={resumeColRef} className="resume-paper-wrapper">
        <div className="resume-paper">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Click highlighted text to jump to feedback; click feedback to jump to the highlight on the resume.
          </p>
          <div className="resume-content space-y-6">
            {contentWithHighlights.map((block, i) => (
              <section key={i}>
                {block.title && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {block.titleHighlightId ? (
                      <span
                        className="resume-highlight resume-highlight-clickable"
                        data-feedback-id={block.titleHighlightId}
                        title="Click to see feedback"
                      >
                        {block.title}
                      </span>
                    ) : (
                      block.title
                    )}
                  </h2>
                )}
                <div
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{
                    __html: block.body.replace(/\n/g, "<br />"),
                  }}
                />
              </section>
            ))}
          </div>
        </div>
      </div>

      <div ref={feedbackColRef} className="flex flex-col min-h-0 overflow-hidden">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 shrink-0">
          All feedback ({feedback.length})
        </h3>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
              On your resume ({orderedLinkedFeedback.length})
            </p>
            <ul className="space-y-3">
              {orderedLinkedFeedback.map((f) => {
                const id = f.id.replace(/\s/g, "-");
                const isSelected = selectedId === id;
                const isFlash = highlightFlash === id;
                return (
                  <li
                    key={f.id}
                    ref={(el) => { itemRefs.current[id] = el; }}
                    className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                      isSelected || isFlash
                        ? "border-white/40 bg-white/[0.08] ring-2 ring-white/30"
                        : "border-[var(--border)] bg-white/[0.04] hover:border-white/20"
                    } ${isFlash ? "animate-pulse-once" : ""}`}
                    onClick={() => handleFeedbackClick(id)}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        f.type === "praise" ? "bg-[var(--success)]" : f.type === "critical" ? "bg-[var(--error)]" : "bg-[var(--warning)]"
                      }`}
                    />
                    <p className="text-sm font-medium text-[var(--text)]">{f.message}</p>
                    {f.suggestedRewrite && (
                      <p className="text-xs text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border)]">
                        <span className="font-medium">Suggested:</span> {f.suggestedRewrite}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {genericFeedback.length > 0 && (
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
                High-level & suggested additions ({genericFeedback.length})
              </p>
              <ul className="space-y-3">
                {genericFeedback.map((f) => {
                  const id = f.id.replace(/\s/g, "-");
                  const isSelected = selectedId === id;
                  const isFlash = highlightFlash === id;
                  return (
                    <li
                      key={f.id}
                      ref={(el) => { itemRefs.current[id] = el; }}
                      className={`rounded-xl border border-dashed border-[var(--border)] p-4 cursor-pointer transition-all duration-200 ${
                        isSelected || isFlash
                          ? "border-white/30 bg-white/[0.06] ring-2 ring-white/20"
                          : "bg-white/[0.03] hover:border-white/15"
                      } ${isFlash ? "animate-pulse-once" : ""}`}
                      onClick={() => handleFeedbackClick(id)}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          f.type === "praise" ? "bg-[var(--success)]" : f.type === "critical" ? "bg-[var(--error)]" : "bg-[var(--warning)]"
                        }`}
                      />
                      <p className="text-sm font-medium text-[var(--text)]">{f.message}</p>
                      {f.suggestedRewrite && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 pt-2 border-t border-[var(--border)]">
                          <span className="font-medium">Suggested:</span> {f.suggestedRewrite}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
