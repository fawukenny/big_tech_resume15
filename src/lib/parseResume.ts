import type { SectionKey } from "@/types/resume";

export interface ParsedSection {
  section: SectionKey;
  title: string;
  body: string;
}

/**
 * PDF / DOC extractors often return run-on text with few newlines. Insert breaks so
 * `structureText` can infer sections and bullets follow CV flow.
 */
export function preprocessResumeRawText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!t) return t;

  // Bullet glyphs glued to previous text
  t = t.replace(/([^\n])([•●▪·])/g, "$1\n$2");
  // Numbered bullets with space before (avoid years like 2020.)
  t = t.replace(/([^\n\d])(\d{1,2}\.\s+[A-Za-z])/g, "$1\n$2");

  // ALL-CAPS / known section headers stuck to prior character
  t = t.replace(
    /([a-z0-9%)\\]])\s*((?:PROFESSIONAL |WORK )?EXPERIENCE|EDUCATION|EMPLOYMENT|(?:TECHNICAL )?SKILLS|PROJECTS|(?:PROFESSIONAL )?SUMMARY|OBJECTIVE|CERTIFICATIONS?|AWARDS|VOLUNTEER(?:ING)?|LANGUAGES|PUBLICATIONS|LEADERSHIP|ACTIVITIES|INTERESTS|REFERENCES)\b/gi,
    "$1\n$2"
  );

  // Glued ALL-CAPS phrases (no space before header), e.g. "...MBPROFESSIONAL SUMMARY"
  t = t.replace(
    /([a-zA-Z0-9)])(PROFESSIONAL SUMMARY|WORK EXPERIENCE|TECHNICAL SKILLS|KEY SKILLS|CORE SKILLS)\b/gi,
    "$1\n\n$2"
  );

  // Glued ALL-CAPS words that look like section titles (e.g. "...internVOLUNTEER")
  t = t.replace(
    /([a-z])([A-Z][A-Z\s&/.]{3,42})(?=\s+[A-Za-z•\-0-9]|\s{2,}|$)/g,
    (m, lower: string, header: string) => {
      const h = header.trim();
      if (
        /EDUCATION|EXPERIENCE|SKILLS|PROJECTS|SUMMARY|VOLUNTEER|LANGUAGE|CERTIFICATION|AWARD|EMPLOYMENT|OBJECTIVE|PUBLICATION|LEADERSHIP|REFERENCE/i.test(
          h
        )
      ) {
        return `${lower}\n${h}`;
      }
      return m;
    }
  );

  // Sparse newlines + long text: treat wide gaps as column breaks (common in PDF text order)
  const lineCount = t.split("\n").length;
  if (lineCount < 6 && t.length > 500) {
    t = t.replace(/ {3,}/g, "\n");
  }

  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/** Light-touch breaks inside a section body (keeps API section boundaries; improves PDF paste readability). */
export function preprocessResumeBody(body: string): string {
  let t = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Common Title Case section labels glued to prior text (PDF extraction)
  t = t.replace(
    /([a-z0-9%)\]])\s*\b(Education|Experience|Projects?|Skills|Summary|Professional Summary|Volunteering|Certifications?|Awards?|Technical Skills|Work Experience|Professional Experience|Leadership|Publications?|References?|Other Experience|Academic Projects)\b/gi,
    "$1\n\n$2"
  );

  // Collapse duplicate bullet glyphs from PDFs (e.g. "• ● Skill")
  t = t.replace(/([•●▪·])\s*\1+/g, "$1 ");
  t = t.replace(/(?:[•●▪·]\s*){2,}/g, "• ");

  t = t.replace(/([^\n])([•●▪·])/g, "$1\n$2");
  t = t.replace(/([^\n\d])(\d{1,2}\.\s+[A-Za-z])/g, "$1\n$2");

  // Dash bullets run into prose: "role - Led ..." → newline before dash
  t = t.replace(/([a-z.,;])\s+([\-–—])\s+([A-Z(])/g, "$1\n$2 $3");

  const lines = t.split("\n").length;
  if (lines < 4 && t.length > 180) {
    t = t.replace(/ {3,}/g, "\n");
  }
  return t.replace(/\n{3,}/g, "\n\n").trim();
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
  languages: "skills",
  volunteer: "other",
  volunteering: "other",
  certifications: "other",
  awards: "other",
  other: "other",
};

function normalizeSectionTitle(line: string): SectionKey {
  const lower = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return SECTION_HEADERS[lower] ?? "other";
}

export function structureText(rawText: string): ParsedSection[] {
  const normalized = preprocessResumeRawText(rawText);
  const lines = normalized.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (const line of lines) {
    const asSection = normalizeSectionTitle(line);
    const isHeader =
      line.length < 50 &&
      (SECTION_HEADERS[line.toLowerCase().replace(/[^a-z\s]/g, "").trim()] != null ||
        /^(experience|education|skills|summary|projects|certifications|awards|languages|volunteer|employment|publications|leadership)/i.test(line));

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
