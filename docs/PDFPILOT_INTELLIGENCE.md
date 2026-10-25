# PDFPilot Intelligence — Hybrid AI setup

PDFPilot's existing PDF processing endpoint now supports OpenAI-compatible chat-completions providers. The current Analyze PDF, Chat with PDF, and Compare documents tools use this shared server-side adapter.

## Configure a provider

Add these variables in your hosting provider (Netlify: Project configuration → Environment variables), with Functions/Server runtime scope where available:

- `AI_BASE_URL`: provider API base URL, without a trailing slash. For OpenAI, use `https://api.openai.com/v1`. Other compatible providers publish their own base URL.
- `AI_API_KEY`: secret API key from the selected provider.
- `AI_MODEL`: exact model identifier supported by that provider.

The adapter sends requests to `{AI_BASE_URL}/chat/completions`. Provider must implement the OpenAI-compatible chat-completions request/response shape. If `AI_BASE_URL` is empty, it defaults to OpenAI's endpoint.

Legacy configuration remains supported: if `AI_API_KEY` is not set, the app falls back to `OPENAI_API_KEY`; if `AI_MODEL` is not set, it falls back to `OPENAI_MODEL` and then `gpt-4o-mini`.

## Security and costs

- Never prefix AI secrets with `NEXT_PUBLIC_`; never commit real keys to GitHub.
- AI provider use may incur charges or have free-tier quotas/rate limits. Check the provider's current terms before using it.
- Environment variables are applied at runtime/build according to the host's rules; trigger a new deploy after changing them.
- Provider switching is configuration-only when both providers support the same API shape. This is not a locally hosted model; self-hosting is a later optional adapter.
- Documents are sent to the configured AI provider when AI features are used. Review that provider's data handling terms before processing sensitive documents.

## Current behavior

If no AI key is configured, the app continues to provide its existing extractive/keyword fallback for PDF analysis and chat. The response marks whether AI was enabled so the UI can distinguish AI-assisted output from fallback output. AI responses are not guaranteed correct; verify important conclusions against the source PDF.
