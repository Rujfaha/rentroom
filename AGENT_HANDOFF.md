## Agent Handoff Note

### Current Status

AI LINE handoff flow has been hardened and deployed to production. The bot now detects admin/staff handoff requests, stores pending handoff state, and sends staff notifications when `LINE_STAFF_NOTIFY_TARGET_ID` is configured. Production logs confirmed `required:true` and the user later confirmed staff group messages are now arriving.

### Completed Work

- [x] Read `AGENTS.md`, `skill.md`, and existing AI flow under `src/lib/ai`.
- [x] Added regression tests for bad AI replies from `example-ai-not-good-answer.md`.
- [x] Added `handoffPending` memory to prevent follow-up customer details from being routed as room availability.
- [x] Added handoff triggers for admin/staff requests and forgotten slip upload.
- [x] Reduced false-positive availability routing from broad Thai words such as `คน`.
- [x] Added privacy and availability guardrails.
- [x] Added route-level webhook test with mocked LINE/Supabase.
- [x] Added production-safe webhook source and handoff status logs.
- [x] Committed and pushed `251e045 fix: harden line ai handoff workflow`.
- [x] Verified Vercel production deployments for `renthotel` and `rentroom` reached `READY`.
- [x] User configured staff target and confirmed messages now enter the admin group.

### Unfinished Work

- [ ] Remove developer-style reason text from customer replies, such as `(admin request)`.
- [ ] Improve staff notification copy so the admin group receives human-readable Thai text instead of raw labels like `[LINE AI Handoff]`, `Reason`, `Priority`, `Conversation`, and `LINE user`.
- [ ] Re-run targeted tests, TypeScript, and build after the UX copy change.
- [ ] Redeploy/push if the user wants the copy update live in production immediately.

### Files Changed

- `src/lib/ai/line-concierge.ts` - orchestrates guardrails, handoff pending state, and deterministic replies.
- `src/lib/ai/handoff.ts` - detects risky handoff/admin/payment-slip cases.
- `src/lib/ai/intent-router.ts` - reduces false positive availability routing.
- `src/lib/ai/reply-composer.ts` - composes deterministic customer replies.
- `src/lib/ai/guardrails.ts` - privacy and unsafe answer validation.
- `src/lib/line/logging.ts` - persists normalized handoff pending memory.
- `src/lib/line/staff-notifier.ts` - currently still sends raw developer-style staff message and needs UX copy cleanup.
- `src/app/api/line/webhook/route.ts` - logs webhook source and staff handoff status for production diagnosis.
- `src/app/api/line/webhook/__tests__/route.test.ts` - route-level mocked webhook tests.
- `src/lib/ai/__tests__/*` - regression tests for AI and handoff behavior.
- `src/types/line-ai.types.ts` - added `admin_request` and `handoffPending`.
- `vitest.config.ts` - resolves `@` alias in Vitest.
- `docs/superpowers/plans/2026-05-24-line-ai-workflow-hardening.md` - implementation plan.

### Known Issues

- Customer reply still exposes internal normalized reason text, for example `(admin request)`.
- Staff group notification is functional but too technical for admins.
- Existing lint warnings remain in unrelated CMS image components about `<img>` usage.
- Existing Next.js build warning remains: `middleware` convention is deprecated in favor of `proxy`.

### Commands Already Run

```bash
npm test
npm test -- src/app/api/line/webhook/__tests__/route.test.ts src/lib/ai/__tests__/line-concierge.test.ts src/lib/ai/__tests__/handoff.test.ts src/lib/ai/__tests__/intent-router.test.ts
npx tsc --noEmit
npm run lint
npm run build
git commit -m "fix: harden line ai handoff workflow"
git push origin master
```

### Commands To Run Next

```bash
npm test -- src/lib/ai/__tests__/reply-composer.test.ts src/lib/line/__tests__/staff-notifier.test.ts src/app/api/line/webhook/__tests__/route.test.ts
npx tsc --noEmit
npm run build
```

### Important Context

The current production app is receiving LINE webhooks correctly at `/api/line/webhook`. The staff notification destination must be configured in Vercel production as `LINE_STAFF_NOTIFY_TARGET_ID`, preferably a LINE group id starting with `C`. The user confirmed staff push now works after setting this env variable.

### Next Recommended Step

Write failing tests for customer-facing and staff-facing handoff copy, then update `reply-composer.ts` and `staff-notifier.ts` so both messages are natural Thai and do not expose internal labels.
