# PDFPilot AI

**PDFPilot AI by Shorlah Cloud** — a responsive PDF workspace for document analysis, comparison, and question answering.

## Current milestone

- Responsive green-and-white dashboard and mobile navigation.
- PDF upload/drop-zone with file type and 20 MB size checks.
- Server-side text extraction for PDFs with selectable text.
- Extractive summary, key findings, dates, amounts, percentages, and word count.
- Optional server-side OpenAI integration for AI-assisted summaries, Q&A, and document comparison.
- Keyword-retrieval fallback when no OpenAI key is configured.
- Two-document vocabulary comparison, plus AI-assisted comparison when configured.
- Export of results as JSON.
- Uploaded PDF contents are processed in memory for the request and are not intentionally written to a document library.

## Configure optional AI

Copy `.env.example` to `.env.local` for local development and set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. In a hosted environment, set the same values in the provider's environment-variable settings. **Never commit real API keys or expose them using a `NEXT_PUBLIC_` variable.** AI mode is optional; the app uses its clearly labelled non-AI fallback when no key is configured.

## Important limitations

This is an early functional foundation, **not yet a production AI service**. Text extraction supports PDFs with selectable text; scanned PDFs need OCR, which is not connected. AI requests are limited to an excerpt of extracted text and do not yet provide page-level citations. Authentication, per-user document history/storage, rate limiting, cost controls, downloadable PDF/DOCX reports, and a production security review remain future milestones. Do not upload confidential or sensitive documents until authentication, access controls, and deployment security are complete.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Next milestones

1. Confirm CI build success and fix any issues.
2. Add secure authentication and per-user document storage.
3. Add page-aware citations and OCR support.
4. Improve reports and security, add rate limits and end-to-end tests.

Never put provider API keys in client-side code or commit secrets to this repository.
