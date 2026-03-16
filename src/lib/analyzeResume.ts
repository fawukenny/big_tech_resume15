import type {
  AnalysisResult,
  FeedbackItem,
  SectionScore,
  ScorecardCriteria,
  BenchmarkData,
  SectionKey,
} from "@/types/resume";
import type { ParsedSection } from "./parseResume";
import { ANTI_PATTERNS, PRAISE_PATTERNS, IMPACT_TIPS, METRICS_TIPS, KEYWORD_TIPS, STRUCTURE_TIPS } from "./knowledge/resumeTips";

const KEYWORDS = [
  "scaled",
  "shipped",
  "led",
  "reduced",
  "increased",
  "drove",
  "architected",
  "optimized",
  "latency",
  "throughput",
  "revenue",
  "impact",
  "cross-functional",
  "stakeholder",
  "metrics",
  "A/B test",
  "OKR",
  "roadmap",
];

function scoreImpact(text: string): number {
  const hasNumbers = /\d+%|\d+x|\$[\d,]+|[\d,]+\s*(users|M|K|mm|Million)/i.test(text);
  const hasOutcome = /increased|reduced|improved|drove|delivered|saved|revenue|efficiency/i.test(text);
  if (hasNumbers && hasOutcome) return 90;
  if (hasOutcome) return 65;
  if (hasNumbers) return 55;
  return 40;
}

function scoreKeywords(text: string): number {
  const lower = text.toLowerCase();
  const count = KEYWORDS.filter((k) => lower.includes(k.toLowerCase())).length;
  return Math.min(100, 40 + count * 12);
}

function scoreReadability(text: string): number {
  const bulletCount = (text.match(/^[\s•\-*]\s/gm) || []).length;
  const avgLength = text.split(/\n/).filter(Boolean).reduce((a, l) => a + l.length, 0) / (text.split(/\n/).filter(Boolean).length || 1);
  if (bulletCount >= 3 && avgLength < 120) return 85;
  if (bulletCount >= 2) return 70;
  return 55;
}

function scoreStructure(sections: ParsedSection[]): number {
  const hasExperience = sections.some((s) => s.section === "experience");
  const hasEducation = sections.some((s) => s.section === "education");
  const sectionCount = new Set(sections.map((s) => s.section)).size;
  if (hasExperience && hasEducation && sectionCount >= 3) return 85;
  if (hasExperience) return 70;
  return 50;
}

function scoreLeadership(text: string): number {
  const lower = text.toLowerCase();
  const signals = ["led", "managed", "mentored", "team of", "cross-functional", "stakeholder", "drove", "owned"];
  const count = signals.filter((s) => lower.includes(s)).length;
  return Math.min(100, 45 + count * 15);
}

function findSectionForLine(line: string, sections: ParsedSection[]): SectionKey {
  for (const s of sections) {
    if (s.body.includes(line.trim().slice(0, 50))) return s.section;
  }
  return "experience";
}

function generateFeedback(sections: ParsedSection[], fullText: string): FeedbackItem[] {
  const feedback: FeedbackItem[] = [];
  let id = 0;
  const add = (item: Omit<FeedbackItem, "id">) => feedback.push({ ...item, id: `f-${++id}` });

  const lines = fullText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const experienceSection = sections.find((s) => s.section === "experience");
  const expText = experienceSection?.body ?? fullText;
  const bullets = lines.filter((l) => /^[\s•\-*]\s/.test(l) || /^\d+\./.test(l));

  // ——— Anti-patterns: one feedback per matching line (actionable) ———
  for (const { pattern, message, category } of ANTI_PATTERNS) {
    for (const line of lines) {
      if (line.length < 10) continue;
      const match = line.match(pattern);
      if (match) {
        const snippet = line.slice(0, 100);
        const section = findSectionForLine(line, sections);
        add({
          type: category === "specificity" ? "critical" : "improve",
          category,
          message,
          snippet,
          suggestedRewrite: IMPACT_TIPS[0] || "Start with an action verb and add a quantifiable result.",
          section,
        });
      }
    }
  }

  // ——— Praise: highlight strong lines so user keeps doing it ———
  for (const { pattern, message, category } of PRAISE_PATTERNS) {
    for (const line of lines) {
      if (line.length < 15) continue;
      if (pattern.test(line)) {
        const section = findSectionForLine(line, sections);
        add({
          type: "praise",
          category,
          message,
          snippet: line.slice(0, 100),
          section,
        });
      }
    }
  }

  // ——— Experience: missing metrics (per bullet without numbers) ———
  if (!/\d+%|\d+x|\$|users|M|K|million|revenue|savings|efficiency|DAU|MRR/i.test(expText)) {
    const firstBullet = bullets.find((b) => experienceSection?.body?.includes(b.slice(0, 30)));
    add({
      type: "improve",
      category: "metrics",
      message: METRICS_TIPS[0] ?? "Add at least one quantifiable metric per bullet.",
      snippet: firstBullet?.slice(0, 80) || expText.slice(0, 80),
      suggestedRewrite: "Led migration of payment pipeline, reducing latency by 40% and enabling $2M+ in daily transaction throughput.",
      section: "experience",
    });
  } else {
    // Find bullets that have no numbers and suggest adding metrics
    for (const line of bullets) {
      if (line.length < 20) continue;
      if (!/\d+%|\d+x|\$|\d+[\s,]*(users|M|K|million|DAU|MRR)/i.test(line) && experienceSection?.body?.includes(line.slice(0, 40))) {
        add({
          type: "improve",
          category: "metrics",
          message: "This bullet has no numbers. Add scale, %, or $ impact to stand out.",
          snippet: line.slice(0, 80),
          suggestedRewrite: METRICS_TIPS[1] ?? "Use comparisons: 'reduced latency by 40%', 'scaled to 10M DAU'.",
          section: "experience",
        });
      }
    }
  }

  // ——— Experience: missing leadership/scope ———
  if (!/led|managed|team of|cross-functional|stakeholder|owned|partnered/i.test(expText)) {
    add({
      type: "improve",
      category: "leadership",
      message: KEYWORD_TIPS[1] ?? "Include scope: 'Led 5-engineer team', 'Partnered with PM and design'.",
      snippet: bullets[0]?.slice(0, 80) || expText.slice(0, 80),
      suggestedRewrite: "Led 5-engineer team to ship real-time analytics; partnered with PM and design across 3 orgs.",
      section: "experience",
    });
  }

  // ——— Keywords: low Big Tech language ———
  const keywordCount = KEYWORDS.filter((k) => fullText.toLowerCase().includes(k.toLowerCase())).length;
  if (keywordCount < 3) {
    add({
      type: "improve",
      category: "keywords",
      message: KEYWORD_TIPS[0] ?? "Use Big Tech keywords: scaled, shipped, led, architected, cross-functional.",
      snippet: expText.slice(0, 100),
      suggestedRewrite: "Scaled recommendation service to 10M+ DAU; reduced p99 latency by 35% via caching strategy.",
      section: "experience",
    });
  }

  // ——— Structure: length and bullet count ———
  if (fullText.length < 400) {
    add({
      type: "improve",
      category: "structure",
      message: STRUCTURE_TIPS[0] ?? "Aim for 4–6 bullets per role; 1–2 pages total.",
      snippet: "",
      section: "other",
    });
  }
  const bulletCount = bullets.length;
  if (experienceSection && bulletCount > 0 && bulletCount < 3) {
    add({
      type: "improve",
      category: "structure",
      message: "Add more bullets per role (4–6) to show depth. Put strongest, metric-heavy bullets first.",
      snippet: experienceSection.body.slice(0, 60),
      section: "experience",
    });
  }

  // ——— Education: brief check ———
  const educationSection = sections.find((s) => s.section === "education");
  if (educationSection?.body && !/\b(GPA|grade|honor|dean|summa|magna|cum laude)\b/i.test(educationSection.body)) {
    add({
      type: "improve",
      category: "structure",
      message: "If your GPA is strong (e.g. 3.5+), consider adding it. Otherwise omit.",
      snippet: educationSection.body.slice(0, 60),
      section: "education",
    });
  }

  // ——— Projects: often lack impact ———
  const projectsSection = sections.find((s) => s.section === "projects");
  if (projectsSection?.body && !/\d+%|\d+x|\$|\d+\s*users/i.test(projectsSection.body)) {
    add({
      type: "improve",
      category: "impact",
      message: "Projects section: add metrics (users, traffic, % improvement) to show impact.",
      snippet: projectsSection.body.slice(0, 80),
      suggestedRewrite: "Built X; used by 500+ users / improved Y by 40%.",
      section: "projects",
    });
  }

  // Dedupe by (message, snippet) to avoid identical items from multiple lines
  const seen = new Set<string>();
  return feedback.filter((f) => {
    const key = `${f.message}|${f.snippet.slice(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function computeSectionScores(sections: ParsedSection[], fullText: string): SectionScore[] {
  const labels: Record<SectionKey, string> = {
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    summary: "Summary",
    projects: "Projects",
    other: "Other",
  };
  return sections.map((s) => {
    const text = s.body || fullText.slice(0, 500);
    const impact = scoreImpact(text);
    const keywords = scoreKeywords(text);
    const readability = scoreReadability(text);
    const leadership = s.section === "experience" ? scoreLeadership(text) : 70;
    const score = Math.round((impact * 0.35 + keywords * 0.25 + readability * 0.2 + leadership * 0.2));
    const clamped = Math.min(100, Math.max(0, score));
    const reasons: string[] = [];
    if (s.section === "experience") {
      if (impact >= 75) reasons.push("Good outcome focus and metrics.");
      else if (impact < 50) reasons.push("Add more quantifiable impact (%, $, scale).");
      if (keywords < 50) reasons.push("Use stronger Big Tech keywords (scaled, led, shipped).");
      if (leadership < 50) reasons.push("Add scope (team size, cross-functional work).");
    }
    if (readability >= 75) reasons.push("Clear structure and bullets.");
    else if (readability < 50 && text.length > 100) reasons.push("Shorten bullets; aim for 1–2 lines each.");
    return {
      section: s.section,
      label: labels[s.section] || s.title,
      score: clamped,
      max: 100,
      feedback: reasons.length ? reasons : [clamped >= 75 ? "Solid section." : "Room to strengthen with metrics and action verbs."],
    };
  });
}

function computeCriteria(fullText: string, sections: ParsedSection[]): ScorecardCriteria[] {
  return [
    { key: "impact", label: "Impact & Outcome-Focus", score: scoreImpact(fullText), max: 100, weight: 25 },
    {
      key: "metrics",
      label: "Metrics (scope, scale, complexity)",
      score: fullText.match(/\d+%|\d+x|\$|users|M|K|million/i) ? 78 : 45,
      max: 100,
      weight: 20,
    },
    { key: "keywords", label: "MAANG/Big Tech Keywords", score: scoreKeywords(fullText), max: 100, weight: 15 },
    { key: "readability", label: "Readability & ATS", score: scoreReadability(fullText), max: 100, weight: 15 },
    { key: "structure", label: "Structure, Length & Format", score: scoreStructure(sections), max: 100, weight: 15 },
    { key: "leadership", label: "Leadership & Scope", score: scoreLeadership(fullText), max: 100, weight: 10 },
  ];
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

export function analyzeResume(
  rawText: string,
  structuredContent: ParsedSection[]
): AnalysisResult {
  const criteria = computeCriteria(rawText, structuredContent);
  const overallScore = Math.round(
    criteria.reduce((sum, c) => sum + (c.score / c.max) * c.weight, 0)
  );
  const sectionScores = computeSectionScores(structuredContent, rawText);
  const feedback = generateFeedback(structuredContent, rawText);
  const benchmark = computeBenchmark(overallScore);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    sectionScores,
    criteria,
    feedback,
    benchmark,
    rawText,
    structuredContent: structuredContent.map((s) => ({
      section: s.section,
      title: s.title,
      body: s.body,
    })),
  };
}
