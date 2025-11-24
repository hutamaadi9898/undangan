AGENTS — Working Rules for This Repo

- Stack: Next.js 15 App Router + TypeScript strict, deploying with `@opennextjs/cloudflare` to Workers (Node runtime only; no `runtime="edge"` for Node APIs).
- Package manager: pnpm; run `pnpm install` and keep lockfile. Scripts: `pnpm dev`, `pnpm build`, `pnpm deploy|upload|preview`.
- Cloudflare bindings: `D1_DB` (SQLite via Drizzle), `R2_BUCKET` (uploads), `KV_CACHE` (cache/rate-limit), `ASSETS` (OpenNext static). Keep bindings mirrored in `wrangler.jsonc` and `.dev.vars`.
- Data layer: use Drizzle D1 driver; schema lives in `src/lib/db/schema.ts`, migrations in `/migrations`. Keep enums typed; favor non-null columns where possible; run `drizzle-kit` for migration generation.
- Validation: use Zod for all external input (RSVP, photo metadata, pages). Reject oversize uploads; whitelist MIME types.
- R2 uploads: always presign and upload directly from client. Never stream files through the Worker. Store `r2_key` + size/content-type in D1 after confirm.
- KV usage: cache-only for public read models and rate limiting. Never store source of truth in KV; invalidate on publish/edit.
- Auth: Use Better Auth with `better-auth-cloudflare` (D1 adapter). Expose `/app/api/auth/[...all]/route.ts` via `toNextJsHandler(auth)` (Node runtime). Provide a singleton `auth` export and a static config for CLI schema generation if needed. Protect `/admin` pages and server actions; never trust client role flags.
- Caching & rendering: prefer PPR/SSG for public pages; avoid blocking SSR where possible. Use `revalidate` wisely; align with KV cache strategy.
- Error handling: return typed error objects; log only non-PII. Add concise inline comments when logic is non-obvious.
- Testing: minimum — lint, typecheck, smoke `wrangler dev`. Add targeted unit tests for validators and critical server actions.
- Tooling tips: use `rg` for search; keep files ASCII; avoid destructive git commands; no `git reset --hard`.
