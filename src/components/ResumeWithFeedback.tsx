"use client";

import { useMemo, useState } from "react";
import type { AnalysisResult, FeedbackItem } from "@/types/resume";

type Props = { analysis: AnalysisResult };

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightSnippet(text: string, snippet: string, feedback: FeedbackItem): string {
  if (!snippet || snippet.length < 5) return text;
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
    const tooltip = feedback.message + (feedback.suggestedRewrite ? `\n\nSuggested: ${feedback.suggestedRewrite}` : "");
    return `${before}<span class="resume-highlight ${feedback.type === "praise" ? "strong" : ""}" data-tooltip="${tooltip.replace(/"/g, "&quot;")}" data-feedback-id="${id}">${match}</span>${after}`;
  }
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + snippet.length);
  const after = text.slice(idx + snippet.length);
  const tooltip = feedback.message + (feedback.suggestedRewrite ? `\n\nSuggested: ${feedback.suggestedRewrite}` : "");
  const id = feedback.id.replace(/\s/g, "-");
  return `${before}<span class="resume-highlight ${feedback.type === "praise" ? "strong" : ""}" data-tooltip="${tooltip.replace(/"/g, "&quot;")}" data-feedback-id="${id}">${match}</span>${after}`;
}

export function ResumeWithFeedback({ analysis }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { structuredContent, feedback } = analysis;

  const contentWithHighlights = useMemo(() => {
    return structuredContent.map((block) => {
      let body = block.body;
      const forSection = feedback.filter((f) => f.section === block.section);
      for (const f of forSection) {
        if (f.snippet) body = highlightSnippet(body, f.snippet, f);
      }
      return { ...block, body };
    });
  }, [structuredContent, feedback]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
      {/* Paper-style resume: overlay feedback on the actual resume for a pen-on-paper feel */}
      <div className="resume-paper-wrapper">
        <div className="resume-paper">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Hover over highlighted text to see feedback — like notes on a printed resume.
          </p>
          <div className="resume-content space-y-6">
            {contentWithHighlights.map((block, i) => (
              <section key={i}>
                {block.title && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {block.title}
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

      <div className="flex flex-col lg:h-full min-h-0">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 shrink-0">
          All feedback ({feedback.length})
        </h3>
        <ul className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {feedback.map((f) => (
            <li
              key={f.id}
              className={`rounded-xl border p-4 cursor-pointer transition-colors ${
                selectedId === f.id.replace(/\s/g, "-")
                  ? "border-white/30 bg-white/[0.08]"
                  : "border-[var(--border)] bg-white/[0.04] hover:border-white/20"
              }`}
              onClick={() => setSelectedId(f.id.replace(/\s/g, "-"))}
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
          ))}
        </ul>
      </div>
    </div>
  );
}
