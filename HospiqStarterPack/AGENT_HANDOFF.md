## Agent Handoff Note

### Current Status

HospiqStarterPack has been scaffolded as a standalone Next.js app inside the current workspace. It now has Supabase CLI as a local dev dependency, expanded Starter Pack SaaS/AI migrations, RLS policy migration, onboarding backend route/service/schema, booking lead update support, AI Task 4 scaffold with DB-backed hotel context and model-backed reply composer, LINE webhook foundation, and dashboard/onboarding route shells.

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
- [x] Added schema expansion for LINE session status, AI provider/model chat metadata, handoff events, room inventory, booking lead fields, AI FAQ/RAG fields, AI settings policies, and AI test cases
- [x] Added Starter Pack RLS policy migration with private helper functions
- [x] Added onboarding backend route, validator, service, and FAQ repository
- [x] Added admin booking lead update support for check-in/check-out, lead status, notes, contact channel, and webbooking redirect timestamp
- [x] Added AI Task 4.0 scaffold with context, intent, policy, prompt, RAG retriever, reply composer, evaluation, and orchestrator boundaries
- [x] Added policy resolver tests for booking CTA and handoff behavior
- [x] Added DB-backed AI hotel context loader adapted from the parent AI reference for Starter Pack tables
- [x] Added AI provider abstraction, Gemini provider, grounded reply prompt, and model-backed reply composer
- [x] Added provider/model metadata to AI generation results for future chat history persistence
- [x] Added intent/entity extraction adapted from the parent AI reference
- [x] Added memory merge from extracted booking entities and handoff signal
- [x] Added keyword/language FAQ retrieval as the first RAG layer
- [x] Added semantic RAG extension point with embedding provider and semantic FAQ client interfaces
- [x] Added Gemini embedding support for `text-embedding-004`
- [x] Added AI result evaluator for golden testcase checks
- [x] Added LINE webhook persistence for config lookup, signature verification, sessions, chat history, handoff events, and LINE replies

### Unfinished Work

- [x] Initialized local Supabase config with `npx supabase init`
- [ ] Set up or link the real/new Supabase project when the user is ready
- [ ] Run `npx supabase db reset --local` after Docker is available, or verify migrations against the linked project after Supabase setup
- [ ] Generate real Supabase database types from the new project
- [ ] Run Supabase DB advisors after the migrations are verified
- [ ] Wire semantic FAQ retrieval to a database RPC after the SQL function is added
- [ ] Add persisted `ai_testcases` evaluation runner
- [ ] Implement LINE admin verify code flow
- [ ] Connect booking lead creation/update from extracted AI entities
- [ ] Implement full dashboard/onboarding UI after backend contract is stable

### Files Changed

- `HospiqStarterPack/` - new standalone Starter Pack app and implementation foundation
- `HospiqStarterPack/supabase/migrations/202605250002_expand_starter_pack_ai_saas_schema.sql` - Starter Pack SaaS/AI schema expansion
- `HospiqStarterPack/supabase/migrations/202605250003_add_starter_pack_rls_policies.sql` - hotel-scoped RLS policies
- `HospiqStarterPack/src/app/api/hotel/onboarding/route.ts` - onboarding API route
- `HospiqStarterPack/src/app/api/bookings/[id]/route.ts` - booking lead update API route
- `HospiqStarterPack/src/server/services/onboarding.service.ts` - onboarding use case
- `HospiqStarterPack/src/server/repositories/ai.repository.ts` - AI FAQ persistence
- `HospiqStarterPack/src/lib/ai/` - AI Task 4.0 module scaffold and policy tests
- `CONTEXT.md` - glossary for `rentroom`, `HospiqStarterPack`, Starter Pack, and new Supabase project
- `docs/superpowers/specs/2026-05-25-hospiq-starter-pack-design.md` - design spec
- `docs/superpowers/plans/2026-05-25-hospiq-starter-pack.md` - implementation plan

### Known Issues

- The user has not set up the real/new Supabase project yet. Current Supabase work is only local CLI config plus migration files.
- Docker is not installed or not available in PATH, so local migration execution with `npx supabase db reset --local` is blocked until Docker is available.
- `npm install` reports 2 moderate vulnerabilities from the current dependency tree; no `npm audit fix --force` was run because it may introduce breaking changes.
- AI orchestrator now loads hotel context from Starter Pack Supabase tables, extracts intent/entities, merges memory, retrieves keyword/language FAQs, and calls the configured AI provider at runtime. Semantic RAG interfaces and embedding provider exist, but the database RPC is not wired yet.
- LINE webhook service verifies the stored per-hotel secret, persists sessions/chat history/handoff events, and replies through LINE when a reply is available. Admin verify code is not implemented yet.
- RLS policies are drafted in migration `202605250003`, but they still need to be verified against real Supabase users.

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
npm test -- src/lib/ai
npm run lint
npm run build
supabase --version
npm install -D supabase
npx supabase --version
npx supabase --help
npx supabase db --help
npx supabase init --help
npx supabase init --yes
npx supabase db reset --help
npx supabase db reset --local
docker --version
```

### Commands To Run Next

```bash
# After the user sets up Supabase or Docker:
npx supabase db reset --local
npx supabase db advisors
npm test
npm run lint
npm run build
npm run dev
```

### Important Context

`HospiqStarterPack` is standalone. Do not import from the parent `rentroom` app. `rentroom` is only a reference implementation for Pro Pack ideas. The Starter Pack uses a new Supabase project, new migrations, and all hotel-owned data must remain scoped by `hotel_id`. AI flow and schema decisions should follow `C:\Users\msi0007\rentroom\src\lib\ai\hotel-ai-rag-architecture.md`.

### Next Recommended Step

Continue with LINE admin verify code and booking lead persistence from extracted AI entities, or wire database RPC retrieval for semantic FAQ search.
