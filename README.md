# The AI Edge — live AI website prototype

Static-first website with a Cloudflare Pages Functions backend. Ten specialist workspaces call Workers AI through a server-side function.

## Included
- Ten specialist prompts and real AI chat at `POST /api/chat`.
- Health endpoint at `GET /api/health`.
- No OpenAI, Anthropic or Gemini key required. Provider credentials are not exposed in the browser.
- Chat history is temporary in browser memory and is not persisted.

## Zero-cost target and limits
This project targets Cloudflare's free tiers. Workers AI has a limited free daily Neuron allocation; requests can stop when the quota is exhausted. The free tier is not unlimited. The selected model is `@cf/zai-org/glm-4.7-flash`, which Cloudflare lists among models available on the free plan. Confirm model access and current limits in your account before launch. No paid domain, database or external AI API is included.

## Deploy
1. Push this folder to a GitHub repository named `the-ai-edge`.
2. In Cloudflare, create a Pages project and connect the repository.
3. Build command: `npm run build`; output directory: `dist`.
4. In Pages project Settings → Bindings, add a Workers AI binding named exactly `AI`.
5. Redeploy after adding the binding. `wrangler.toml` declares the binding for configuration-as-code.
6. Visit `/api/health`; `aiConfigured` should be `true`. Then open the site, select an agent and send a question.

## Local testing
`npm install` then `npm run dev:pages`. Workers AI inference uses your Cloudflare account during local development too, and consumes the applicable free allocation.

## API request
`POST /api/chat` with JSON `{ "agent":"tutor", "messages":[{"role":"user","content":"Explain photosynthesis simply."}] }`. Agent keys: `tutor`, `research`, `maths`, `engineering`, `programming`, `writing`, `design`, `exam`, `quality`, `career`.

## Current limitations before public launch
No login, database, file uploads or saved cross-device history. No robust per-user rate limiting is included yet; add Turnstile and/or an appropriately configured rate limiter before promoting publicly. Avoid collecting sensitive student information. Model responses are educational assistance, not guaranteed expert advice or verified research. Free quotas can run out; this version does not automatically upgrade to a paid plan.
