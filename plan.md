Plan — Wedding Invitation Platform (Phase 0 = MVP)

- [x] Meta: create plan + review OpenNext Cloudflare docs via Context7 (2025-11-24)
- [x] Meta: confirm TypeScript `strict` is enabled in `tsconfig.json`

## Phase 0 — MVP (public invites + admin base)
- [ ] Tooling & platform
  - [x] Lock package manager (pnpm) and scripts for dev/build/deploy
  - [x] Finalize `wrangler.jsonc` bindings scaffold (D1_DB, R2_BUCKET, KV_CACHE, ASSETS)
  - [x] Add `drizzle.config` + `drizzle-kit` scripts
- [ ] Data model & migrations
  - [x] Define Drizzle schema for weddings, pages, rsvps, photos, themes (typed enums, indexes)
  - [x] Generate initial migration files under `/migrations`
  - [ ] Create D1 database + apply migrations in dev
- [ ] Libraries & utilities
  - [x] `lib/db/client.ts` with Drizzle D1 driver + cached singleton
  - [x] `lib/kv.ts` helper for cache/rate-limit wrappers
  - [x] `lib/r2.ts` presign helpers with content-type/size guards
  - [x] `lib/auth.ts` using Better Auth + `better-auth-cloudflare` (D1 adapter, singleton pattern)
  - [ ] Shared Zod schemas for user input (RSVP, pages, photo metadata)
- [ ] Admin surface (`/admin`)
  - [x] Route protection + layout shell
  - [x] Better Auth API route `/api/auth/[...all]` wired via `toNextJsHandler` (App Router)
  - [x] Session helper for Server Components / server actions (admin-only)
  - [x] Wedding CRUD: create/edit basics, publish/unpublish toggle
  - [ ] Theme picker (3–5 starter themes seeded from `/public-themes`)
  - [ ] Section editor (hero/story/schedule/map) with form-driven content_json writes
  - [ ] Live preview toggle `?preview=1` rendering PPR draft
- [ ] Public invitation surface (`/[slug]`)
  - [x] Fetch published wedding with KV cache → D1 fallback
  - [x] Render theme + ordered sections; avoid `runtime="edge"`
  - [ ] SEO meta (title, description, og image placeholder)
  - [x] 404 for missing or unpublished slugs
- [ ] RSVP
  - [x] Client form with honeypot + basic spam copy
  - [x] Server Action/route handler writes to D1
  - [x] KV rate limit per IP+slug
  - [ ] Admin RSVP list + CSV export
- [ ] QA & hardening
  - [ ] Smoke test via `wrangler dev`
  - [x] Lint/typecheck CI step
  - [ ] Minimal unit tests for schema validators and RSVP action

## Phase 1 — Guest photo upload + moderation
- [ ] Public upload flow
  - [ ] Request presigned R2 PUT URL (type/size validated)
  - [ ] Direct browser upload to R2 (no Worker proxy)
  - [ ] Confirm upload route saves metadata to D1
  - [ ] Public gallery renders approved photos only
- [ ] Admin moderation
  - [ ] Pending/approved/rejected queues
  - [ ] Approve/reject/update caption; delete removes R2 object + D1 row
  - [ ] Basic abuse protections (file type allowlist, size cap)

## Phase 2 — Editor & templates
- [ ] Theme system v2 with config schema + per-section variants
- [ ] Drag-drop section reorder + duplicate wedding as template
- [ ] Per-theme asset uploads to R2 (backgrounds/icons)
- [ ] Automatic OG image generation pipeline (optional)

## Phase 3 — Scaling & revenue
- [ ] Multi-wedding dashboard search/filter
- [ ] Paid tiers (limits: photo count, custom domains, watermark removal)
- [ ] Custom domain support per wedding
- [ ] Backup/export wedding JSON + audit log for admin actions
- [ ] Email automations (RSVP reminders, thank-you)
