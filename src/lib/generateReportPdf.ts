import { getScoreTheme } from "./scoreTheme";
import type { AnalysisResult } from "@/types/resume";

export function getReportPdfBlob(analysis: AnalysisResult): Promise<Blob> {
  return new Promise((resolve) => {
    import("jspdf").then((mod) => {
      const jsPDF = mod.default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(22);
      doc.text("Resume Review Report", 20, y);
      y += 14;

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Big Tech / MAANG Readiness", 20, y);
      y += 20;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      const overallTheme = getScoreTheme(analysis.overallScore);
      doc.text(`Overall: ${overallTheme.label} (${analysis.overallScore}/100)`, 20, y);
      y += 12;

      doc.setFontSize(11);
      doc.text("Summary by section", 20, y);
      y += 8;
      analysis.sectionScores.forEach((s) => {
        const theme = getScoreTheme(s.score);
        const why = s.feedback?.[0] ? ` — ${s.feedback[0]}` : "";
        doc.text(`  ${s.label}: ${theme.label}${why}`, 20, y);
        y += 6;
      });
      y += 8;

      doc.text("Benchmark", 20, y);
      y += 6;
      const benchmarkLine = `  You: ${overallTheme.label} | Top performers avg: ${analysis.benchmark.topPerformersAvg} | Industry avg: ${analysis.benchmark.industryAvg} | Percentile: ${analysis.benchmark.percentile}%`;
      const benchmarkLines = doc.splitTextToSize(benchmarkLine, pageWidth - 40);
      benchmarkLines.forEach((line: string) => {
        doc.text(line, 20, y);
        y += 5;
      });
      y += 8;

      doc.text("Key feedback", 20, y);
      y += 8;
      analysis.feedback.slice(0, 8).forEach((f) => {
        const lines = doc.splitTextToSize("• " + f.message, pageWidth - 40);
        lines.forEach((line: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, 20, y);
          y += 5;
        });
        y += 2;
      });

      resolve(doc.output("blob"));
    });
  });
}
