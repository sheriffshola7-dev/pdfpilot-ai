# PDFPilot AI

**PDFPilot AI by Shorlah Cloud** — a responsive PDF workspace for document analysis, comparison, and question answering.

## Current milestone

- Responsive green-and-white dashboard and mobile navigation.
- PDF upload/drop-zone with file type and 20 MB size checks.
- Server-side text extraction for PDFs with selectable text.
- Extractive summary, key findings, dates, amounts, percentages, and word count.
- Optional server-side OpenAI integration for AI-assisted summaries, Q&A, and document comparison.
- Keyword-retrieval fallback when no OpenAI key is configured, with common stop words filtered from matching.
- Two-document comparison using distinct content-word overlap (not a semantic similarity score), plus AI-assisted comparison when configured.
- Export of results as JSON and Markdown reports.
- Light/dark mode toggle with the choice saved on the current device.
- Local browser-based processing history, activity list, and saved insights (result metadata only; not cloud-synced).
- Uploaded PDF contents are processed in memory for the request and are not intentionally written to a document library.
- Server-side limits: 20 MB per PDF, 120,000 extracted characters per file, and 1,500 characters per question. Truncated documents show a warning.

## Configure optional AI

Copy `.env.example` to `.env.local` for local development and set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. In a hosted environment, set the same values in the provider's environment-variable settings. **Never commit real API keys or expose them using a `NEXT_PUBLIC_` variable.** AI mode is optional; the app uses its clearly labelled non-AI fallback when no key is configured.

## Important limitations

This is an early functional foundation, **not yet a production AI service**. Text extraction supports PDFs with selectable text; scanned PDFs need OCR, which is not connected. AI requests are limited to an excerpt of extracted text and do not yet provide page-level citations. Authentication, cloud-synced per-user document storage/history, OCR, page-level citations, rate limiting, cost controls, downloadable PDF/DOCX reports, and a production security review remain future milestones. Local history is device/browser-specific and can be cleared by the user through browser storage; do not treat it as a secure cloud document library. Do not upload confidential or sensitive documents until authentication, access controls, and deployment security are complete.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Next milestones

1. Confirm CI build success and fix any issues; test the workflows with real selectable-text PDFs.
2. Add secure authentication and per-user cloud document storage with row-level access policies.
3. Add page-aware citations and OCR support for scanned PDFs.
4. Add production-grade rate limits, usage/cost controls, and end-to-end tests.
5. Expand report formats and complete a production security review.

Never put provider API keys in client-side code or commit secrets to this repository.
