# LINE AI Workflow Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LINE AI replies stay on the customer question, send admin/human handoff when needed, and avoid obvious hallucination-prone flows.

**Architecture:** Keep the existing deterministic-first architecture. Add focused handoff state to conversation memory, strengthen handoff detection, add privacy and unknown-data guardrails before LLM fallback, and reduce broad intent regex matches that misroute follow-up contact details.

**Tech Stack:** Next.js, TypeScript, Vitest, existing `src/lib/ai` modules.

---

### Task 1: Reproduce Bad Handoff Flow

**Files:**
- Modify: `src/lib/ai/__tests__/handoff.test.ts`
- Modify: `src/lib/ai/__tests__/intent-router.test.ts`
- Modify: `src/lib/ai/__tests__/reply-composer.test.ts`
- Modify: `src/lib/ai/__tests__/line-concierge.test.ts`

- [ ] Write failing tests for `ติดต่อแอดมินให้หน่อย จองแล้วลืมแนบสลิป`, `โอนแล้วแต่สลิปมีปัญหา`, and the next customer name/phone message after handoff.
- [ ] Run `npm test -- src/lib/ai/__tests__/handoff.test.ts src/lib/ai/__tests__/intent-router.test.ts src/lib/ai/__tests__/reply-composer.test.ts src/lib/ai/__tests__/line-concierge.test.ts` and confirm the new tests fail for the current behavior.

### Task 2: Add Handoff State and Safer Routing

**Files:**
- Modify: `src/types/line-ai.types.ts`
- Modify: `src/lib/ai/handoff.ts`
- Modify: `src/lib/ai/intent-router.ts`
- Modify: `src/lib/ai/reply-composer.ts`
- Modify: `src/lib/ai/line-concierge.ts`

- [ ] Add `handoffPending` to `LineConversationMemory`.
- [ ] Add handoff triggers for asking for admin/staff/human help and forgotten slip upload.
- [ ] Prevent standalone Thai person-count words such as `คน` from triggering availability unless paired with room/date/stay wording.
- [ ] When `handoffPending` exists and the next message looks like contact details, keep the flow in handoff instead of availability/booking.
- [ ] Compose a short acknowledgement that the details were received and will be passed to staff.

### Task 3: Add First Guardrails From Improvement Prompt

**Files:**
- Create: `src/lib/ai/guardrails.ts`
- Create: `src/lib/ai/__tests__/guardrails.test.ts`
- Modify: `src/lib/ai/line-concierge.ts`

- [ ] Add privacy-restricted detection for other guest/customer/room occupancy questions.
- [ ] Return fixed refusal before LLM fallback for private customer-data questions.
- [ ] Add answer validation for LLM availability claims when no availability data exists.

### Task 4: Verify

**Files:**
- No production file changes.

- [ ] Run targeted AI tests.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build` if TypeScript passes.
- [ ] If dev server/API verification is feasible with local env, POST representative messages through the app API or run an equivalent integration test path and record output.
