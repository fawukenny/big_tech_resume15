import type {
  AnalysisResult,
  FeedbackItem,
  SectionScore,
  ScorecardCriteria,
  BenchmarkData,
  SectionKey,
} from "@/types/resume";
import type { ParsedSection } from "./parseResume";
import { dedupeFeedbackByMessage, dedupeStringsPreserveOrder } from "./dedupeStrings";
import { tryParseOpenAiJsonObject } from "./llmJsonParse";

const SECTION_KEYS: SectionKey[] = ["experience", "education", "skills", "summary", "projects", "other"];
const CATEGORIES = ["impact", "metrics", "keywords", "readability", "structure", "leadership", "specificity"] as const;

function buildSystemPrompt(structuredContent: ParsedSection[]): string {
  const sectionsJson = JSON.stringify(
    structuredContent.map((s, i) => ({ index: i, section: s.section, title: s.title, bodyPreview: s.body.slice(0, 200) + (s.body.length > 200 ? "…" : "") }))
  );
  return `You simulate a **Principal-level hiring manager and bar raiser** at a top-tier technology company (Amazon / Meta / Google caliber: staff+ bar, not entry-level screening). You are NOT a resume reviewer, career coach, ATS tutorial, or polite feedback bot.

**Your job:** Replicate how a real hiring panel allocates scarce interview slots—clear stakes, sharp tradeoffs, and a defendable hire / no-hire judgment based on **substantive signal** in the document.

**Voice & stance**
- Be **direct and blunt**. No courtesy padding, no "great start", no fake enthusiasm.
- State **strong opinions**: what would make you advance this candidate vs. pass, and why—grounded in this resume, not generic job-search advice.
- If something is weak, say **exactly why it fails the bar** (vague ownership, unproven scale, missing proof, credibility gaps)—not "consider adding metrics" in the abstract.

**ABSOLUTE EXCLUSIONS — never output feedback on these (omit entirely; do not mention):**
- Candidate name, contact block, phone, email, address, links, or whether those are "distinct" / "separated" / "clear"
- Header layout, name styling, or "contact information vs body" formatting complaints
- Generic formatting nits unless they **materially obscure accomplishments** (e.g. an unreadable wall of text that hides facts)—even then, tie it to **lost signal**, not aesthetics

**Quality bar for every field**
- **recruiterVerdict.anchorNote:** 2–5 tight sentences: the decisive read—why this person does or does not clear the bar for a competitive role, with specifics. No pep talk.
- **feedback:** Prefer **critical** and **improve** over empty **praise**. Use **praise** only for **genuine** differentiators (scope, impact, proof, trajectory)—not balance or politeness.
- Every feedback **message** must be **specific to this resume** (quote the gap, name the missing proof, or contrast with what a strong L6/L7 packet would show). Ban template lines like "add quantifiable results" without tying them to a concrete bullet or section here.
- **whatHelps / strengths:** Only real signals. If thin, say so implicitly by keeping bullets few and factual—do not invent warmth.

**Suggested rewrites (highest user value)**
- For **every** feedback item with type **improve** or **critical**, you **MUST** include a non-empty **suggestedRewrite** unless the item is purely strategic with **no** replaceable line (rare). When in doubt, still give a concrete bullet or sentence the candidate could paste in.
- For **praise** items, include **suggestedRewrite** at least half the time as an **even stronger** variant (optional bar-raise), or omit if redundant.
- **Minimum:** At least **10** feedback items in the array must have a substantive **suggestedRewrite** (aim for 12–16).
- Each **suggestedRewrite** must be **ready to paste**: one or two tight resume lines (bullets may start with a bullet glyph or hyphen). You may offer **two variants** separated by " | " or a newline if both are strong.
- Tie the rewrite directly to the gap you named—same scope/role, but sharper ownership, scale, metric, or outcome. No generic placeholder text.

Output strict JSON only, no markdown or extra text. Do not wrap the object in markdown code fences (no \`\`\`).

Schema:
{
  "overallScore": number (0-100),
  "sectionScores": [
    { "section": "experience"|"education"|"skills"|"summary"|"projects"|"other", "label": string, "score": number, "max": 100, "feedback": [string] }
  ],
  "criteria": [
    { "key": string, "label": string, "score": number, "max": 100, "weight": number }
  ],

  "feedback": [
    {
      "id": string,
      "type": "praise"|"improve"|"critical",
      "category": "impact"|"metrics"|"keywords"|"readability"|"structure"|"leadership"|"specificity",
      "message": string,
      "snippet": string,
      "suggestedRewrite": string (required for improve/critical in almost all cases — see rules),
      "section": "experience"|"education"|"skills"|"summary"|"projects"|"other"
    }
  ],

  "recruiterVerdict": {
    "verdict": "Low Signal"|"Mixed Signal"|"Strong Signal"|"High Signal",
    "hiringLikelihood": "Low"|"Medium"|"High",
    "decision": "Interview"|"Reject",
    "anchorNote": string,
    "strengths": [string],
    "criticalWeaknesses": [string]
  },
  "scanTest": {
    "standsOut": [string],
    "confusing": [string],
    "missing": [string]
  },
  "whatHelps": { "title": string, "bullets": [string] },
  "whatHurts": { "title": string, "bullets": [string] },
  "topFixes": [
    {
      "rank": number,
      "change": string,
      "whyItMatters": string,
      "exampleRewrite": string,
      "relatedFeedbackIds": [string] (optional)
    }
  ],
  "gapVsTopCandidates": string,
  "scorecardDimensions": [
    {
      "key": "impact"|"ownership"|"technicalDepth"|"execution"|"clarity"|"differentiation",
      "label": string,
      "rating": "High"|"Medium"|"Low",
      "oneLineExplanation": string,
      "weight": number (optional)
    }
  ],
  "reviewSteps": [
    {
      "id": string,
      "title": string,
      "prompt": string,
      "highlightFeedbackIds": [string],
      "relatedSectionTitles": [string] (optional)
    }
  ]
}

Rules:
- sectionScores: MUST have exactly one entry per section in the resume, in the SAME ORDER as the resume (match by index to the sections list below). Use the exact section title from the resume as "label". Score honestly against a **staff+ / senior bar** where applicable—not "fine for an internship."
- criteria: include at least: impact, metrics, keywords, readability, structure, leadership.
- feedback: **12–20 items**. At least **half** should be **critical** or **improve** (combined). **critical** = would materially hurt hire probability or trigger a pass in debrief.
- **topFixes:** every entry must include a concrete **exampleRewrite** (not empty). These complement per-feedback **suggestedRewrite**; avoid duplicating the same sentence verbatim across fields unless necessary.
- feedback ids: MUST be unique stable strings (e.g. \"fb-1\", \"fb-2\"). Every reviewSteps[*].highlightFeedbackIds entry MUST reference one of these feedback ids.
- PLACEMENT via "snippet":
  (1) For feedback about a SPECIFIC SECTION header, set snippet to the EXACT section heading as it appears in the resume (use the "title" from the sections list below).
  (2) For feedback about specific content/bullet text, set snippet to an exact phrase from the resume in that section (under 80 chars).
  (3) For high-level hiring concerns not tied to a phrase, leave snippet as \"\" (empty string)—still make the message concrete (e.g. missing evidence of X given claimed Y).
- If the user provided job description or context, tailor verdict and every section of output to it; explicitly call out **qualification or credibility gaps** that would block an interview at that level.
- whatHurts.bullets: include **4–6** concrete filter-out / rejection-risk points (use **5–6** when decision is Reject with hiringLikelihood Medium or Low). Each bullet must read like an internal hiring note—**specific**, not generic.
- **decision** and **hiringLikelihood** must align with the evidence: do not label "High" likelihood if the resume does not support it.

Resume sections (in order, for reference): ${sectionsJson}`;
}

function buildUserPrompt(rawText: string, context?: string): string {
  const truncated = rawText.slice(0, 14000);
  const preamble = `Evaluate as a bar raiser. Ignore name, contact info, email/phone/address, and header/contact layout entirely—zero commentary on those.

`;
  if (context && context.trim()) {
    return `${preamble}Role / user context (tailor verdict and signal checks to this):\n${context.trim()}\n\nResume text:\n${truncated}`;
  }
  return `${preamble}Resume text:\n${truncated}`;
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
  raw: {
    id?: string;
    type: string;
    category: string;
    message: string;
    snippet: string;
    suggestedRewrite?: string;
    section: string;
  }[],
  structuredContent: ParsedSection[]
): FeedbackItem[] {
  const sectionSet = new Set(SECTION_KEYS);
  const seenIds = new Set<string>();
  return raw.slice(0, 20).map((f, i) => {
    const section = sectionSet.has(f.section as SectionKey) ? (f.section as SectionKey) : "experience";
    const category = CATEGORIES.includes(f.category as (typeof CATEGORIES)[number]) ? f.category : "impact";
    const type = f.type === "praise" || f.type === "improve" || f.type === "critical" ? f.type : "improve";
    let id = typeof f.id === "string" && f.id.trim() ? f.id.trim() : `fb-${i + 1}`;
    if (seenIds.has(id)) id = `${id}-${i + 1}`;
    seenIds.add(id);

    const snippet = (f.snippet || "").trim().slice(0, 120);
    // Do NOT default snippet when empty — empty snippet keeps feedback in "High-level & suggested additions"
    return {
      id,
      type,
      category: category as FeedbackItem["category"],
      message: (f.message || "").slice(0, 500),
      snippet,
      suggestedRewrite: f.suggestedRewrite?.trim() ? f.suggestedRewrite.trim().slice(0, 520) : undefined,
      section,
    };
  });
}

function normalizeRecruiterVerdict(raw: unknown): import("@/types/resume").RecruiterVerdict | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as any;
  const verdict = String(r.verdict || "");
  const hiringLikelihood = String(r.hiringLikelihood || "");
  const decision = String(r.decision || "");
  const allowedVerdicts = new Set(["Low Signal", "Mixed Signal", "Strong Signal", "High Signal"]);
  const allowedLikelihood = new Set(["Low", "Medium", "High"]);
  const allowedDecision = new Set(["Interview", "Reject"]);
  if (!allowedVerdicts.has(verdict) || !allowedLikelihood.has(hiringLikelihood) || !allowedDecision.has(decision)) return undefined;
  return {
    verdict: verdict as any,
    hiringLikelihood: hiringLikelihood as any,
    decision: decision as any,
    anchorNote: String(r.anchorNote || "").slice(0, 2500),
    strengths: Array.isArray(r.strengths) ? r.strengths.slice(0, 6).map((x: any) => String(x).slice(0, 500)) : [],
    criticalWeaknesses: Array.isArray(r.criticalWeaknesses) ? r.criticalWeaknesses.slice(0, 6).map((x: any) => String(x).slice(0, 500)) : [],
  };
}

function normalizeScanTest(raw: unknown): import("@/types/resume").ScanTest | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as any;
  const standsOut = Array.isArray(s.standsOut) ? s.standsOut.slice(0, 5).map((x: any) => String(x).slice(0, 500)) : [];
  const confusing = Array.isArray(s.confusing) ? s.confusing.slice(0, 5).map((x: any) => String(x).slice(0, 500)) : [];
  const missing = Array.isArray(s.missing) ? s.missing.slice(0, 5).map((x: any) => String(x).slice(0, 500)) : [];
  if (!standsOut.length && !confusing.length && !missing.length) return undefined;
  return { standsOut, confusing, missing };
}

function normalizeBulletsBlock(
  raw: unknown,
  maxBullets = 7
): { title: string; bullets: string[] } | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as any;
  const title = String(b.title || "").slice(0, 180);
  const bullets = Array.isArray(b.bullets)
    ? dedupeStringsPreserveOrder(b.bullets.map((x: any) => String(x).slice(0, 600))).slice(0, maxBullets)
    : [];
  if (!title && !bullets.length) return undefined;
  return { title: title || "", bullets };
}

function normalizeTopFixes(raw: unknown): import("@/types/resume").RankedFix[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: import("@/types/resume").RankedFix[] = [];
  raw.slice(0, 8).forEach((x: any, idx: number) => {
    if (!x || typeof x !== "object") return;
    const rank = typeof x.rank === "number" ? x.rank : idx + 1;
    const change = String(x.change || "").slice(0, 250);
    const whyItMatters = String(x.whyItMatters || "").slice(0, 450);
    const exampleRewrite = String(x.exampleRewrite || "").slice(0, 900);
    const relatedFeedbackIds = Array.isArray(x.relatedFeedbackIds) ? x.relatedFeedbackIds.map((y: any) => String(y)).slice(0, 10) : undefined;
    if (!change && !whyItMatters && !exampleRewrite) return;
    out.push({ rank, change, whyItMatters, exampleRewrite, relatedFeedbackIds });
  });
  return out.length ? out : undefined;
}

function normalizeScorecardDimensions(raw: unknown): import("@/types/resume").ScorecardDimension[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const allowedKeys = new Set(["impact", "ownership", "technicalDepth", "execution", "clarity", "differentiation"]);
  const allowedRatings = new Set(["High", "Medium", "Low"]);
  const out: import("@/types/resume").ScorecardDimension[] = [];
  raw.slice(0, 10).forEach((d: any) => {
    const key = String(d?.key || "");
    const rating = String(d?.rating || "");
    if (!allowedKeys.has(key) || !allowedRatings.has(rating)) return;
    out.push({
      key: key as any,
      label: String(d?.label || key).slice(0, 120),
      rating: rating as any,
      oneLineExplanation: String(d?.oneLineExplanation || "").slice(0, 250),
      weight: typeof d?.weight === "number" ? d.weight : undefined,
    });
  });
  return out.length ? out : undefined;
}

function normalizeReviewSteps(raw: unknown, validFeedbackIds: Set<string>): import("@/types/resume").ReviewStep[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: import("@/types/resume").ReviewStep[] = [];
  raw.slice(0, 7).forEach((s: any) => {
    const id = String(s?.id || "").slice(0, 60);
    const title = String(s?.title || "").slice(0, 60);
    const prompt = String(s?.prompt || "").slice(0, 250);
    if (!id || !title || !prompt) return;
    const highlightFeedbackIds = Array.isArray(s?.highlightFeedbackIds)
      ? s.highlightFeedbackIds.map((x: any) => String(x)).filter((x: string) => validFeedbackIds.has(x)).slice(0, 30)
      : [];
    if (!highlightFeedbackIds.length) return;
    out.push({
      id,
      title,
      prompt,
      highlightFeedbackIds,
      relatedSectionTitles: Array.isArray(s?.relatedSectionTitles)
        ? s.relatedSectionTitles.map((x: any) => String(x)).slice(0, 10)
        : undefined,
    });
  });
  return out.length ? out : undefined;
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

function maxTokensForModel(model: string): number {
  const m = model.toLowerCase();
  if (m.includes("gpt-4o") || m.includes("gpt-5") || m.includes("o1") || m.includes("o3")) {
    return 16_384;
  }
  if (m.includes("gpt-4")) return 8192;
  return 7168;
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
  const maxTokens = maxTokensForModel(model);

  async function runOnce(opts: {
    temperature: number;
    messages: { role: "system" | "user"; content: string }[];
  }) {
    return openai.chat.completions.create({
      model,
      messages: opts.messages,
      response_format: { type: "json_object" },
      temperature: opts.temperature,
      frequency_penalty: 0.12,
      presence_penalty: 0,
      max_tokens: maxTokens,
    });
  }

  let res = await runOnce({
    temperature: 0.35,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  let content = res.choices[0]?.message?.content;
  const finishReason = res.choices[0]?.finish_reason ?? null;
  if (!content) throw new Error("Empty response from LLM");

  let parsedObj = tryParseOpenAiJsonObject(content);

  if (!parsedObj && finishReason === "length") {
    console.error("[analyzeResumeWithLLM] JSON parse failed, likely truncated (finish_reason=length)", {
      model,
      contentLength: content.length,
      maxTokens,
    });
  } else if (!parsedObj) {
    console.error("[analyzeResumeWithLLM] JSON parse failed", {
      model,
      finishReason,
      contentLength: content?.length ?? 0,
      head: content?.slice(0, 220).replace(/\n/g, "\\n"),
    });
  }

  if (!parsedObj) {
    res = await runOnce({
      temperature: 0,
      messages: [
        { role: "system", content: `${systemPrompt}\n\nCRITICAL: Reply with one valid JSON object only. No markdown. No text before or after the JSON.` },
        {
          role: "user",
          content: `${userPrompt}\n\nIf your previous attempt failed validation, output a complete, valid JSON object following the schema. Keep strings concise so the full object fits.`,
        },
      ],
    });
    content = res.choices[0]?.message?.content ?? "";
    const retryFinish = res.choices[0]?.finish_reason ?? null;
    parsedObj = tryParseOpenAiJsonObject(content);
    if (!parsedObj) {
      console.error("[analyzeResumeWithLLM] Retry also failed to parse JSON", {
        finishReason: retryFinish,
        contentLength: content.length,
      });
      const hint =
        retryFinish === "length"
          ? " The model hit the output limit—try a shorter resume or less context."
          : "";
      throw new Error(`LLM returned invalid JSON after retry.${hint} Try again.`);
    }
  }

  const parsed = parsedObj as {
    overallScore?: number;
    sectionScores?: unknown[];
    criteria?: unknown[];
    feedback?: unknown[];
    recruiterVerdict?: unknown;
    scanTest?: unknown;
    whatHelps?: unknown;
    whatHurts?: unknown;
    topFixes?: unknown;
    gapVsTopCandidates?: unknown;
    scorecardDimensions?: unknown;
    reviewSteps?: unknown;
  };

  const sectionScores = normalizeSectionScores((parsed.sectionScores as SectionScore[]) || [], structuredContent);
  // Derive overall from section scores so Summary is logically consistent (e.g. overall cannot be "Strong" when most sections are "Needs work")
  const sectionAverage =
    sectionScores.length > 0
      ? sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length
      : Number(parsed.overallScore) ?? 70;
  const overallScore = Math.min(100, Math.max(0, Math.round(sectionAverage)));
  const criteria = normalizeCriteria((parsed.criteria as ScorecardCriteria[]) || []);
  const rawFeedback = Array.isArray(parsed.feedback) ? parsed.feedback : [];
  let feedback = dedupeFeedbackByMessage(normalizeLlmFeedback(rawFeedback as FeedbackItem[], structuredContent), "fb");

  const recruiterVerdict = normalizeRecruiterVerdict(parsed.recruiterVerdict);
  const scanTest = normalizeScanTest(parsed.scanTest);
  let whatHelps = normalizeBulletsBlock(parsed.whatHelps, 7);
  let whatHurts = normalizeBulletsBlock(parsed.whatHurts, 8);

  if (feedback.length === 0) {
    console.warn("[analyzeResumeWithLLM] LLM returned no feedback items; merging rule-based feedback");
    const { analyzeResume } = await import("./analyzeResume");
    const rb = analyzeResume(rawText, structuredContent);
    feedback = dedupeFeedbackByMessage(rb.feedback, "fb");
    if (!whatHelps?.bullets?.length) whatHelps = rb.whatHelps;
    if (!whatHurts?.bullets?.length) whatHurts = rb.whatHurts;
  }

  const validFeedbackIds = new Set(feedback.map((f) => f.id));
  const topFixes = normalizeTopFixes(parsed.topFixes);
  const gapVsTopCandidates =
    typeof parsed.gapVsTopCandidates === "string" ? String(parsed.gapVsTopCandidates).slice(0, 2500) : undefined;
  const scorecardDimensions = normalizeScorecardDimensions(parsed.scorecardDimensions);
  const reviewSteps = normalizeReviewSteps(parsed.reviewSteps, validFeedbackIds);

  const benchmark = computeBenchmark(overallScore);

  return {
    overallScore,
    sectionScores,
    criteria,
    feedback,
    benchmark,
    recruiterVerdict,
    scanTest,
    whatHelps,
    whatHurts,
    topFixes,
    gapVsTopCandidates,
    scorecardDimensions,
    reviewSteps,
    contextUsed: context?.trim() || undefined,
  };
}
