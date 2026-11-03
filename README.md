# The AI Edge

The AI Edge is a multi-page learning platform powered by Cloudflare Pages Functions and Workers AI.

## Current platform features
- Ten specialist AI agents.
- Email/password sign-up and sign-in with PBKDF2 password hashing and secure, HTTP-only session cookies.
- Private conversations saved per account, with conversation history, rename and delete.
- Private file uploads stored in Cloudflare R2.
- Browser-side text extraction for PDF, DOCX, TXT and Markdown documents; extracted text can be discussed with the AI.
- Image files can be stored with a conversation, but the current text-only AI model cannot interpret image pixels yet.
- Health endpoint reports which Cloudflare services are connected.

## Required Cloudflare resources

The site uses the existing Workers AI binding named `AI`, plus two resources that must be created and connected before account and upload features work:

1. **D1 database** — create a database, then open its Console and execute the SQL in `migrations/0001_initial.sql`.
2. **R2 bucket** — create a private bucket for user uploads (for example `the-ai-edge-uploads`).

Bind both to the Pages project:
- Pages project → Settings → Bindings → Add → D1 database. Variable name: `DB`. Select the database.
- Pages project → Settings → Bindings → Add → R2 bucket. Variable name: `FILES`. Select the bucket.
- Keep the existing Workers AI binding variable name exactly `AI`.
- Save and trigger a new deployment after adding bindings.

Do not make the R2 bucket public. User files are retrieved only through authenticated Pages Functions.

## Deployment
- Repository: `Khaya-Al/the-ai-edge.`
- Build command: `npm run build`
- Build output: `dist`
- Branch: `main`
- GitHub pushes trigger Cloudflare Pages deployments automatically.

After the D1 migration and bindings are configured, visit `/api/health`. The expected readiness fields are:
```json
{
  "ok": true,
  "aiConfigured": true,
  "databaseConfigured": true,
  "fileStorageConfigured": true,
  "ready": true
}
```

## Account and security notes
- Passwords are never stored in plain text. Passwords are hashed with PBKDF2-SHA-256 and a unique salt.
- Sessions use random opaque tokens stored as SHA-256 hashes in D1 and are issued in Secure, HttpOnly, SameSite=Lax cookies.
- Conversations and files are scoped to the authenticated user.
- Registration currently does not require email verification. Password-reset emails, email verification, stronger automated abuse controls/rate limiting and account deletion workflows still need to be added before a broad public launch.
- Keep student data minimal. Do not upload confidential, sensitive or third-party personal information without permission.

## Document handling
- Supported uploads: PDF, DOCX, TXT, Markdown, PNG, JPG and WebP; maximum 8 MB each.
- PDF/DOCX/TXT/Markdown text is extracted in the browser and saved with the private file record to support follow-up questions.
- Image uploads are saved and attached to conversations but are not yet visually analysed by the current model.
- Scanned PDFs may have no selectable text; OCR is not yet enabled.

## AI
The current model is `@cf/zai-org/glm-4.7-flash` through Workers AI. Answers are educational assistance, not guaranteed expert advice or verified research. The free Workers AI allocation is limited and can be exhausted.
