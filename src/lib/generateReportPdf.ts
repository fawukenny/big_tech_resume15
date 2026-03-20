import { getScoreTheme } from "./scoreTheme";
import { resolveFilterOutRisksDisplay } from "./filterOutRisks";
import type { AnalysisResult, FeedbackItem, RecruiterVerdict } from "@/types/resume";

const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const FOOTER_Y = 285;
const YOUTUBE_URL = "https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz";
const DESIGNER_LINKEDIN = "https://www.linkedin.com/in/kehindefawumi";

function checkNewPage(doc: import("jspdf").jsPDF, y: number, needed: number): number {
  if (y + needed > FOOTER_Y) {
    doc.addPage();
    return 20;
  }
  return y;
}

function verdictPdfPalette(rv: RecruiterVerdict): { fill: [number, number, number]; stroke: [number, number, number] } {
  const verdict = rv.verdict;
  const decision = rv.decision;
  const like = rv.hiringLikelihood;
  if (decision === "Interview" && verdict === "High Signal") {
    return { fill: [220, 252, 235], stroke: [16, 185, 129] };
  }
  if (decision === "Interview") {
    return { fill: [236, 253, 245], stroke: [52, 211, 153] };
  }
  if (decision === "Reject" || verdict === "Low Signal") {
    return { fill: [255, 247, 237], stroke: [251, 146, 60] };
  }
  if (like === "Low" || like === "Medium") {
    return { fill: [254, 252, 232], stroke: [250, 204, 21] };
  }
  return { fill: [244, 244, 245], stroke: [113, 113, 122] };
}

/** Vertical space needed for verdict panel content (must match draw loop spacing). */
function estimateVerdictPanelHeight(
  doc: import("jspdf").jsPDF,
  rv: RecruiterVerdict,
  analysis: AnalysisResult,
  innerW: number
): number {
  let h = 6;
  h += 6;
  const headline = `${rv.verdict}  •  ${rv.decision}  •  Interview likelihood: ${rv.hiringLikelihood}`;
  h += doc.splitTextToSize(headline, innerW).length * 4.8;
  const anchor = rv.anchorNote ? doc.splitTextToSize(rv.anchorNote, innerW) : [];
  if (anchor.length) {
    h += 2;
    h += anchor.length * 4.5;
  }
  h += 3;
  h += 5;
  const b = analysis.benchmark;
  const overallTheme = getScoreTheme(analysis.overallScore);
  const compareLine = `${overallTheme.label} (${b.yourScore}/100) · ${b.percentile}th percentile · Top candidates avg ${b.topPerformersAvg} · Industry avg ${b.industryAvg}`;
  h += doc.splitTextToSize(compareLine, innerW).length * 4.5;
  const strList = (rv.strengths ?? []).slice(0, 5);
  const weakList = (rv.criticalWeaknesses ?? []).slice(0, 5);
  if (strList.length) {
    h += 3 + 5;
    strList.forEach((s) => {
      h += doc.splitTextToSize("• " + s, innerW - 2).length * 4.5;
    });
  }
  if (weakList.length) {
    h += 3 + 5;
    weakList.forEach((s) => {
      h += doc.splitTextToSize("• " + s, innerW - 2).length * 4.5;
    });
  }
  h += 14;
  return h;
}

function drawFooter(doc: import("jspdf").jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const prefix = "© 2026 Liberty Experience Inc. Designed by ";
  const name = "Kehinde Fawumi";
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(prefix, MARGIN, FOOTER_Y + 8);
    const w = doc.getTextWidth(prefix);
    doc.setTextColor(59, 91, 219);
    doc.textWithLink(name, MARGIN + w, FOOTER_Y + 8, { url: DESIGNER_LINKEDIN });
    doc.setTextColor(100, 100, 100);
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

      // Recruiter verdict (themed panel — height from measured content to avoid overlap)
      const rv = analysis.recruiterVerdict;
      if (rv) {
        const pal = verdictPdfPalette(rv);
        const boxPad = 5;
        const innerW = CONTENT_W - 2 * boxPad;
        const headline = `${rv.verdict}  •  ${rv.decision}  •  Interview likelihood: ${rv.hiringLikelihood}`;
        const anchor = rv.anchorNote ? doc.splitTextToSize(rv.anchorNote, innerW) : [];
        const strList = (rv.strengths ?? []).slice(0, 5);
        const weakList = (rv.criticalWeaknesses ?? []).slice(0, 5);
        const b = analysis.benchmark;
        const compareLine = `${overallTheme.label} (${b.yourScore}/100) · ${b.percentile}th percentile · Top candidates avg ${b.topPerformersAvg} · Industry avg ${b.industryAvg}`;
        const compareLines = doc.splitTextToSize(compareLine, innerW);

        const panelH = estimateVerdictPanelHeight(doc, rv, analysis, innerW);
        y = checkNewPage(doc, y, panelH + 8);
        doc.setDrawColor(pal.stroke[0], pal.stroke[1], pal.stroke[2]);
        doc.setFillColor(pal.fill[0], pal.fill[1], pal.fill[2]);
        doc.roundedRect(MARGIN, y - 2, CONTENT_W, panelH + 4, 2, 2, "FD");

        let innerY = y + 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text("Recruiter verdict", MARGIN + boxPad, innerY);
        innerY += 6;
        doc.setFontSize(10);
        const headLines = doc.splitTextToSize(headline, innerW);
        headLines.forEach((line: string) => {
          doc.text(line, MARGIN + boxPad, innerY);
          innerY += 4.8;
        });
        doc.setFont("helvetica", "normal");
        if (anchor.length) {
          innerY += 2;
          anchor.forEach((line: string) => {
            doc.text(line, MARGIN + boxPad, innerY);
            innerY += 4.5;
          });
        }
        innerY += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(55, 55, 55);
        doc.text("How you compare", MARGIN + boxPad, innerY);
        innerY += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        compareLines.forEach((line: string) => {
          doc.text(line, MARGIN + boxPad, innerY);
          innerY += 4.5;
        });
        if (strList.length) {
          innerY += 3;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(0, 110, 70);
          doc.text("Strengths", MARGIN + boxPad, innerY);
          innerY += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          strList.forEach((s) => {
            const lines = doc.splitTextToSize("• " + s, innerW - 2);
            lines.forEach((line: string) => {
              doc.text(line, MARGIN + boxPad, innerY);
              innerY += 4.5;
            });
          });
        }
        if (weakList.length) {
          innerY += 3;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 50, 40);
          doc.text("Critical weaknesses", MARGIN + boxPad, innerY);
          innerY += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          weakList.forEach((s) => {
            const lines = doc.splitTextToSize("• " + s, innerW - 2);
            lines.forEach((line: string) => {
              doc.text(line, MARGIN + boxPad, innerY);
              innerY += 4.5;
            });
          });
        }
        y = innerY + 12;
        doc.setTextColor(0, 0, 0);
      } else {
        // No verdict panel — surface benchmark (+ optional gap) in one section
        y = checkNewPage(doc, y, 36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("How you compare", MARGIN, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const b = analysis.benchmark;
        const compareSummary = `${overallTheme.label} (${b.yourScore}/100) · ${b.percentile}th percentile vs sample · Top candidates avg ${b.topPerformersAvg} · Industry avg ${b.industryAvg}`;
        doc.splitTextToSize(compareSummary, CONTENT_W).forEach((line: string) => {
          y = checkNewPage(doc, y, 6);
          doc.text(line, MARGIN, y);
          y += 4.8;
        });
        if (analysis.gapVsTopCandidates && analysis.gapVsTopCandidates.trim()) {
          y += 3;
          doc.splitTextToSize(analysis.gapVsTopCandidates.trim(), CONTENT_W).forEach((line: string) => {
            y = checkNewPage(doc, y, 6);
            doc.text(line, MARGIN, y);
            y += 4.8;
          });
        }
        y += 8;
      }

      if (analysis.scanTest) {
        y = checkNewPage(doc, y, 36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("6-second scan", MARGIN, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const writeBullets = (label: string, items: string[] | undefined) => {
          doc.setFont("helvetica", "bold");
          doc.text(label, MARGIN, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          const list = (items ?? []).slice(0, 5);
          if (!list.length) {
            doc.text("—", MARGIN + 2, y);
            y += 5;
            return;
          }
          list.forEach((item) => {
            const wrapped = doc.splitTextToSize("• " + item, CONTENT_W - 4);
            wrapped.forEach((line: string) => {
              y = checkNewPage(doc, y, 6);
              doc.text(line, MARGIN + 2, y);
              y += 4.8;
            });
          });
          y += 2;
        };
        writeBullets("What stands out", analysis.scanTest.standsOut);
        writeBullets("What’s confusing", analysis.scanTest.confusing);
        writeBullets("What’s missing", analysis.scanTest.missing);
        y += 4;
      }

      // How you compare: benchmark stats are in the verdict panel above; here combine with gap narrative only.
      if (analysis.gapVsTopCandidates && analysis.gapVsTopCandidates.trim()) {
        y = checkNewPage(doc, y, 28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("How you compare", MARGIN, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.splitTextToSize(analysis.gapVsTopCandidates.trim(), CONTENT_W).forEach((line: string) => {
          y = checkNewPage(doc, y, 6);
          doc.text(line, MARGIN, y);
          y += 4.8;
        });
        y += 8;
      }

      // Scorecard dimensions (High / Medium / Low)
      if (analysis.scorecardDimensions && analysis.scorecardDimensions.length > 0) {
        y = checkNewPage(doc, y, 28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Scorecard dimensions", MARGIN, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const dimLines = analysis.scorecardDimensions.slice(0, 6).map((d) => `• ${d.label}: ${d.rating} — ${d.oneLineExplanation}`);
        dimLines.forEach((line: string) => {
          const wrapped = doc.splitTextToSize(line, CONTENT_W);
          wrapped.forEach((w: string) => {
            doc.text(w, MARGIN, y);
            y += 4.5;
          });
          y += 1;
        });
        y += 2;
      }

      // Top fixes (ranked)
      if (analysis.topFixes && analysis.topFixes.length > 0) {
        y = checkNewPage(doc, y, 40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(40, 90, 180);
        doc.text("Top fixes (ranked)", MARGIN, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        analysis.topFixes.slice(0, 5).forEach((f) => {
          const header = `#${f.rank}. ${f.change}`;
          const why = `Why: ${f.whyItMatters}`;
          const ex = `Example: ${f.exampleRewrite}`;
          const blocks = [header, why, ex];
          blocks.forEach((b) => {
            const wrapped = doc.splitTextToSize(b, CONTENT_W);
            wrapped.forEach((w: string) => {
              y = checkNewPage(doc, y, 8);
              doc.text(w, MARGIN, y);
              y += 4.5;
            });
          });
          y += 4;
        });
      }

      // Positive feedback
      const helpsBullets = analysis.whatHelps?.bullets ?? [];
      const praise: FeedbackItem[] = analysis.feedback.filter((f) => f.type === "praise");
      const helpsToShow = (helpsBullets.length ? helpsBullets : praise.map((f) => f.message)).slice(0, 6);
      if (helpsToShow.length > 0) {
        y = checkNewPage(doc, y, 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 100, 60);
        doc.text("Interview signals (what helps you)", MARGIN, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        helpsToShow.forEach((msg) => {
          y = checkNewPage(doc, y, 18);
          const lines = doc.splitTextToSize("• " + msg, CONTENT_W);
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
      const hurtsForReport = resolveFilterOutRisksDisplay(analysis);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(160, 50, 50);
      doc.text("Filter-out risks (what hurts you)", MARGIN, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (hurtsForReport.length > 0) {
        hurtsForReport.forEach((msg) => {
          const lines = doc.splitTextToSize("• " + msg, CONTENT_W);
          lines.forEach((line: string) => {
            y = checkNewPage(doc, y, 7);
            doc.text(line, MARGIN, y);
            y += 5;
          });
          y += 2;
        });
        y += 2;
      }
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
