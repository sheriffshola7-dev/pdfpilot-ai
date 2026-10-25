# PDFPilot AI

**PDFPilot AI by Shorlah Cloud** — a responsive PDF workspace for document analysis, comparison, and question answering.

## Current milestone: PDF processing foundation

- Responsive green-and-white dashboard and mobile navigation.
- PDF upload/drop-zone with file type and 20 MB size checks.
- Server-side text extraction for PDFs with selectable text.
- First-pass extractive summaries, key findings, dates, amounts, and word counts.
- Two-document vocabulary comparison with an explicit limitation notice.
- Keyword-based Q&A that retrieves matching passages from the uploaded PDF.
- Export of the current result as JSON.
- PDF contents are processed for the request and are not intentionally written to a document library.

## Important limitations

This is an early functional foundation, **not yet a production AI service**. Summaries are extractive heuristics, comparison is vocabulary-based (not semantic/legal comparison), and Q&A uses keyword retrieval rather than a connected language model. Scanned PDFs need OCR, which is not connected. Authentication, per-user document history/storage, page-level citations, rate limiting, and a production security review remain future milestones. Do not upload confidential or sensitive documents until authentication, access controls, and deployment security are complete.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Next milestones

1. Verify the production build and fix any CI issues.
2. Add secure authentication and per-user storage.
3. Add page-aware citations, OCR support, and a server-side language-model integration.
4. Improve comparison into section/value-level diffs and downloadable PDF/DOCX reports.
5. Add rate limits, file-processing safeguards, privacy controls, and end-to-end tests.

Never put provider API keys in client-side code or commit secrets to this repository.
