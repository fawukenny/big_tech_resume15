import type {
  AnalysisResult,
  FeedbackItem,
  SectionScore,
  ScorecardCriteria,
  BenchmarkData,
  SectionKey,
} from "@/types/resume";
import type { ParsedSection } from "./parseResume";

const SECTION_KEYS: SectionKey[] = ["experience", "education", "skills", "summary", "projects", "other"];
const CATEGORIES = ["impact", "metrics", "keywords", "readability", "structure", "leadership", "specificity"] as const;

function buildSystemPrompt(structuredContent: ParsedSection[]): string {
  const sectionsJson = JSON.stringify(
    structuredContent.map((s, i) => ({ index: i, section: s.section, title: s.title, bodyPreview: s.body.slice(0, 200) + (s.body.length > 200 ? "…" : "") }))
  );
  return `You are an expert resume coach for Big Tech / MAANG roles and ATS. You analyze resumes and produce structured feedback.

Output strict JSON only, no markdown or extra text. Schema:

{
  "overallScore": number (0-100),
  "sectionScores": [ { "section": "experience"|"education"|"skills"|"summary"|"projects"|"other", "label": string, "score": number, "max": 100, "feedback": [string] } ],
  "criteria": [ { "key": string, "label": string, "score": number, "max": 100, "weight": number } ],
  "feedback": [ { "type": "praise"|"improve"|"critical", "category": "impact"|"metrics"|"keywords"|"readability"|"structure"|"leadership"|"specificity", "message": string, "snippet": string, "suggestedRewrite": string (optional), "section": "experience"|"education"|"skills"|"summary"|"projects"|"other" } ]
}

Rules:
- sectionScores: MUST have exactly one entry per section in the resume, in the SAME ORDER as the resume (match by index to the sections list below). Use the exact section title from the resume as "label" (e.g. "Professional Experience", "Technical Skills", "Education"). "feedback" is an array of 1-2 short, high-level summary sentences for that section (why it's Strong / On Track / Off Track). Score: 75+ = Strong, 50-74 = On Track, <50 = Off Track.
- criteria: include at least: impact, metrics, keywords, readability, structure, leadership. Each with score 0-100 and weight (e.g. 25, 20, 15, 15, 15, 10).
- feedback: 8-25 items. Include a strong proportion of "critical" type for: (1) gaps that would hurt ATS or Big Tech screening (e.g. missing keywords, no metrics, vague language, wrong length, missing sections); (2) when the user provided a job description, major gaps that would make the candidate unqualified or screened out (missing must-haves, mismatched level, missing skills). Use "praise" for strong points, "improve" for suggestions, "critical" for gaps and serious issues. Give actionable messages and optional suggestedRewrite.
- PLACEMENT via "snippet": (1) For feedback about a SPECIFIC SECTION (e.g. shorten the profile summary, ensure Education is clearly labeled, add certifications section), set "snippet" to the EXACT section heading as it appears in the resume — use the "title" from the sections list below (e.g. "Profile Summary", "Education and Certifications"). This places the feedback "On your resume" with that section header highlighted. (2) For feedback about SPECIFIC CONTENT or a bullet (e.g. "Highlight leadership here", "Add more metrics to this role"), set "snippet" to an EXACT phrase from the resume in that section (under 80 chars) so we can highlight that text. (3) For GENERAL praise or high-level advice that does not refer to a specific section or phrase (e.g. "Demonstrates strong impact overall", "Effectively uses metrics across the resume"), leave "snippet" EMPTY so it appears under "High-level & suggested additions".
- If the user provided context (job description or focus), tailor all feedback and scores to it. Call out qualification gaps and how to fix them.

Resume sections (in order, for reference): ${sectionsJson}`;
}

function buildUserPrompt(rawText: string, context?: string): string {
  const truncated = rawText.slice(0, 14000);
  if (context && context.trim()) {
    return `User context (tailor feedback to this):\n${context.trim()}\n\nResume text:\n${truncated}`;
  }
  return `Resume text:\n${truncated}`;
}

function computeBenchmark(overallScore: number): BenchmarkData {
  const topPerformersAvg = 86;
  const industryAvg = 62;
  const percentile = Math.min(99, Math.max(1, Math.round((overallScore / 100) * 94)));
  return {
    yourScore: overallScore,
    topPerformersAvg,
    industryAvg,
    percentile,
  };
}

function normalizeLlmFeedback(
  raw: { type: string; category: string; message: string; snippet: string; suggestedRewrite?: string; section: string }[],
  structuredContent: ParsedSection[]
): FeedbackItem[] {
  const sectionSet = new Set(SECTION_KEYS);
  return raw.slice(0, 30).map((f, i) => {
    const section = sectionSet.has(f.section as SectionKey) ? (f.section as SectionKey) : "experience";
    const category = CATEGORIES.includes(f.category as (typeof CATEGORIES)[number]) ? f.category : "impact";
    const type = f.type === "praise" || f.type === "improve" || f.type === "critical" ? f.type : "improve";
    const snippet = (f.snippet || "").trim().slice(0, 120);
    // Do NOT default snippet when empty — empty snippet keeps feedback in "High-level & suggested additions"
    return {
      id: `f-${i + 1}`,
      type,
      category: category as FeedbackItem["category"],
      message: (f.message || "").slice(0, 500),
      snippet,
      suggestedRewrite: f.suggestedRewrite?.slice(0, 300),
      section,
    };
  });
}

function normalizeSectionScores(
  raw: { section: string; label: string; score: number; max: number; feedback?: string[] }[],
  structuredContent: ParsedSection[]
): SectionScore[] {
  const sectionSet = new Set(SECTION_KEYS);
  const labels: Record<SectionKey, string> = {
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    summary: "Summary",
    projects: "Projects",
    other: "Other",
  };
  const result: SectionScore[] = [];
  for (let i = 0; i < structuredContent.length; i++) {
    const block = structuredContent[i];
    const rawItem = Array.isArray(raw) && raw[i] ? raw[i] : null;
    result.push({
      section: block.section,
      label: (rawItem?.label && rawItem.label.trim()) || block.title || labels[block.section],
      score: rawItem != null ? Math.min(100, Math.max(0, Number(rawItem.score) || 70)) : 70,
      max: 100,
      feedback: rawItem && Array.isArray(rawItem.feedback) ? rawItem.feedback : rawItem?.feedback ? [String(rawItem.feedback)] : [],
    });
  }
  if (result.length === 0) {
    for (const block of structuredContent) {
      result.push({
        section: block.section,
        label: block.title || labels[block.section],
        score: 70,
        max: 100,
        feedback: [],
      });
    }
  }
  return result;
}

function normalizeCriteria(raw: { key: string; label: string; score: number; max: number; weight?: number }[]): ScorecardCriteria[] {
  const defaultCriteria = [
    { key: "impact", label: "Impact & Outcome-Focus", score: 70, max: 100, weight: 25 },
    { key: "metrics", label: "Metrics", score: 70, max: 100, weight: 20 },
    { key: "keywords", label: "Keywords", score: 70, max: 100, weight: 15 },
    { key: "readability", label: "Readability & ATS", score: 70, max: 100, weight: 15 },
    { key: "structure", label: "Structure", score: 70, max: 100, weight: 15 },
    { key: "leadership", label: "Leadership & Scope", score: 70, max: 100, weight: 10 },
  ];
  if (!Array.isArray(raw) || raw.length === 0) return defaultCriteria;
  return raw.slice(0, 10).map((c) => ({
    key: c.key || "impact",
    label: c.label || c.key,
    score: Math.min(100, Math.max(0, Number(c.score) ?? 70)),
    max: 100,
    weight: Math.min(25, Math.max(5, Number(c.weight) ?? 15)),
  }));
}

export async function analyzeResumeWithLLM(
  rawText: string,
  structuredContent: ParsedSection[],
  context?: string
): Promise<Omit<AnalysisResult, "rawText" | "structuredContent">> {
  const OpenAI = (await import("openai")).default;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it in .env.local to use LLM-powered feedback.");
  }

  const openai = new OpenAI({ apiKey });
  const systemPrompt = buildSystemPrompt(structuredContent);
  const userPrompt = buildUserPrompt(rawText, context);

  const model = process.env.OPENAI_ANALYZE_MODEL || "gpt-4o-mini";
  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 4096,
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from LLM");

  let parsed: {
    overallScore?: number;
    sectionScores?: unknown[];
    criteria?: unknown[];
    feedback?: unknown[];
  };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  const overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore) ?? 70));
  const sectionScores = normalizeSectionScores((parsed.sectionScores as SectionScore[]) || [], structuredContent);
  const criteria = normalizeCriteria((parsed.criteria as ScorecardCriteria[]) || []);
  const feedback = normalizeLlmFeedback((parsed.feedback as FeedbackItem[]) || [], structuredContent);
  const benchmark = computeBenchmark(overallScore);

  return {
    overallScore,
    sectionScores,
    criteria,
    feedback,
    benchmark,
    contextUsed: context?.trim() || undefined,
  };
}
