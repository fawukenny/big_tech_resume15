# Big Tech Resume Review

A modern web app that analyzes resumes for MAANG/Big Tech readiness with AI-powered, section-by-section feedback — inspired by [Cracked Resume](https://crackedresume.com) with a cleaner UX and deeper insights.

## Features

- **Resume upload** — PDF or DOCX, no login required
- **Inline feedback** — Highlights and tooltips on your resume text with praise, improvements, and rewrites
- **Scorecard** — Overall score (0–100) plus breakdown by section and criteria:
  - Impact & outcome focus
  - Metrics (scope, scale, complexity)
  - MAANG/Big Tech keywords
  - Readability & ATS compatibility
  - Structure, length & formatting
  - Leadership & scope signals
- **Rewritten suggestions** — Example bullets for weak areas
- **Benchmark** — Compare to top performers and industry average
- **Downloadable PDF report** — Email + terms required for marketing
- **CTA** — Link to free YouTube course and full course

## Tech stack

- **Next.js 14** (App Router), **TypeScript**, **Tailwind CSS**
- **Parsing**: `pdf-parse` (PDF), `mammoth` (DOCX)
- **Report**: `jspdf` (client-side PDF)

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a resume (PDF or DOCX) to get your score and feedback.

## Project structure

- `src/app/` — Pages (home, results) and API routes (`/api/analyze`, `/api/report`)
- `src/components/` — UploadZone, Scorecard, ResumeWithFeedback, Benchmark, ReportGate, CTABlock
- `src/lib/` — `parseResume`, `analyzeResume`, `generateReportPdf`
- `src/types/` — Resume and analysis types

## Customization

- **AI feedback**: The analyzer in `src/lib/analyzeResume.ts` is rule-based. You can replace or augment it with an LLM (e.g. OpenAI) by calling your API from `src/app/api/analyze/route.ts` and mapping the response to the same `AnalysisResult` shape.
- **Email/Terms**: Report delivery and marketing consent are validated in `src/app/api/report/route.ts`. Plug in your email provider or CRM for real “send report to email” and list signup.
- **CTA / YouTube**: Update links in `src/components/CTABlock.tsx` and footer. Default YouTube playlist: [Free course](https://www.youtube.com/playlist?list=PLIJQNP_KafiJ6z9mHH74TMCogoiWU3lhz).

## License

MIT
