import type { SectionKey } from "@/types/resume";

export interface ParsedSection {
  section: SectionKey;
  title: string;
  body: string;
}

const SECTION_HEADERS: Record<string, SectionKey> = {
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  employment: "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  summary: "summary",
  "professional summary": "summary",
  "executive summary": "summary",
  objective: "summary",
  projects: "projects",
  "key projects": "projects",
  certifications: "other",
  awards: "other",
  other: "other",
};

function normalizeSectionTitle(line: string): SectionKey {
  const lower = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return SECTION_HEADERS[lower] ?? "other";
}

export function structureText(rawText: string): ParsedSection[] {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    const asSection = normalizeSectionTitle(line);
    const isHeader =
      line.length < 50 &&
      (SECTION_HEADERS[line.toLowerCase().replace(/[^a-z\s]/g, "").trim()] != null ||
        /^(experience|education|skills|summary|projects|certifications|awards)/i.test(line));

    if (isHeader && asSection !== "other") {
      if (current) sections.push(current);
      current = { section: asSection, title: line, body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else {
      sections.push({ section: "other", title: "Resume", body: line });
      current = { section: "other", title: "", body: "" };
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    sections.push({ section: "other", title: "Resume", body: rawText });
  }
  return sections;
}
