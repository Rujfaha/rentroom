## Agent Handoff Note

### Current Status

HospiqStarterPack has been scaffolded as a standalone Next.js app inside the current workspace. It has the first Starter Pack database migration, Supabase client helpers, backend auth/service/repository layers, core API contracts, an initial AI orchestrator shell, LINE webhook foundation, and dashboard/onboarding route shells.

### Completed Work

- [x] Scaffolded standalone Next.js app in `HospiqStarterPack`
- [x] Added local app rules in `HospiqStarterPack/AGENTS.md`
- [x] Added Supabase server/admin/browser clients
- [x] Added API response/error helpers
- [x] Added Starter Pack database migration and seed
- [x] Added auth role and hotel access guards
- [x] Added hotel, roomtype, and booking validators/repositories/services
- [x] Added core API route contracts
- [x] Added AI response guard and orchestrator shell
- [x] Added LINE signature verification, client shell, and webhook route
- [x] Added frontend route shells and API client contract

### Unfinished Work

- [ ] Run `supabase db reset` after Supabase CLI is installed or project tooling is linked
- [ ] Generate real Supabase database types from the new project
- [ ] Implement full RLS policies for super admin and hotel admin access
- [ ] Implement onboarding service and route logic
- [ ] Implement AI context loader from Starter Pack tables
- [ ] Expand AI prompt builder and model provider integration
- [ ] Implement LINE config lookup, signature verification with per-hotel secret, session persistence, chat history, admin verify code, and reply calls
- [ ] Implement full dashboard/onboarding UI after backend contract is stable

### Files Changed

- `HospiqStarterPack/` - new standalone Starter Pack app and implementation foundation
- `CONTEXT.md` - glossary for `rentroom`, `HospiqStarterPack`, Starter Pack, and new Supabase project
- `docs/superpowers/specs/2026-05-25-hospiq-starter-pack-design.md` - design spec
- `docs/superpowers/plans/2026-05-25-hospiq-starter-pack.md` - implementation plan

### Known Issues

- Supabase CLI is not available in PATH, so migration SQL has not been executed with `supabase db reset`.
- `npm install` reports 2 moderate vulnerabilities from the current dependency tree; no `npm audit fix --force` was run because it may introduce breaking changes.
- AI orchestrator is intentionally a safe shell and does not yet call a model or load real hotel context.
- LINE webhook service currently parses payload and preserves the `[hotelId]` contract but does not yet verify against a stored per-hotel secret.
- RLS is enabled in the migration, but detailed policies are intentionally unfinished until auth behavior is finalized.

### Commands Already Run

```bash
npx create-next-app@latest HospiqStarterPack --yes --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
npx create-next-app@latest hospiq-starter-pack-temp --yes --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
npm install @supabase/ssr @supabase/supabase-js zod
npm install -D vitest
npm install --package-lock-only
npm install
npm test -- src/server/http/__tests__/api-response.test.ts
npm test -- src/server/auth/__tests__/require-role.test.ts
npm test -- src/server/validators/__tests__/roomtype.schema.test.ts
npm test -- src/lib/ai/__tests__/response-guard.test.ts
npm test -- src/lib/line/__tests__/signature.test.ts
npm test
npm run lint
npm run build
supabase --version
```

### Commands To Run Next

```bash
supabase db reset
npm test
npm run lint
npm run build
npm run dev
```

### Important Context

`HospiqStarterPack` is standalone. Do not import from the parent `rentroom` app. `rentroom` is only a reference implementation for Pro Pack ideas. The Starter Pack uses a new Supabase project, new migrations, and all hotel-owned data must remain scoped by `hotel_id`.

### Next Recommended Step

Install or expose the Supabase CLI, run the migration against a local/new Supabase project, then implement RLS policies and the onboarding backend flow before expanding the AI/LINE internals.
