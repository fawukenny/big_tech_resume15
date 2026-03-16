import { getScoreTheme } from "./scoreTheme";
import type { AnalysisResult, FeedbackItem } from "@/types/resume";

const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const FOOTER_Y = 285;
const YOUTUBE_URL = "https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz";

function checkNewPage(doc: import("jspdf").jsPDF, y: number, needed: number): number {
  if (y + needed > FOOTER_Y) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawFooter(doc: import("jspdf").jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "© 2026 Liberty Experience Inc. Designed by Kehinde Fawumi",
      MARGIN,
      FOOTER_Y + 8
    );
  }
}

export function getReportPdfBlob(analysis: AnalysisResult): Promise<Blob> {
  return new Promise((resolve) => {
    import("jspdf").then((mod) => {
      const jsPDF = mod.default;
      const doc = new jsPDF();
      let y = 20;

      // Branded header
      doc.setFillColor(26, 26, 32);
      doc.rect(0, 0, PAGE_W, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Big Tech Resume Review", MARGIN, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Make your resume Big Tech / MAANG ready", MARGIN, 27);
      y = 44;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      // Overall score
      const overallTheme = getScoreTheme(analysis.overallScore);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Overall score: ${overallTheme.label} (${analysis.overallScore}/100)`, MARGIN, y);
      y += 14;

      // Summary by section (merge Resume + Other into one)
      const sectionScoresForReport = (() => {
        const resumeOther = ["resume", "other"];
        const out: { label: string; score: number; feedback: string[] }[] = [];
        let merged: { label: string; score: number; feedback: string[] } | null = null;
        for (const s of analysis.sectionScores) {
          const labelLower = s.label.toLowerCase().trim();
          if (resumeOther.includes(labelLower)) {
            if (!merged) {
              merged = { label: "Resume & contact", score: s.score, feedback: [...(s.feedback || [])] };
            } else {
              merged.feedback = [...merged.feedback, ...(s.feedback || [])];
              merged.score = Math.round((merged.score + s.score) / 2);
            }
          } else {
            if (merged) {
              out.push(merged);
              merged = null;
            }
            out.push({ label: s.label, score: s.score, feedback: s.feedback || [] });
          }
        }
        if (merged) out.push(merged);
        return out;
      })();
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary by section", MARGIN, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      sectionScoresForReport.forEach((s) => {
        y = checkNewPage(doc, y, 8);
        const theme = getScoreTheme(s.score);
        const why = s.feedback?.[0] ? ` — ${s.feedback[0]}` : "";
        const line = `${s.label}: ${theme.label}${why}`;
        const lines = doc.splitTextToSize(line, CONTENT_W);
        lines.forEach((line: string) => {
          doc.text(line, MARGIN, y);
          y += 5;
        });
        y += 2;
      });
      y += 6;

      // Benchmark
      y = checkNewPage(doc, y, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("How you compare", MARGIN, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const b = analysis.benchmark;
      doc.text(
        `Your score: ${overallTheme.label} (${b.yourScore})  |  Top performers avg: ${b.topPerformersAvg}  |  Industry avg: ${b.industryAvg}  |  Percentile: ${b.percentile}%`,
        MARGIN,
        y
      );
      y += 14;

      // Positive feedback
      const praise: FeedbackItem[] = analysis.feedback.filter((f) => f.type === "praise");
      if (praise.length > 0) {
        y = checkNewPage(doc, y, 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 60);
        doc.text("What's working", MARGIN, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        praise.forEach((f) => {
          y = checkNewPage(doc, y, 18);
          const lines = doc.splitTextToSize("• " + f.message, CONTENT_W);
          lines.forEach((line: string) => {
            doc.text(line, MARGIN, y);
            y += 5;
          });
          y += 2;
        });
        y += 6;
      }

      // Improvement & action items
      const actions: FeedbackItem[] = analysis.feedback.filter(
        (f) => f.type === "improve" || f.type === "critical"
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(160, 50, 50);
      doc.text("Improvement & action items", MARGIN, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (actions.length === 0) {
        doc.text("No improvement items for this review.", MARGIN, y);
        y += 10;
      } else {
        actions.forEach((f) => {
          y = checkNewPage(doc, y, 24);
          const lines = doc.splitTextToSize("• " + f.message, CONTENT_W);
          lines.forEach((line: string) => {
            doc.text(line, MARGIN, y);
            y += 5;
          });
          if (f.suggestedRewrite && f.suggestedRewrite.trim()) {
            y += 2;
            doc.setFont("helvetica", "italic");
            const sugLines = doc.splitTextToSize("  Suggested: " + f.suggestedRewrite.trim(), CONTENT_W - 10);
            sugLines.forEach((line: string) => {
              doc.text(line, MARGIN + 4, y);
              y += 5;
            });
            doc.setFont("helvetica", "normal");
          }
          y += 2;
        });
      }
      y += 10;

      // YouTube CTA (wrap URL so it doesn't overflow)
      const ctaBoxPadding = 6;
      const ctaTitle = "Insider's guide: How to Elevate Your Resume for Big Tech";
      const ctaLine2 = "Free YouTube course: " + YOUTUBE_URL;
      const ctaTitleLines = doc.splitTextToSize(ctaTitle, CONTENT_W - 2 * ctaBoxPadding);
      const ctaUrlLines = doc.splitTextToSize(ctaLine2, CONTENT_W - 2 * ctaBoxPadding);
      const ctaBoxH = 8 + ctaTitleLines.length * 5 + 4 + ctaUrlLines.length * 5 + 8;
      y = checkNewPage(doc, y, ctaBoxH + 4);
      doc.setDrawColor(60, 120, 200);
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(MARGIN, y - 4, CONTENT_W, ctaBoxH, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40, 90, 180);
      let ctaY = y + 6;
      ctaTitleLines.forEach((line: string) => {
        doc.text(line, MARGIN + ctaBoxPadding, ctaY);
        ctaY += 5;
      });
      ctaY += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      ctaUrlLines.forEach((line: string) => {
        doc.text(line, MARGIN + ctaBoxPadding, ctaY);
        ctaY += 5;
      });
      y += ctaBoxH + 4;

      drawFooter(doc);
      resolve(doc.output("blob"));
    });
  });
}
