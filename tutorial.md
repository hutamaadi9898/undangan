Production Deployment (Cloudflare Workers via OpenNext)

Prereqs
- Cloudflare account with D1, R2, and KV access.
- Wrangler latest installed (`pnpm dlx wrangler --version` to confirm).
- pnpm installed; repo dependencies installed (`pnpm install`).
- Required secrets ready: `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, auth provider keys, email provider key, `R2_PUBLIC_BASE_URL`.

1) Create Cloudflare resources
- D1: `wrangler d1 create wedding-db` → bind name `D1_DB`.
- R2: `wrangler r2 bucket create wedding-uploads` → bind name `R2_BUCKET`.
- KV: `wrangler kv:namespace create "KV_CACHE"` (and preview namespace if desired).
- Update `wrangler.jsonc` bindings for the names above; mirror locals in `.dev.vars`.

2) Run migrations locally then remote
- Ensure Drizzle config exists; generate migration: `pnpm drizzle-kit generate`.
- Apply to local dev D1 if needed: `wrangler d1 migrations apply wedding-db --local`.
- Apply to production: `wrangler d1 migrations apply wedding-db`.

3) Build with OpenNext adapter
- Command: `pnpm deploy` (equiv to `opennextjs-cloudflare build && ... deploy`).
- Build output lands in `.open-next/`; worker entry `.open-next/worker.js`, assets in `.open-next/assets`.

4) Deploy to Workers
- Deploy: `pnpm deploy` (uses `opennextjs-cloudflare deploy` with cache init).
- If you just want an artifact upload without activating, run `pnpm upload`.
- For pre-prod verification: `pnpm preview` to push a preview Worker.

5) Configure environment & secrets
- `wrangler secret put ADMIN_EMAIL` and `wrangler secret put ADMIN_PASSWORD` (and other secrets) in the target env.
- Non-secret vars go in `wrangler.jsonc` `vars` block or per-environment overrides.
- Keep `.dev.vars` for local only; never commit secrets.

6) Validate live
- Hit `/` and a known `/[slug]` route; ensure KV cache warms.
- Run an RSVP submission; verify D1 row created and rate limit logs ok.
- If photo upload enabled, request presigned URL and confirm R2 object writes plus D1 metadata.

7) Observability & rollback
- Observability flag already on in `wrangler.jsonc`; view logs with `wrangler tail`.
- Roll back by redeploying previous build artifact (Wrangler keeps versions) or redeploy prior git SHA with `pnpm deploy`.

Notes
- Keep routes on Node runtime (OpenNext Workers supports Node APIs; avoid `runtime="edge"`).
- KV is eventually consistent: use only for cache/rate limiting, not as source of truth.
- Large uploads must go direct to R2; Workers should only issue presigned URLs and confirm metadata.
