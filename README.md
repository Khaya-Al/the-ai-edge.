# The AI Edge — Login-first AI gateway

The public site now opens at a sign-in / registration page. After authentication, users choose which AI tools they already use and enter a multi-page workspace.

## Product experience

- **Login / registration:** email and password account flow, backed by Cloudflare Pages Functions and D1.
- **Tool selection:** ChatGPT, Claude, Gemini, Perplexity and The AI Edge.
- **AI command centre:** the Workers AI task router recommends a next tool. The built-in assistant can answer when The AI Edge is the selected route.
- **Provider handoff:** for third-party tools, the workspace prepares a task-specific prompt, copies it and opens the provider's official website in a new tab. The user signs in directly with that provider and pastes the prompt.
- **Prompt Engineering Studio:** builds structured prompts and hands them to a selected provider.
- **Academic Research Lab:** builds literature-search prompts and links to scholarly discovery services.
- **Academy:** separate learning page.
- **Responsive layout:** workspace navigation adapts to mobile screens; separate pages open from the workspace navigation.

## Important provider account boundary

The AI Edge does not ask users for their ChatGPT, Claude, Gemini or Perplexity passwords, read browser cookies, reuse consumer subscription sessions, or pretend that selecting a tool connects its account. Consumer account sign-in is not the same as third-party API access. Where a provider does not offer an approved consumer-account connection for this use, the supported experience is a prepared prompt plus a link to the official provider site. Users sign in and continue there themselves.

This means the platform does **not** send a request into the user's consumer AI account in the background. The Edge can recommend a provider and prepare the task for handoff. Its own built-in assistant uses the already configured Cloudflare Workers AI binding named `AI`; it does not require the site owner to enter separate OpenAI/Anthropic/Gemini/Perplexity API keys.

## Required account setup before sign-in works

The repository already contains the account authentication functions and the initial D1 schema at `migrations/0001_initial.sql`. The Cloudflare Pages project must have a D1 database binding named exactly `DB`, and the initial migration must be applied to that database. The existing `wrangler.toml` cannot contain a database_id until the Cloudflare D1 database is created.

1. In Cloudflare Dashboard, open Workers & Pages → D1 SQL Database and create a database (for example, `the-ai-edge-db`).
2. Open the database's Console and execute the contents of `migrations/0001_initial.sql`.
3. Open Workers & Pages → Pages → `the-ai-edge` → Settings → Functions → D1 database bindings.
4. Add a binding with variable name `DB` and select the database you created.
5. Redeploy the latest GitHub deployment.

Until these steps are completed, the login and registration endpoints intentionally return a setup-required error. Do not share database credentials or passwords in chat.

## User preferences and device support

Selected provider preferences are currently saved in browser local storage. The interface is responsive across mobile, tablet and desktop, but provider selections are not yet synchronised between devices. Cross-device preference sync requires a user-preferences table and authenticated settings endpoint in D1.

## Build / deployment

- Repository: `Khaya-Al/the-ai-edge.`
- Branch: `main`
- Build command: `npm run build`
- Build output: `dist`
- Pages project: `the-ai-edge`
- Live URL: https://the-ai-edge.pages.dev/
- GitHub pushes trigger Cloudflare Pages deployments.

## Research integrity

The Research Lab currently creates search prompts and links to external scholarly discovery tools. It does not yet automatically verify DOI metadata, certify references, check every claim against full-text sources, or detect plagiarism. Verify every reference against the publisher or scholarly index.
