import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { structureText } from "@/lib/parseResume";
import { analyzeResume } from "@/lib/analyzeResume";
import { analyzeResumeWithLLM } from "@/lib/analyzeResumeWithLLM";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONTEXT_LENGTH = 8000;

async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const contextRaw = formData.get("context") as string | null;
    const context = typeof contextRaw === "string" ? contextRaw.trim().slice(0, MAX_CONTEXT_LENGTH) : undefined;

    const type = file.type.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText: string;

    if (type === "application/pdf") {
      rawText = await parsePdf(buffer);
    } else if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name?.toLowerCase().endsWith(".docx")
    ) {
      rawText = await parseDocx(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported format. Use PDF or DOCX." },
        { status: 400 }
      );
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. Ensure it's not image-only." },
        { status: 400 }
      );
    }

    const structuredContent = structureText(rawText);

    if (process.env.OPENAI_API_KEY) {
      const llmResult = await analyzeResumeWithLLM(rawText, structuredContent, context);
      const analysis = {
        ...llmResult,
        rawText,
        structuredContent: structuredContent.map((s) => ({ section: s.section, title: s.title, body: s.body })),
      };
      return NextResponse.json(analysis);
    }

    const analysis = analyzeResume(rawText, structuredContent);
    return NextResponse.json(analysis);
  } catch (e) {
    console.error("Analyze error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
