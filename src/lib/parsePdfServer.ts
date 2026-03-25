import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

/**
 * Resolve the PDF.js worker file for Node/serverless. In production, Next.js file tracing
 * may omit files that are only loaded via dynamic import; `next.config` includes these paths.
 * `public/pdf.worker.min.mjs` is copied in postinstall and is a reliable fallback when present.
 */
function resolvePdfWorkerPath(): string {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "public", "pdf.worker.min.mjs"),
    path.join(cwd, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs"),
    path.join(cwd, "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs"),
  ];
  const found = candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  return found ?? candidates[1];
}

/**
 * Extract plain text from a PDF buffer using pdf.js (same family as the client viewer).
 * Avoids the `pdf-parse` package, which ships an old pdf.js build that triggers
 * Node's deprecated `Buffer()` constructor at runtime.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const { getDocument, GlobalWorkerOptions } = pdfjs;

  GlobalWorkerOptions.workerSrc = pathToFileURL(resolvePdfWorkerPath()).href;

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  try {
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const line = textContent.items
        .map((item) => ("str" in item ? String((item as { str: string }).str) : ""))
        .join("");
      pageTexts.push(line);
    }
    return pageTexts.join("\n\n");
  } finally {
    await pdf.destroy();
  }
}
