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

  const ratingFromScore = (n: number): "High" | "Medium" | "Low" =>
    n >= 75 ? "High" : n >= 50 ? "Medium" : "Low";

  const decision: "Interview" | "Reject" =
    overallScore >= 75 ? "Interview" : "Reject";
  const recruiterVerdict = (() => {
    if (overallScore >= 85) {
      return {
        verdict: "High Signal" as const,
        hiringLikelihood: "High" as const,
        decision,
        anchorNote: "Strong enough to compete. Still verify your bullets read like ownership (not tasks) and that metrics are consistent across roles.",
        strengths: [
          "Measurable outcomes / impact signals present",
          "ATS-friendly structure or consistent formatting",
          "Big Tech keywords and ownership language appear at least some of the time",
        ],
        criticalWeaknesses: [
          "Some bullets may still read too broad or responsibility-focused",
          "Metrics may need to be more frequent or more directly tied to business outcomes",
          "Tighten clarity so a recruiter can scan in 6 seconds",
        ],
      };
    }
    if (overallScore >= 75) {
      return {
        verdict: "Strong Signal" as const,
        hiringLikelihood: "High" as const,
        decision,
        anchorNote: "Promising and likely interview-competitive, but you’re not fully optimized for the top 10% bar yet.",
        strengths: [
          "Outcome language and/or leadership signals are present",
          "Some scale/metrics appear (even if not on every bullet)",
          "Sections are mostly legible for ATS scanning",
        ],
        criticalWeaknesses: [
          "You likely miss at least 1-2 critical keyword clusters for the target role",
          "Ownership depth (scope, decision-making, tradeoffs) may be unclear",
          "Several bullets may need tighter impact framing and better metrics",
        ],
      };
    }
    if (overallScore >= 50) {
      return {
        verdict: "Mixed Signal" as const,
        hiringLikelihood: "Medium" as const,
        decision: "Reject" as const,
        anchorNote: "This will often get filtered unless you fix ownership clarity and measurable business impact in the first 1–2 roles.",
        strengths: [
          "Some relevant keywords and ATS-friendly formatting",
          "Potentially credible experience structure",
        ],
        criticalWeaknesses: [
          "Impact/metrics frequency is too low for the Big Tech bar",
          "Too many bullets may sound like duties instead of owned outcomes",
          "Recruiters will struggle to confirm scope and technical depth quickly",
        ],
      };
    }
    return {
      verdict: "Low Signal" as const,
      hiringLikelihood: "Low" as const,
      decision: "Reject" as const,
      anchorNote: "High risk of being screened out. The resume likely lacks enough measurable impact and scope clarity.",
      strengths: [
        "Baseline ATS readability exists",
      ],
      criticalWeaknesses: [
        "Insufficient measurable outcomes (numbers, scale, business impact)",
        "Weak ownership language and unclear scope",
        "Missing or generic keywords for the target level",
      ],
    };
  })();

  const scanTest = (() => {
    const impactC = criteria.find((c) => c.key === "impact")?.score ?? 50;
    const metricsC = criteria.find((c) => c.key === "metrics")?.score ?? 50;
    const keywordsC = criteria.find((c) => c.key === "keywords")?.score ?? 50;
    const leadershipC = criteria.find((c) => c.key === "leadership")?.score ?? 50;
    const readabilityC = criteria.find((c) => c.key === "readability")?.score ?? 50;
    const structureC = criteria.find((c) => c.key === "structure")?.score ?? 50;

    const standsOut: string[] = [];
    if (impactC >= 70) standsOut.push("Impact/outcome language shows up in your experience.");
    if (keywordsC >= 70) standsOut.push("You include enough Big Tech keywords to avoid being totally invisible to ATS.");
    if (leadershipC >= 70) standsOut.push("Leadership/ownership cues appear (led/owned/managed or clear scope).");
    if (!standsOut.length) standsOut.push("At least some sections are structured in a readable way.");

    const confusing: string[] = [];
    if (readabilityC < 65) confusing.push("Scanning is slower than it needs to be (bullets/spacing/wording).");
    if (structureC < 65) confusing.push("Formatting consistency may be weaker than ideal for ATS + recruiters.");

    const missing: string[] = [];
    if (metricsC < 65) missing.push("You need more quantifiable metrics (%, $ , scale, time saved) across bullets.");
    if (keywordsC < 65) missing.push("Add more role-matching keywords (program management + technical program depth).");
    if (leadershipC < 65) missing.push("Clarify scope and ownership (team size, cross-functional leadership, decisions made).");
    if (!missing.length) missing.push("Strengthen differentiation with clearer technical depth and sharper execution details.");

    return { standsOut: standsOut.slice(0, 4), confusing: confusing.slice(0, 3), missing: missing.slice(0, 4) };
  })();

  const praise = feedback.filter((f) => f.type === "praise");
  const hurts = feedback.filter((f) => f.type !== "praise");
  const whatHelps = {
    title: "What helps you get interviews",
    bullets: praise.slice(0, 5).map((f) => f.message),
  };
  const whatHurts = {
    title: "What hurts you get filtered out",
    bullets: hurts.slice(0, 8).map((f) => f.message),
  };

  const topFixes = (() => {
    const candidates = hurts
      .filter((f) => f.suggestedRewrite || f.type === "critical")
      .slice(0, 5)
      .map((f, idx) => ({
        rank: idx + 1,
        change: f.type === "critical" ? "Fix the blocker (ATS/qualification risk)" : "Strengthen the strongest weak area",
        whyItMatters: f.message,
        exampleRewrite:
          f.suggestedRewrite ||
          "Example rewrite: Start with ownership (Led/Owned/Built) + add a metric + end with business impact.",
        relatedFeedbackIds: [f.id],
      }));
    return candidates.length
      ? candidates
      : hurts.slice(0, 5).map((f, idx) => ({
          rank: idx + 1,
          change: "Improve clarity and impact",
          whyItMatters: f.message,
          exampleRewrite: f.suggestedRewrite || "Rewrite with measurable outcomes and ownership language.",
          relatedFeedbackIds: [f.id],
        }));
  })();

  const gapVsTopCandidates = (() => {
    const metricsScore = criteria.find((c) => c.key === "metrics")?.score ?? 50;
    const keywordsScore = criteria.find((c) => c.key === "keywords")?.score ?? 50;
    const leadershipScore = criteria.find((c) => c.key === "leadership")?.score ?? 50;
    if (overallScore >= 75) {
      return "Top candidates will have sharper ownership phrasing (decision-making, tradeoffs), more frequent metrics on every role, and clearer technical depth that matches the target program scope.";
    }
    return `Compared to top candidates, you likely lose at the Big Tech bar because ${metricsScore < 65 ? "metrics are too inconsistent" : "impact is not quantified enough"}, ${
      keywordsScore < 65 ? "keywords don’t align tightly enough with the role" : "keyword coverage feels generic"
    }, and ${leadershipScore < 65 ? "scope/ownership is not explicit" : "execution depth isn't clearly demonstrated"}.`;
  })();

  const fullTextLower = rawText.toLowerCase();
  const techDepthSignals = ["distributed", "microservices", "api", "latency", "throughput", "caching", "system", "scal", "qps", "kpi", "ml"];
  const techDepthCount = techDepthSignals.filter((t) => fullTextLower.includes(t)).length;
  const technicalDepthScore = Math.min(100, 35 + techDepthCount * 12);

  const clarityScore = criteria.find((c) => c.key === "readability")?.score ?? 50;
  const executionScore = (criteria.find((c) => c.key === "structure")?.score ?? 50) * 0.6 + (criteria.find((c) => c.key === "readability")?.score ?? 50) * 0.4;
  const differentiationScore = (criteria.find((c) => c.key === "keywords")?.score ?? 50) * 0.5 + (criteria.find((c) => c.key === "impact")?.score ?? 50) * 0.5;

  const scorecardDimensions = [
    {
      key: "impact" as const,
      label: "Impact",
      rating: ratingFromScore(criteria.find((c) => c.key === "impact")?.score ?? 50),
      oneLineExplanation: "Outcome focus and business impact clarity.",
      weight: 0.2,
    },
    {
      key: "ownership" as const,
      label: "Ownership",
      rating: ratingFromScore(criteria.find((c) => c.key === "leadership")?.score ?? 50),
      oneLineExplanation: "Scope, decision-making, and leadership language.",
      weight: 0.2,
    },
    {
      key: "technicalDepth" as const,
      label: "Technical Depth",
      rating: ratingFromScore(technicalDepthScore),
      oneLineExplanation: "Technical terms and execution depth that recruiters can verify quickly.",
      weight: 0.15,
    },
    {
      key: "execution" as const,
      label: "Execution",
      rating: ratingFromScore(executionScore),
      oneLineExplanation: "Quality of structure, bullet density, and how clearly the work is executed.",
      weight: 0.15,
    },
    {
      key: "clarity" as const,
      label: "Clarity",
      rating: ratingFromScore(clarityScore),
      oneLineExplanation: "ATS + recruiter readability in a 6-second scan.",
      weight: 0.15,
    },
    {
      key: "differentiation" as const,
      label: "Differentiation",
      rating: ratingFromScore(differentiationScore),
      oneLineExplanation: "Role-matching keywords + distinctiveness in your impact framing.",
      weight: 0.15,
    },
  ];

  const selectForSection = (section: SectionKey) => feedback.filter((f) => f.section === section);
  const takeTop = (arr: FeedbackItem[], n: number) => arr.slice(0, n);
  const byCriticalFirst = (arr: FeedbackItem[]) =>
    [...arr].sort((a, b) => (a.type === "critical" ? -1 : 1) - (b.type === "critical" ? -1 : 1));

  const step1 = takeTop(byCriticalFirst(selectForSection("summary").concat(selectForSection("other"))), 3).map((f) => f.id);
  const step2 = takeTop(byCriticalFirst(selectForSection("experience")), 4).map((f) => f.id);
  const step3 = takeTop(
    byCriticalFirst(feedback.filter((f) => ["metrics", "keywords", "leadership"].includes(f.category)).slice()),
    3
  ).map((f) => f.id);
  const step4 = takeTop(byCriticalFirst(feedback.filter((f) => f.type === "critical" || f.category === "metrics" || f.category === "keywords")), 4).map((f) => f.id);
  const step5 = takeTop(byCriticalFirst(hurts), 5).map((f) => f.id);

  const allFeedbackIds = new Set(feedback.map((f) => f.id));
  const reviewSteps = [
    { id: "first-impression", title: "First Impression", prompt: "What a recruiter sees first", highlightFeedbackIds: step1.filter((id) => allFeedbackIds.has(id)) },
    { id: "experience", title: "Experience", prompt: "Ownership + outcomes inside roles", highlightFeedbackIds: step2.filter((id) => allFeedbackIds.has(id)) },
    { id: "depth", title: "Depth", prompt: "Technical depth + program management signals", highlightFeedbackIds: step3.filter((id) => allFeedbackIds.has(id)) },
    { id: "gaps", title: "Gaps", prompt: "What will likely get you filtered out", highlightFeedbackIds: step4.filter((id) => allFeedbackIds.has(id)) },
    { id: "top-fixes", title: "Top Fixes", prompt: "Ranked changes that move the needle fastest", highlightFeedbackIds: step5.filter((id) => allFeedbackIds.has(id)) },
  ].filter((s) => s.highlightFeedbackIds.length > 0);

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
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
    rawText,
    structuredContent: structuredContent.map((s) => ({
      section: s.section,
      title: s.title,
      body: s.body,
    })),
  };
}
