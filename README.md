# The AI Edge

The AI Edge is being redesigned as a public AI command centre: one interface for centrally managed model providers, prompt engineering, evidence-led academic research workflows and AI skills education.

## Current redesign

- Public landing page and command-centre interface.
- Provider availability indicators for OpenAI, Anthropic Claude, Google Gemini and Perplexity.
- Single-provider routing and multi-provider comparison UI.
- Prompt Engineering Studio that builds reusable, structured prompts in the browser.
- Academic Research Laboratory overview covering discovery, reference checking, claim assessment and synthesis.
- Cloudflare Pages Functions keep provider credentials on the server; no API key is sent to browser code.

## Central provider configuration

The command centre supports these Cloudflare Pages environment secrets:

| Secret name | Provider |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI Responses API |
| `ANTHROPIC_API_KEY` | Anthropic Messages API |
| `GEMINI_API_KEY` | Google Gemini API |
| `PERPLEXITY_API_KEY` | Perplexity API |

Add credentials in Cloudflare Pages → Settings → Variables and Secrets. Use encrypted secrets, not public environment variables. The public `/api/providers` endpoint exposes only whether a provider is configured; it never returns secret values.

Provider API usage is billed to The AI Edge's central provider accounts and is separate from consumer subscriptions in cases where the provider treats its API as a separate product. Confirm each provider's current terms, regional availability, model access and billing before enabling it.

Official references:
- OpenAI API authentication: https://developers.openai.com/api/reference/overview
- Anthropic API authentication: https://platform.claude.com/docs/en/manage-claude/authentication
- Gemini API keys: https://ai.google.dev/gemini-api/docs/api-key
- Perplexity API: https://docs.perplexity.ai/

## Important production gate

**Do not add live provider keys and expose the public command endpoint to general traffic until abuse controls are enabled.** The current API validates request size and provider configuration, but a public production launch still needs edge rate limiting, bot protection, spend caps/alerts at each provider, monitoring, and a clear acceptable-use/privacy policy. Without these controls, anonymous visitors could consume centrally billed API credits.

Recommended next steps before opening live AI access:
1. Configure Cloudflare rate limiting for `/api/command` and bot protection (for example, Turnstile with server-side validation).
2. Set strict provider-side monthly budgets and alert thresholds.
3. Add user-facing usage limits and request logging that avoids storing sensitive prompt content.
4. Add a privacy notice explaining which provider receives a prompt and how it is processed.
5. Add scholarly metadata integrations (Crossref, OpenAlex and Semantic Scholar) before claiming reference verification is live.

## Research integrity

The Research Laboratory section is currently a product direction/preview, not a completed scholarly verification engine. It does not yet certify citations, check every claim against primary sources, detect plagiarism, or guarantee academic integrity. Never present AI-generated references as verified. A production implementation should resolve DOI metadata and compare title, author, year and publication details against scholarly indexes, then show evidence and confidence for each check.

## Deployment

- Repository: `Khaya-Al/the-ai-edge.`
- Branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Cloudflare Pages project: `the-ai-edge`
- Production URL: https://the-ai-edge.pages.dev/
- GitHub pushes trigger Cloudflare Pages deployments automatically.

The existing Workers AI binding named `AI` may remain configured, but the redesigned command endpoint uses the provider secrets listed above. Existing account, agent and file APIs are not part of the new homepage experience and should not be represented as part of the new product without a separate review.
