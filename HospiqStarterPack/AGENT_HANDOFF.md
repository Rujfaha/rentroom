## Agent Handoff Note

### Current Status

HospiqStarterPack has been scaffolded as a standalone Next.js app inside the current workspace. It now has Supabase CLI as a local dev dependency, expanded Starter Pack SaaS/AI migrations, RLS policy migration, onboarding backend route/service/schema, booking lead update support, DB-grounded AI orchestration, model-based intent/entity routing, model-backed reply composition, semantic-first hybrid RAG hooks, FAQ embedding generation on create, authenticated FAQ GET/POST API, authenticated AI test-reply API, persisted AI testcase evaluation support, LINE webhook persistence, admin verify flow, booking lead creation from AI entities, and dashboard/onboarding route shells.

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
- [x] Added Gemini embedding support for `gemini-embedding-001` with 768 output dimensions
- [x] Added AI result evaluator for golden testcase checks
- [x] Added LINE webhook persistence for config lookup, signature verification, sessions, chat history, handoff events, and LINE replies
- [x] Added LINE admin verify code flow
- [x] Added booking lead create/update from extracted AI entities
- [x] Added semantic FAQ search RPC migration and Supabase-backed semantic client
- [x] Added persisted `ai_testcases` evaluation runner
- [x] Added FAQ embedding generation during FAQ creation
- [x] Added authenticated `GET/POST /api/ai/faqs` so FAQ creation goes through the embedding pipeline
- [x] Added authenticated `POST /api/ai/test-reply` for hand-testing AI replies from real DB context before LINE testing
- [x] Changed FAQ retrieval to semantic-first hybrid ranking with keyword/local fallback
- [x] Seeded remote Supabase hand-test hotel data with rooms, AI settings, and 5 FAQ embeddings
- [x] Verified semantic RPC returns the parking FAQ for a Thai parking query
- [x] Verified full AI reply flow answers from seeded DB context using `scripts/handtest-ai-reply.ts`
- [x] Added local mock LINE webhook script and verified incoming/outgoing chat history persistence with provider/model metadata
- [x] Exported multi-question local webhook hand-test results for user feedback
- [x] Added persona, hospitality, and sales assistance implementation plan for the next session
- [x] Implemented Persona + Hospitality + Sales Assistance v1
- [x] Exported after-results for persona/sales local webhook tests
- [x] Applied all Supabase migrations to the linked remote project
- [x] Verified remote migration history includes `20260525165159`
- [x] Verified remote `match_ai_faqs` RPC exists
- [x] Verified current app with `npm test`, `npm run lint`, and `npm run build`

### Unfinished Work

- [x] Initialized local Supabase config with `npx supabase init`
- [x] Set up or link the real/new Supabase project when the user is ready
- [ ] Run `npx supabase db reset --local` after Docker is available, or verify migrations against the linked project after Supabase setup
- [ ] Generate real Supabase database types from the new project
- [ ] Run Supabase DB advisors after the migrations are verified
- [x] Apply the semantic FAQ RPC migration to the real Supabase project
- [ ] Add FAQ embedding generation on FAQ update when the update API/UI exists
- [ ] Add dashboard/admin UI surfaces for saved LINE sessions, handoffs, booking leads, and AI test results
- [ ] Implement full dashboard/onboarding UI after backend contract is stable

### Files Changed

- `HospiqStarterPack/` - new standalone Starter Pack app and implementation foundation
- `HospiqStarterPack/supabase/migrations/202605250002_expand_starter_pack_ai_saas_schema.sql` - Starter Pack SaaS/AI schema expansion
- `HospiqStarterPack/supabase/migrations/202605250003_add_starter_pack_rls_policies.sql` - hotel-scoped RLS policies
- `HospiqStarterPack/src/app/api/hotel/onboarding/route.ts` - onboarding API route
- `HospiqStarterPack/src/app/api/bookings/[id]/route.ts` - booking lead update API route
- `HospiqStarterPack/src/server/services/onboarding.service.ts` - onboarding use case
- `HospiqStarterPack/src/server/repositories/ai.repository.ts` - AI FAQ persistence
- `HospiqStarterPack/src/lib/ai/` - DB-grounded AI orchestration, hotel context, brand profile, model intent router, semantic RAG hooks, reply composer, response guard, and evaluation support
- `HospiqStarterPack/src/server/repositories/ai.repository.ts` - FAQ persistence now generates embeddings for semantic search on create
- `HospiqStarterPack/src/app/api/ai/faqs/route.ts` - authenticated hotel-scoped FAQ listing and creation endpoint
- `HospiqStarterPack/src/app/api/ai/test-reply/route.ts` - authenticated hotel-scoped AI hand-test endpoint
- `HospiqStarterPack/src/server/validators/ai.schema.ts` - AI FAQ request validation
- `HospiqStarterPack/scripts/seed-handtest-data.mjs` - remote hand-test data seeding with Gemini embeddings
- `HospiqStarterPack/scripts/handtest-ai-reply.ts` - manual AI reply smoke test from real DB context
- `HospiqStarterPack/scripts/mock-line-webhook.ts` - local mock LINE webhook test that signs payloads, captures replies without calling LINE, and verifies DB persistence
- `HospiqStarterPack/docs/line-webhook-local-handtest-results.md` - multi-question mock LINE webhook result export for user feedback
- `HospiqStarterPack/docs/persona-hospitality-sales-implementation-plan.md` - planned implementation for female service persona, hospitality framing, sales assistance, memory summaries, CTA policy, and intent improvements
- `HospiqStarterPack/src/lib/ai/persona-policy.ts` - structured female hotel sales assistant persona rules
- `HospiqStarterPack/src/lib/ai/sales-policy.ts` - hospitality framing, light sales assistance, CTA strategy, and memory summary policy
- `HospiqStarterPack/docs/line-webhook-persona-sales-after-results.md` - after-results from local mock LINE webhook tests
- `HospiqStarterPack/src/lib/line/` - LINE webhook persistence, admin verify, booking lead creation, chat history, and handoff event flow
- `CONTEXT.md` - glossary for `rentroom`, `HospiqStarterPack`, Starter Pack, and new Supabase project
- `docs/superpowers/specs/2026-05-25-hospiq-starter-pack-design.md` - design spec
- `docs/superpowers/plans/2026-05-25-hospiq-starter-pack.md` - implementation plan

### Known Issues

- The user has not set up the real/new Supabase project yet. Current Supabase work is only local CLI config plus migration files.
- Docker is not installed or not available in PATH, so local migration execution with `npx supabase db reset --local` is blocked until Docker is available.
- `npm install` reports 2 moderate vulnerabilities from the current dependency tree; no `npm audit fix --force` was run because it may introduce breaking changes.
- AI orchestrator now loads hotel context from Starter Pack Supabase tables, extracts intent/entities with the configured model, merges memory, retrieves FAQs, can call semantic FAQ RPC when the migration is applied, and calls the configured AI provider at runtime.
- LINE webhook service verifies the stored per-hotel secret, persists sessions/chat history/handoff events, verifies hotel admins by `admin_verify_code`, creates/updates booking leads from extracted AI entities, and replies through LINE when a reply is available.
- RLS policies are drafted in migration `202605250003`, but they still need to be verified against real Supabase users.
- Semantic search is code-ready in the app, with FAQ embeddings generated on create and semantic-first hybrid retrieval. The semantic RPC migration has been applied to the linked remote Supabase project.
- Seeded hand-test hotel: `12af7b54-d63d-4525-9c7a-429726241f49` (`hospiq-handtest-hotel`). It has 2 roomtypes, 4 rooms, and 5 active FAQ rows with embeddings.
- Gemini embedding now defaults to `gemini-embedding-001` with `outputDimensionality: 768`; `text-embedding-004` returned 404 for the current Gemini API key/API version.
- Avoid piping Thai prompts through PowerShell here-strings for AI quality checks because it can garble Thai before the model receives it. Use `scripts/handtest-ai-reply.ts` for UTF-8-safe hand tests.
- Local LINE mock webhook verified with user message `รถยนต์จอดได้ไหม และถ้าพักสองคนแนะนำห้องไหน`. It created/updated session `mock-line-user-001`, saved incoming/outgoing history, captured a grounded AI reply, and stored outgoing `ai_provider=gemini`, `ai_model=gemini-3.1-flash-lite`.
- Multi-question feedback doc shows good DB-grounded answers but flags intent routing still overuses `general`, handoff replies should be shorter/no booking CTA, and roomTypeName normalization should be improved.
- Persona/sales v1 improves intent classification, Thai feminine service tone, booking detail summaries, and handoff CTA behavior. Remaining tuning: avoid sales prompts on pure FAQ answers if desired, replace `แอดมิน` with `Hospiq` when AI is still assisting, and normalize extracted room names against DB roomtypes.
- The original remote push failed because enum/table objects already existed. The first three migrations were made idempotent for duplicate enum/table/column/index/trigger/policy cases, then `npx supabase db push` succeeded.
- `npx supabase link --project-ref pwiqordsuihkbmubwrsl --yes` fails because the local Supabase CLI has no access token. Run `npx supabase login` or set `SUPABASE_ACCESS_TOKEN`, then retry.
- The Supabase connector currently lists `rentroom`, `Posqr`, and `themilkshop`, but not project `pwiqordsuihkbmubwrsl`. Do not apply HospiqStarterPack migrations through the connector until that project is visible.
- `npx supabase db advisors --linked --type security --level warn --fail-on none` timed out after 124 seconds. Retry later or run in the Supabase dashboard.

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
npm test -- src/lib/ai
npm test -- src/lib/ai/__tests__/semantic-rag.test.ts
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
npx supabase --version
npx supabase migration list --help
npx supabase migration list --linked
npx supabase link --project-ref pwiqordsuihkbmubwrsl --yes
npx supabase db push --dry-run
npx supabase db push
npx supabase db query --linked "select routine_name from information_schema.routines where routine_schema = 'public' and routine_name = 'match_ai_faqs';" --output json
npx supabase db advisors --linked --type security --level warn --fail-on none
node scripts/seed-handtest-data.mjs
npx tsx --tsconfig tsconfig.json scripts/handtest-ai-reply.ts
npx tsx --tsconfig tsconfig.json scripts/mock-line-webhook.ts
node scripts/seed-handtest-data.mjs
npm test
npm run lint
npm run build
```

### Commands To Run Next

```bash
# After Supabase migrations are applied or Docker is available:
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
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

Review `docs/line-webhook-persona-sales-after-results.md`, then tune CTA frequency, AI-vs-admin wording, and room type normalization before real LINE webhook testing.

### Pause Note

The user asked to pause AI optimization and testing for now because that can be refined later. Do not continue prompt/persona tuning unless the user asks. The next best work should move toward product completion: real LINE webhook integration, admin UI surfaces, RLS/multi-hotel verification, and operational flows.

### Core Infra Update

Completed the requested core infra pass:

- Added booking-aware production availability calculation.
- Wired date-range availability into `GET /api/roomtypes` and AI context when memory has check-in/check-out dates.
- Added app-level multi-hotel guard tests.
- Audited remote RLS: all key public tables have RLS enabled and hotel-scoped policies use `app_private.can_access_hotel(hotel_id)`.
- Generated remote Supabase TypeScript types at `src/lib/supabase/database.types.ts`.
- Typed admin/server/browser Supabase clients with the generated `Database` type.
- Fixed type mismatches surfaced by generated types.
- Added and pushed migration `20260526123610_harden_functions_search_path.sql`.
- Re-ran Supabase security advisors; only residual warning is `vector` extension installed in public.
- Added report `docs/core-infra-verification-report.md`.

Latest verification:

```bash
npm test
npm run lint
npm run build
```

Result: 19 test files / 42 tests passed, lint passed, build passed.

### Persona Prompt Tuning Update

Completed the requested prompt tuning based on user feedback:
- Fixed greeting to be concise but include the hotel name.
- Removed robotic repetition of greetings ("สวัสดีค่ะ") and overused AI name ("แอดมิน Hospiq") in ongoing conversations.
- Prevented premature pushing of the booking link until the user actually shows booking readiness or high lead score.
- Verified improvements locally with `scripts/run-long-conversation-test.ts` where all 4 turns handled natural flow, correct persona, and no repetition.
- Passed all 42 tests successfully.
