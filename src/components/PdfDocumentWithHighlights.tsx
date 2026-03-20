"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { FeedbackItem } from "@/types/resume";

export type PdfDocumentWithHighlightsHandle = {
  scrollToFeedbackId: (id: string) => void;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Map snippet to [start, end) in extracted PDF text for this page. */
function findRangeInString(fullText: string, snippet: string): { start: number; end: number } | null {
  const clean = snippet.replace(/\s+/g, " ").trim().slice(0, 80);
  if (clean.length < 5) return null;
  const idx = fullText.indexOf(clean);
  if (idx !== -1) return { start: idx, end: idx + clean.length };
  const lower = fullText.toLowerCase();
  const lc = clean.toLowerCase();
  const idx2 = lower.indexOf(lc);
  if (idx2 !== -1) return { start: idx2, end: idx2 + lc.length };
  const words = clean.split(/\s+/).slice(0, 4).join(" ");
  if (words.length < 5) return null;
  const re = new RegExp(escapeRegExp(words), "i");
  const m = fullText.match(re);
  if (!m || m.index === undefined) return null;
  return { start: m.index, end: m.index + Math.max(words.length, m[0].length) };
}

type TextItemLike = {
  str: string;
  transform: number[];
  width: number;
  height: number;
};

function boundsForTextItem(
  Util: { transform: (m1: number[], m2: number[]) => number[] },
  viewportTransform: number[],
  item: TextItemLike
) {
  const tx = Util.transform(viewportTransform, item.transform);
  const fontHeight = Math.hypot(tx[2], tx[3]) || Math.abs(item.height) || 11;
  const left = tx[4];
  const top = tx[5] - fontHeight;
  const wScale = Math.hypot(tx[0], tx[1]) || 1;
  const width = Math.max(wScale * (item.width || 0), item.str.length * fontHeight * 0.35);
  return { left, top, width, height: Math.max(fontHeight * 1.08, 10) };
}

export type PdfDocumentWithHighlightsProps = {
  fileUrl: string;
  feedback: FeedbackItem[];
  selectedId: string | null;
  onSelectFeedback: (id: string) => void;
  hoveredId: string | null;
  onHoverHighlight?: (feedbackId: string | null) => void;
  /** Outer column handles max-height + scroll; PDF pages stack without an inner scroll pane */
  embedInParentScroll?: boolean;
  /** Scroll container (e.g. results resume column). Required for correct scroll-to-highlight when embedInParentScroll is true. */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
};

type PageSlice = {
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
  highlightRects: {
    feedbackId: string;
    type: FeedbackItem["type"];
    /** Percent of page box (scales with responsive image). */
    leftPct: number;
    topPct: number;
    widthPct: number;
    heightPct: number;
  }[];
};

export const PdfDocumentWithHighlights = forwardRef<
  PdfDocumentWithHighlightsHandle,
  PdfDocumentWithHighlightsProps
>(function PdfDocumentWithHighlights(
  {
    fileUrl,
    feedback,
    selectedId,
    onSelectFeedback,
    hoveredId,
    onHoverHighlight,
    embedInParentScroll = false,
    scrollContainerRef,
  },
  ref
) {
  const [pages, setPages] = useState<PageSlice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const firstHighlightEl = useRef<Record<string, HTMLElement | null>>({});
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const feedbackSig = useMemo(
    () =>
      JSON.stringify(
        feedback.map((f) => ({ id: f.id, snippet: f.snippet, type: f.type }))
      ),
    [feedback]
  );
  const feedbackRef = useRef(feedback);
  feedbackRef.current = feedback;

  useImperativeHandle(ref, () => ({
    scrollToFeedbackId: (id: string) => {
      const el = firstHighlightEl.current[id];
      if (!el) return;
      const root = scrollContainerRef?.current ?? scrollRootRef.current;
      if (root) {
        const elRect = el.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const offsetTop = elRect.top - rootRect.top + root.scrollTop;
        const padding = 48;
        const target = Math.max(0, offsetTop - padding);
        root.scrollTo({ top: target, left: 0, behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
      el.classList.add("pdf-highlight-flash");
      setTimeout(() => el.classList.remove("pdf-highlight-flash"), 1200);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let pdfDoc: import("pdfjs-dist").PDFDocumentProxy | null = null;
    firstHighlightEl.current = {};

    (async () => {
      setLoading(true);
      setError(null);
      setPages([]);
      try {
        const pdfjs = await import("pdfjs-dist");
        const { getDocument, GlobalWorkerOptions, Util } = pdfjs;
        GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        // Read blob/data URL into memory — avoids pdf.js getting stuck reopening the same blob URL after unmount.
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Could not read the PDF file.");
        const data = new Uint8Array(await res.arrayBuffer());

        pdfDoc = await getDocument({ data, useSystemFonts: true }).promise;
        if (cancelled) return;

        const scale = 1.32;
        const built: PageSlice[] = [];

        for (let p = 1; p <= pdfDoc.numPages; p++) {
          if (cancelled) break;
          const page = await pdfDoc.getPage(p);
          const viewport = page.getViewport({ scale });
          const textContent = await page.getTextContent();
          const items: TextItemLike[] = [];
          for (const it of textContent.items) {
            if (typeof it !== "object" || it === null || !("str" in it)) continue;
            const raw = it as { str: string; transform: number[]; width: number; height: number };
            if (typeof raw.str !== "string" || !Array.isArray(raw.transform)) continue;
            items.push({
              str: raw.str,
              transform: raw.transform,
              width: typeof raw.width === "number" ? raw.width : 0,
              height: typeof raw.height === "number" ? raw.height : 0,
            });
          }

          let fullText = "";
          const spans: { start: number; end: number; item: TextItemLike }[] = [];
          for (const item of items) {
            const s = item.str || "";
            const start = fullText.length;
            fullText += s;
            spans.push({ start, end: fullText.length, item });
          }

          const highlightRects: PageSlice["highlightRects"] = [];
          for (const f of feedbackRef.current) {
            if (!f.snippet) continue;
            const range = findRangeInString(fullText, f.snippet);
            if (!range) continue;
            const feedbackId = f.id.replace(/\s/g, "-");
            for (const span of spans) {
              if (span.end <= range.start || span.start >= range.end) continue;
              const b = boundsForTextItem(Util, viewport.transform, span.item);
              const vw = viewport.width;
              const vh = viewport.height;
              const wPx = Math.max(b.width, 6);
              const hPx = Math.max(b.height, 12);
              highlightRects.push({
                feedbackId,
                type: f.type,
                leftPct: (b.left / vw) * 100,
                topPct: (b.top / vh) * 100,
                widthPct: (wPx / vw) * 100,
                heightPct: (hPx / vh) * 100,
              });
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not available");
          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          const dataUrl = canvas.toDataURL("image/png");
          built.push({
            pageNumber: p,
            width: viewport.width,
            height: viewport.height,
            dataUrl,
            highlightRects,
          });
        }

        if (!cancelled) setPages(built);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load PDF");
          setPages([]);
        }
      } finally {
        if (pdfDoc) {
          await pdfDoc.destroy().catch(() => {});
          pdfDoc = null;
        }
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, feedbackSig]);

  const setFirstRef = (feedbackId: string, el: HTMLElement | null) => {
    if (el && !firstHighlightEl.current[feedbackId]) {
      firstHighlightEl.current[feedbackId] = el;
    }
  };

  const rectClass = (type: FeedbackItem["type"], isSelected: boolean, isHover: boolean) => {
    const base =
      "absolute rounded-sm transition-shadow pointer-events-auto cursor-pointer border-0 p-0 bg-transparent";
    const tone =
      type === "praise"
        ? "pdf-hl-praise"
        : type === "critical"
          ? "pdf-hl-critical"
          : "pdf-hl-improve";
    const focus = isSelected ? " pdf-hl-selected" : isHover ? " pdf-hl-hover" : "";
    return `${base} ${tone}${focus}`;
  };

  const pageList = pages.map((pg) => (
    <div
      key={pg.pageNumber}
      data-pdf-page-wrap
      className="relative w-full max-w-full mx-auto shadow-md rounded-sm overflow-hidden bg-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pg.dataUrl}
        alt=""
        className="block w-full h-auto"
        width={pg.width}
        height={pg.height}
      />
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {pg.highlightRects.map((h, i) => {
          const isSelected = selectedId === h.feedbackId;
          const isHover = hoveredId === h.feedbackId;
          return (
            <button
              key={`${h.feedbackId}-${i}`}
              type="button"
              title="Click to see feedback"
              ref={(btn) => setFirstRef(h.feedbackId, btn)}
              className={rectClass(h.type, isSelected, isHover)}
              style={{
                left: `${h.leftPct}%`,
                top: `${h.topPct}%`,
                width: `${Math.max(h.widthPct, 0.35)}%`,
                height: `${Math.max(h.heightPct, 0.9)}%`,
              }}
              onClick={() => onSelectFeedback(h.feedbackId)}
              onMouseEnter={() => onHoverHighlight?.(h.feedbackId)}
              onMouseLeave={() => onHoverHighlight?.(null)}
            />
          );
        })}
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-[var(--text-muted)] ${
          embedInParentScroll ? "min-h-[120px] py-8" : "resume-paper min-h-[50vh]"
        }`}
      >
        Loading your PDF for highlights…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`text-sm text-[var(--error)] ${embedInParentScroll ? "py-4" : "resume-paper p-4 sm:p-6"}`}
      >
        {error}
        <p className="text-[var(--text-muted)] mt-2 text-xs">
          Try the &quot;Text highlights&quot; tab to see the parsed resume.
        </p>
      </div>
    );
  }

  if (embedInParentScroll) {
    return <div className="w-full space-y-5">{pageList}</div>;
  }

  return (
    <div className="resume-paper !max-w-none w-full">
      <div
        ref={scrollRootRef}
        className="max-h-[min(85vh,880px)] overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-xl border border-[var(--border)] bg-black/20 pr-1"
      >
        <div className="space-y-6 p-3 sm:p-4">{pageList}</div>
      </div>
    </div>
  );
});
