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

export type RecruiterSignalVerdict =
  | "Low Signal"
  | "Mixed Signal"
  | "Strong Signal"
  | "High Signal";

export type HiringLikelihood = "Low" | "Medium" | "High";
export type HiringDecision = "Interview" | "Reject";

export type ScoreDimRating = "High" | "Medium" | "Low";

export interface RecruiterVerdict {
  verdict: RecruiterSignalVerdict;
  hiringLikelihood: HiringLikelihood;
  decision: HiringDecision;
  anchorNote: string;
  strengths: string[];
  criticalWeaknesses: string[];
}

export interface ScanTest {
  standsOut: string[];
  confusing: string[];
  missing: string[];
}

export interface RankedFix {
  rank: number;
  change: string;
  whyItMatters: string;
  exampleRewrite: string;
  // Optional mapping so the guided steps can highlight the related resume text.
  relatedFeedbackIds?: string[];
}

export interface ScorecardDimension {
  key:
    | "impact"
    | "ownership"
    | "technicalDepth"
    | "execution"
    | "clarity"
    | "differentiation";
  label: string;
  rating: ScoreDimRating;
  oneLineExplanation: string;
  // Optional: keep weight for future scoring math.
  weight?: number;
}

export interface ReviewStep {
  id: string;
  title: string; // e.g. "First Impression"
  prompt: string; // small instruction shown to the user
  // Feedback items (by id) that should be highlighted for this step.
  highlightFeedbackIds: string[];
  // Optional: ties a step to a particular section/title for better UI copy.
  relatedSectionTitles?: string[];
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
  recruiterVerdict?: RecruiterVerdict;
  scanTest?: ScanTest;
  whatHelps?: { title: string; bullets: string[] };
  whatHurts?: { title: string; bullets: string[] };
  topFixes?: RankedFix[];
  gapVsTopCandidates?: string;
  scorecardDimensions?: ScorecardDimension[];
  reviewSteps?: ReviewStep[];
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
