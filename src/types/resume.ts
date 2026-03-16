export type SectionKey =
  | "experience"
  | "education"
  | "skills"
  | "summary"
  | "projects"
  | "other";

export interface SectionScore {
  section: SectionKey;
  label: string;
  score: number;
  max: number;
  feedback: string[];
}

export interface FeedbackItem {
  id: string;
  type: "praise" | "improve" | "critical";
  category:
    | "impact"
    | "metrics"
    | "keywords"
    | "readability"
    | "structure"
    | "leadership"
    | "specificity";
  message: string;
  snippet: string;
  suggestedRewrite?: string;
  section: SectionKey;
}

export interface ScorecardCriteria {
  key: string;
  label: string;
  score: number;
  max: number;
  weight: number;
}

export interface BenchmarkData {
  yourScore: number;
  topPerformersAvg: number;
  industryAvg: number;
  percentile: number;
}

export interface AnalysisResult {
  overallScore: number;
  sectionScores: SectionScore[];
  criteria: ScorecardCriteria[];
  feedback: FeedbackItem[];
  benchmark: BenchmarkData;
  rawText: string;
  structuredContent: { section: SectionKey; title: string; body: string }[];
  /** When set, feedback was tailored to this user-provided context (e.g. job description or focus). */
  contextUsed?: string;
}

export interface ParsedResume {
  rawText: string;
  html?: string;
  structuredContent: { section: SectionKey; title: string; body: string }[];
}
