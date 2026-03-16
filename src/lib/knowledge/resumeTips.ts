/**
 * Knowledge base for resume feedback — Big Tech / MAANG best practices.
 *
 * To use your course script: copy text from "Copy of Kehinde F. - Course Script.docx"
 * (or any docx) into the arrays below — e.g. add bullets to IMPACT_TIPS, METRICS_TIPS,
 * or new arrays. The analyzer uses these for actionable messages and suggested rewrites.
 */

export const IMPACT_TIPS = [
  "Start bullets with strong action verbs: Led, Shipped, Scaled, Drove, Reduced, Increased, Architected.",
  "Every bullet should answer: What did you do? What was the impact? Use numbers (%, $, users, time).",
  "Proof of traction: Show growth, revenue, or scale in every role. e.g. 'Grew user base to 70k+; $170K MRR'.",
  "Avoid vague phrases like 'helped with' or 'assisted'. Own the outcome: 'Led', 'Built', 'Delivered'.",
];

export const METRICS_TIPS = [
  "Add at least one quantifiable metric per bullet: percentages, dollar impact, scale (users, QPS), or time saved.",
  "Use comparisons: 'reduced latency by 40%', 'increased conversion 2x', 'scaled to 10M DAU'.",
  "Revenue and business impact stand out: '$2M saved', 'drove 15% revenue lift', 'reduced churn by 20%'.",
];

export const KEYWORD_TIPS = [
  "Big Tech keywords that resonate: scaled, shipped, led, architected, optimized, cross-functional, stakeholder, A/B test, OKR.",
  "Include scope: 'Led 5-engineer team', 'Partnered with PM and design', 'Owned end-to-end'.",
  "Tech terms: latency, throughput, distributed systems, real-time, ML/AI, API, microservices (if relevant).",
];

export const STRUCTURE_TIPS = [
  "Aim for 4–6 bullets per role; 1–2 lines each. Keep line length under ~120 characters for readability.",
  "Put the strongest, most metric-heavy bullets first in each section.",
  "Use consistent formatting: bullets (• or -), same date format, clear section headers (Experience, Education, Projects).",
];

export const ANTI_PATTERNS = [
  { pattern: /responsible for|duties include/i, message: "Replace with an outcome: what you delivered, not what you were assigned.", category: "specificity" as const },
  { pattern: /helped with|assisted with|worked on/i, message: "Use ownership language: 'Led', 'Built', 'Owned' — and add the result.", category: "specificity" as const },
  { pattern: /team player|hard worker|passionate/i, message: "Show, don't tell. Replace with a concrete achievement that demonstrates this.", category: "specificity" as const },
  { pattern: /various|several|many/i, message: "Use a number. e.g. '3 teams', '5 projects', '40% improvement'.", category: "metrics" as const },
];

export const PRAISE_PATTERNS = [
  { pattern: /\d+%|\d+x|\$[\d,]+|[\d,]+\s*(users|M|K|DAU|MRR)/i, message: "Proof of traction. Show this kind of stat in every role.", category: "impact" as const },
  { pattern: /led|managed|owned|drove|architected/i, message: "Strong ownership language. Recruiters look for this.", category: "leadership" as const },
  { pattern: /cross-functional|stakeholder|partnered with/i, message: "Good scope signal — shows you work across teams.", category: "leadership" as const },
];
