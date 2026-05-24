## Agent Handoff Note

### Current Status

Work is on branch `hospiq-ai-persona`. The LINE AI now has a centralized Hospiq assistant profile, introduces herself on first customer contact, uses polite female Thai wording, keeps deterministic replies structured for LINE, and passes first-contact instructions to the LLM fallback prompt. The project agent rules were updated with planning/scalability guidance.

### Completed Work

- [x] Read `AGENTS.md`, `skill.md`, and the current `src/lib/ai` flow.
- [x] Wrote and reviewed `docs/superpowers/specs/2026-05-24-hospiq-ai-persona-design.md`.
- [x] Wrote and executed `docs/superpowers/plans/2026-05-24-hospiq-ai-persona.md`.
- [x] Added `src/lib/ai/assistant-profile.ts` for Hospiq identity, tone, greeting, formatting, and prompt policy.
- [x] Updated deterministic replies to use Hospiq profile data instead of scattered opener/persona strings.
- [x] Changed Thai deterministic copy to polite female style and added regression tests against `ผม`/`ครับ`.
- [x] Added first-interaction detection that supports production webhook history where inbound messages are recorded before AI reply.
- [x] Added fallback-provider prompt coverage so first general-contact LLM replies are instructed to introduce Hospiq, role, and hotel name.
- [x] Added `AGENTS.md` Planning and Scalability rules.
- [x] Ran final verification and final review; final review approved after fixes.

### Unfinished Work

- [ ] Push the `hospiq-ai-persona` branch and create/use a Vercel Preview deployment for hand testing.
- [ ] If testing with a real LINE channel, update the LINE Developers Webhook URL to the preview endpoint `/api/line/webhook`, then restore production URL after testing.
- [ ] Optional future cleanup: tighten `reply-composer.ts` translation keys so missing non-Thai translations cannot silently fall back to Thai.

### Files Changed

- `AGENTS.md` - added planning/scalability rules and fixed markdown fence rendering in the handoff template.
- `AGENT_HANDOFF.md` - updated this handoff note for the Hospiq work.
- `docs/superpowers/specs/2026-05-24-hospiq-ai-persona-design.md` - approved design spec.
- `docs/superpowers/plans/2026-05-24-hospiq-ai-persona.md` - implementation plan.
- `src/lib/ai/assistant-profile.ts` - new centralized Hospiq assistant profile and prompt helpers.
- `src/lib/ai/reply-composer.ts` - profile-based intro/opener, female Thai reply wording, shared paragraph/list policy.
- `src/lib/ai/line-concierge.ts` - first-interaction detection and profile-driven fallback prompt instructions.
- `src/lib/ai/__tests__/reply-composer.test.ts` - regression tests for Hospiq greeting, Thai style, paragraph breaks, and handoff copy.
- `src/lib/ai/__tests__/line-concierge.test.ts` - regression tests for first contact, inbound-only history, memory/outbound suppression, and fallback prompt instructions.

### Known Issues

- `npm run lint` exits 0 but reports 8 pre-existing warnings about `<img>` usage in unrelated CMS components.
- `npm run build` passes but reports the existing Next.js warning that the `middleware` convention is deprecated in favor of `proxy`.
- `example-ai-not-good-answer.md` and `hotel_ai_line_assistant_improvement_prompt_v2.md` were already untracked and were not modified during this Hospiq implementation.

### Commands Already Run

```bash
git switch -c hospiq-ai-persona
npm test -- src/lib/ai/__tests__/reply-composer.test.ts
npm test -- src/lib/ai/__tests__/line-concierge.test.ts
npm test -- src/lib/ai
npx tsc --noEmit
npm run lint
npm run build
git diff -- AGENTS.md
git diff --stat
git status --short
```

### Commands To Run Next

```bash
git status --short
git diff -- src/lib/ai AGENTS.md AGENT_HANDOFF.md docs/superpowers
git add AGENTS.md AGENT_HANDOFF.md docs/superpowers src/lib/ai
git commit -m "feat: add hospiq ai persona"
git push origin hospiq-ai-persona
```

### Important Context

The webhook records inbound LINE messages before fetching recent history. Because of that, first contact is now detected as: no `bookingLead`, no `handoffPending`, and no outbound message in history. This lets inbound-only history still trigger Hospiq's first greeting while preventing repeated introductions once memory or outbound history exists.

For Vercel hand testing, use the preview deployment URL plus `/api/line/webhook` as the LINE Developers Webhook URL. Ensure Preview environment variables include LINE, Supabase, and AI provider settings.

### Next Recommended Step

Review the final diff, commit the scoped files, push `hospiq-ai-persona`, then hand test via Vercel Preview before merging or promoting.
