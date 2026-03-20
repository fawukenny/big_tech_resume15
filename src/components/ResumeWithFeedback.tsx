"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { AnalysisResult, FeedbackItem } from "@/types/resume";
import { preprocessResumeBody } from "@/lib/parseResume";
import {
  PdfDocumentWithHighlights,
  type PdfDocumentWithHighlightsHandle,
} from "@/components/PdfDocumentWithHighlights";
import { RecruiterNotesTabs, ResumeViewTabs } from "@/components/ResultsTabs";

export type ResultsTabsConfig = {
  resume: {
    view: "document" | "highlights";
    setView: (v: "document" | "highlights") => void;
    isPdf: boolean;
    onSelectDocument: () => void;
  };
  notes: {
    tab: "positive" | "improve";
    setTab: (v: "positive" | "improve") => void;
  };
};

type Props = {
  analysis: AnalysisResult;
  pdfDocumentUrl?: string | null;
  resumeDisplayMode?: "structured" | "pdf";
  pdfViewerRemountKey?: number;
  feedbackToneFilter: "positive" | "improve";
  resultsTabs: ResultsTabsConfig;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MIN_SNIPPET_LENGTH_BODY = 5;
const MIN_SNIPPET_LENGTH_TITLE = 2;

function feedbackHasHighlightInBody(text: string, snippet: string): boolean {
  if (!snippet || snippet.length < MIN_SNIPPET_LENGTH_BODY) return false;
  const clean = snippet.replace(/\s+/g, " ").trim().slice(0, 60);
  if (text.indexOf(clean) !== -1) return true;
  const words = clean.split(/\s+/).slice(0, 4).join(" ");
  return words.length >= MIN_SNIPPET_LENGTH_BODY && text.search(new RegExp(escapeRegex(words), "i")) !== -1;
}

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
  const typeClass =
    feedback.type === "praise" ? "type-praise" : feedback.type === "critical" ? "type-critical" : "type-improve";
  const idx = text.indexOf(clean);
  if (idx === -1) {
    const words = clean.split(/\s+/).slice(0, 4).join(" ");
    const idx2 = text.search(new RegExp(escapeRegex(words), "i"));
    if (idx2 === -1) return text;
    const before = text.slice(0, idx2);
    const match = text.slice(idx2, idx2 + 80);
    const after = text.slice(idx2 + 80);
    const id = feedback.id.replace(/\s/g, "-");
    return `${before}<span class="resume-highlight resume-highlight-clickable ${typeClass}" data-feedback-id="${id}" title="Click to see feedback">${match}</span>${after}`;
  }
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + snippet.length);
  const after = text.slice(idx + snippet.length);
  const id = feedback.id.replace(/\s/g, "-");
  return `${before}<span class="resume-highlight resume-highlight-clickable ${typeClass}" data-feedback-id="${id}" title="Click to see feedback">${match}</span>${after}`;
}

function stripTagsForBulletTest(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function isResumeBulletLine(html: string): boolean {
  let t = stripTagsForBulletTest(html);
  if (!t) return false;
  t = t.replace(/^[•●▪·\s]+/, "");
  return /^[•●▪·\-\–\—]/.test(t) || /^\d{1,2}\.\s/.test(t);
}

function formatResumeHighlightedBody(html: string): string {
  const paragraphs = html.split(/\n\n+/);
  const chunks: string[] = [];
  for (const block of paragraphs) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    let i = 0;
    while (i < lines.length) {
      if (isResumeBulletLine(lines[i])) {
        const bullets: string[] = [];
        while (i < lines.length && isResumeBulletLine(lines[i])) {
          bullets.push(lines[i]);
          i++;
        }
        chunks.push(
          `<ul class="resume-bullet-list">${bullets.map((l) => `<li class="resume-li">${l}</li>`).join("")}</ul>`
        );
      } else {
        chunks.push(`<p class="resume-body-block">${lines[i]}</p>`);
        i++;
      }
    }
  }
  return `<div class="resume-flow-inner">${chunks.join("")}</div>`;
}

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

export function ResumeWithFeedback({
  analysis,
  pdfDocumentUrl,
  resumeDisplayMode = "structured",
  pdfViewerRemountKey = 0,
  feedbackToneFilter,
  resultsTabs,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightFlash, setHighlightFlash] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const resumeColRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const pdfHighlightsRef = useRef<PdfDocumentWithHighlightsHandle>(null);

  const usePdfPane = Boolean(pdfDocumentUrl && resumeDisplayMode === "pdf");
  const feedback = analysis.feedback;

  const structuredDisplay = useMemo(
    () =>
      analysis.structuredContent.map((b) => ({
        ...b,
        body: preprocessResumeBody(b.body),
      })),
    [analysis.structuredContent]
  );

  const { linked: linkedFeedback, generic: genericFeedback } = useMemo(
    () => partitionFeedback(structuredDisplay, feedback),
    [structuredDisplay, feedback]
  );

  const orderedLinkedFeedback = useMemo(
    () => getOrderedFeedback(structuredDisplay, linkedFeedback),
    [structuredDisplay, linkedFeedback]
  );

  const linkedPraise = useMemo(
    () => orderedLinkedFeedback.filter((f) => f.type === "praise"),
    [orderedLinkedFeedback]
  );
  const linkedImprove = useMemo(
    () => orderedLinkedFeedback.filter((f) => f.type !== "praise"),
    [orderedLinkedFeedback]
  );
  const genericPraise = useMemo(() => genericFeedback.filter((f) => f.type === "praise"), [genericFeedback]);
  const genericImprove = useMemo(() => genericFeedback.filter((f) => f.type !== "praise"), [genericFeedback]);

  const contentWithHighlights = useMemo(() => {
    return structuredDisplay.map((block) => {
      let body = block.body;
      const forSection = linkedFeedback.filter((f) => f.section === block.section);
      for (const f of forSection) {
        if (f.snippet && feedbackHasHighlightInBody(block.body, f.snippet)) body = highlightSnippet(body, f.snippet, f);
      }
      const titleMatch = forSection.find(
        (f) => f.snippet && snippetMatchesSectionTitle(f.snippet, block.title)
      );
      const titleTypeClass = titleMatch
        ? titleMatch.type === "praise"
          ? "type-praise"
          : titleMatch.type === "critical"
            ? "type-critical"
            : "type-improve"
        : null;
      return {
        ...block,
        body,
        titleHighlightId: titleMatch ? titleMatch.id.replace(/\s/g, "-") : null,
        titleHighlightTypeClass: titleTypeClass,
      };
    });
  }, [structuredDisplay, linkedFeedback]);

  useEffect(() => {
    if (usePdfPane) return;
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
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      setTimeout(() => setHighlightFlash(null), 1200);
    };
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [usePdfPane]);

  useEffect(() => {
    if (usePdfPane) return;
    const container = resumeColRef.current;
    if (!container) return;

    const getIdFromEvent = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.("[data-feedback-id]") as HTMLElement | null;
      return target?.getAttribute?.("data-feedback-id") ?? null;
    };

    const handleOver = (e: MouseEvent) => {
      const id = getIdFromEvent(e);
      if (id) setHoveredId(id);
    };

    const handleOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (related && related.closest?.("[data-feedback-id]")) return;
      setHoveredId(null);
    };

    container.addEventListener("mouseover", handleOver);
    container.addEventListener("mouseout", handleOut);
    return () => {
      container.removeEventListener("mouseover", handleOver);
      container.removeEventListener("mouseout", handleOut);
    };
  }, [usePdfPane]);

  const selectFeedbackFromResume = (id: string) => {
    setSelectedId(id);
    setHighlightFlash(id);
    const el = itemRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    setTimeout(() => setHighlightFlash(null), 1200);
  };

  const handleFeedbackClick = (id: string) => {
    setSelectedId(id);
    const el = itemRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    if (usePdfPane) {
      pdfHighlightsRef.current?.scrollToFeedbackId(id);
    } else {
      const span = resumeColRef.current?.querySelector<HTMLElement>(`[data-feedback-id="${id}"]`);
      if (span) {
        span.classList.add("resume-highlight-flash");
        span.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        setTimeout(() => span.classList.remove("resume-highlight-flash"), 1200);
      }
    }
  };

  const renderFeedbackCard = (f: FeedbackItem, opts: { dashed?: boolean }) => {
    const id = f.id.replace(/\s/g, "-");
    const isSelected = selectedId === id;
    const isFlash = highlightFlash === id;
    const dashed = opts.dashed ?? false;
    return (
      <li
        key={f.id}
        ref={(el) => {
          itemRefs.current[id] = el;
        }}
        className={`rounded-xl border p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
          dashed ? "border-dashed border-[var(--border)]" : "border-[var(--border)]"
        } ${
          isSelected || isFlash
            ? "border-white/40 bg-white/[0.08] ring-2 ring-white/30"
            : hoveredId === id
              ? "border-white/30 bg-white/[0.06] ring-2 ring-white/10"
              : "bg-white/[0.04] hover:border-white/20"
        } ${isFlash ? "animate-pulse-once" : ""}`}
        onClick={() => handleFeedbackClick(id)}
        onMouseEnter={() => setHoveredId(id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 ${
            f.type === "praise"
              ? "bg-[var(--success)]"
              : f.type === "critical"
                ? "bg-[var(--error)]"
                : "bg-[var(--warning)]"
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
  };

  const feedbackAsideShell =
    feedbackToneFilter === "positive" ? "bg-emerald-950/[0.14]" : "bg-amber-950/[0.18]";

  const notesPanelBorder =
    feedbackToneFilter === "positive" ? "border-emerald-500/30" : "border-amber-500/40";

  const structuredResumeBlocks = (
    <div className="resume-content w-full">
      <div className="cv-parse-view">
        <div className="space-y-0">
          {contentWithHighlights.map((block, i) => (
            <div key={i} className={i > 0 ? "cv-parse-section-divider" : ""}>
              {block.title && (
                <h2 className="cv-parse-section-title">
                  {block.titleHighlightId ? (
                    <span
                      className={`resume-highlight resume-highlight-clickable ${block.titleHighlightTypeClass ?? ""}`}
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
                className="resume-flow cv-parse-flow break-words"
                dangerouslySetInnerHTML={{ __html: formatResumeHighlightedBody(block.body) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const resumeMiddle = (
    <div className="resume-paper-wrapper min-w-0 w-full !max-w-none justify-center !py-0">
      {usePdfPane && pdfDocumentUrl ? (
        <PdfDocumentWithHighlights
          key={`${pdfDocumentUrl}-${pdfViewerRemountKey}`}
          ref={pdfHighlightsRef}
          fileUrl={pdfDocumentUrl}
          feedback={orderedLinkedFeedback}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onHoverHighlight={setHoveredId}
          onSelectFeedback={selectFeedbackFromResume}
          embedInParentScroll
          scrollContainerRef={resumeColRef}
        />
      ) : (
        <div className="w-full max-w-[720px] mx-auto">{structuredResumeBlocks}</div>
      )}
    </div>
  );

  const isPositive = feedbackToneFilter === "positive";
  const linked = isPositive ? linkedPraise : linkedImprove;
  const generic = isPositive ? genericPraise : genericImprove;
  const emptyMsg = isPositive
    ? "No praise notes on this pass."
    : "No improvement notes on this pass.";

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6 lg:gap-8 items-start">
        <div className="min-w-0 w-full">
          <div className="flex flex-col min-h-0 max-h-[min(72vh,680px)] w-full rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <ResumeViewTabs
              value={resultsTabs.resume.view}
              onChange={resultsTabs.resume.setView}
              isPdf={resultsTabs.resume.isPdf}
              onSelectDocument={resultsTabs.resume.onSelectDocument}
            />
            <div
              ref={resumeColRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-2 sm:px-3 py-2 sm:py-3"
            >
              {resumeMiddle}
            </div>
          </div>
        </div>

        <div
          className={`flex flex-col min-h-0 max-h-[min(72vh,680px)] w-full rounded-2xl border ${notesPanelBorder} overflow-hidden`}
        >
          <RecruiterNotesTabs value={resultsTabs.notes.tab} onChange={resultsTabs.notes.setTab} />
          <aside
            className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-3 sm:p-4 ${feedbackAsideShell}`}
          >
            <div className="space-y-3 flex-1 min-h-0">
              {linked.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2">On your resume</p>
                  <ul className="space-y-2 list-none m-0 p-0">{linked.map((f) => renderFeedbackCard(f, {}))}</ul>
                </div>
              )}
              {generic.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] font-medium text-[var(--text-muted)] mb-2">High-level</p>
                  <ul className="space-y-2 list-none m-0 p-0">
                    {generic.map((f) => renderFeedbackCard(f, { dashed: true }))}
                  </ul>
                </div>
              )}
              {linked.length === 0 && generic.length === 0 && (
                <p className="text-xs text-[var(--text-muted)] italic">{emptyMsg}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
