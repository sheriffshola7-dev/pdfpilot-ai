# PDFPilot AI

**PDFPilot AI by Shorlah Cloud** — an advanced PDF workspace for document analysis, comparison, and question answering.

## Current milestone

The first UI foundation includes:
- Responsive dashboard with green-and-white visual system
- Navigation between overview, PDF analysis, document comparison, chat, documents, and settings
- PDF selection/drop-zone interface with basic client-side PDF filtering
- Search across sample recent-document cards
- Mobile navigation and responsive layouts

## Important status

This milestone is a **UI prototype**, not a production AI application. The dashboard's sample recent documents are illustrative, and upload currently selects files in the browser only. No files are uploaded or stored, no AI analysis is performed, and authentication/history/billing are not yet connected. Those features require secure backend integration and tests.

## Run locally

Requirements: Node.js 20.9+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Next milestones

1. Add secure authentication and per-user storage.
2. Implement PDF text extraction and page-aware indexing.
3. Connect server-side AI summarization, detailed analysis, and grounded document Q&A.
4. Implement multi-document comparison and exportable reports.
5. Add security, file limits, privacy controls, tests, and production build validation.

Never put provider API keys in client-side code or commit secrets to this repository.