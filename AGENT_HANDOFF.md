## Agent Handoff Note

### Current Status

AI LINE handoff flow has been hardened and deployed to production. The bot detects admin/staff handoff requests, stores pending handoff state, and sends staff notifications when `LINE_STAFF_NOTIFY_TARGET_ID` is configured. Production logs confirmed `required:true`, the user confirmed staff group messages are arriving, and the handoff copy has been cleaned up so customer/admin messages no longer expose internal reason codes.

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
- [x] Removed developer-style reason text from customer replies, such as `(admin request)`.
- [x] Improved staff notification copy so the admin group receives human-readable Thai text instead of raw labels like `[LINE AI Handoff]`, `Reason`, `Priority`, `Conversation`, and `LINE user`.
- [x] Re-ran targeted tests, TypeScript, and build after the UX copy change.
- [x] Committed and pushed `287b22e fix: improve line handoff copy`.
- [x] Verified Vercel production deployment for `renthotel-one.vercel.app` reached `READY`.

### Unfinished Work

- [ ] Optional next improvement: implement smarter room comparison/recommendation behavior from `hotel_ai_line_assistant_improvement_prompt_v2.md`.
- [ ] Optional next improvement: add structured FAQ/policy/context filtering so lightweight LLM calls receive only relevant hotel knowledge.
- [ ] Optional cleanup: remove temporary production diagnostic logs (`LINE webhook source`, `LINE staff handoff status`) after the LINE group setup is stable.

### Files Changed

- `src/lib/ai/line-concierge.ts` - orchestrates guardrails, handoff pending state, and deterministic replies.
- `src/lib/ai/handoff.ts` - detects risky handoff/admin/payment-slip cases.
- `src/lib/ai/intent-router.ts` - reduces false positive availability routing.
- `src/lib/ai/reply-composer.ts` - composes deterministic customer replies and hides internal handoff reason codes.
- `src/lib/ai/guardrails.ts` - privacy and unsafe answer validation.
- `src/lib/line/logging.ts` - persists normalized handoff pending memory.
- `src/lib/line/staff-notifier.ts` - sends human-readable Thai staff handoff notifications.
- `src/app/api/line/webhook/route.ts` - logs webhook source and staff handoff status for production diagnosis.
- `src/app/api/line/webhook/__tests__/route.test.ts` - route-level mocked webhook tests.
- `src/lib/ai/__tests__/*` - regression tests for AI and handoff behavior.
- `src/types/line-ai.types.ts` - added `admin_request` and `handoffPending`.
- `vitest.config.ts` - resolves `@` alias in Vitest.
- `docs/superpowers/plans/2026-05-24-line-ai-workflow-hardening.md` - implementation plan.

### Known Issues

- Existing lint warnings remain in unrelated CMS image components about `<img>` usage.
- Existing Next.js build warning remains: `middleware` convention is deprecated in favor of `proxy`.
- Temporary webhook diagnostic logs are still intentionally enabled to help confirm LINE group/source and staff target behavior in production.

### Commands Already Run

```bash
npm test
npm test -- src/app/api/line/webhook/__tests__/route.test.ts src/lib/ai/__tests__/line-concierge.test.ts src/lib/ai/__tests__/handoff.test.ts src/lib/ai/__tests__/intent-router.test.ts
npx tsc --noEmit
npm run lint
npm run build
git commit -m "fix: harden line ai handoff workflow"
git push origin master
git commit -m "fix: improve line handoff copy"
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

If continuing AI quality work, start with the room comparison/recommendation cases in `hotel_ai_line_assistant_improvement_prompt_v2.md`: write failing tests for questions like `ห้องแพงกับห้องถูกต่างกันยังไง`, `ไป 2 คน เอาห้องไหนดี`, and `ห้องถูกสุดกี่บาท`, then add deterministic/context-grounded behavior without inventing missing room features.
