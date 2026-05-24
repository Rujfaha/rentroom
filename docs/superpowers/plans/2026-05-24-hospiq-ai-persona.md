# Hospiq AI Persona Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the LINE AI so Hospiq introduces herself as a polite female accommodation staff assistant, formats replies cleanly, and centralizes assistant policy for future scaling.

**Architecture:** Add a small reusable assistant profile module, then wire deterministic replies and LLM fallback prompts through that module. Keep business facts in `HotelContext`, keep reply layout in `reply-composer.ts`, and avoid repeating identity/tone strings across flows.

**Tech Stack:** Next.js 16, TypeScript, Vitest, Supabase service context, existing `src/lib/ai` modules.

---

## File Structure

- Create: `src/lib/ai/assistant-profile.ts`
  - Owns Hospiq name, role, tone, first greeting rules, formatting rules, and prompt policy helpers.
- Modify: `src/lib/ai/reply-composer.ts`
  - Adds first-contact support, profile-based opener/greeting, and shared layout helpers.
- Modify: `src/lib/ai/line-concierge.ts`
  - Determines first contact from `options.history`, passes it to `composeLineReply`, and builds LLM prompt text from profile policy.
- Modify: `src/lib/ai/__tests__/reply-composer.test.ts`
  - Adds regression tests for first greeting, no repeated intro, and line/bullet structure.
- Modify: `src/lib/ai/__tests__/line-concierge.test.ts`
  - Adds regression test for first-contact deterministic reply through orchestration.
- Modify: `AGENTS.md`
  - Adds rules to read `AGENTS.md`, plan before work, and design scalable code with clear boundaries.

---

### Task 1: Add Reply Composer Regression Tests

**Files:**
- Modify: `src/lib/ai/__tests__/reply-composer.test.ts`

- [ ] **Step 1: Add failing tests for Hospiq first greeting and message structure**

Append these tests inside the existing `describe("composeLineReply", () => { ... })` block:

```ts
  it("introduces Hospiq with the active hotel name on first Thai contact", () => {
    const reply = composeLineReply({
      language: "th",
      intents: ["availability"],
      context,
      bookingUrl: "https://example.com/booking?checkIn=2026-05-26&checkOut=2026-05-27&guests=2",
      memory: {},
      isFirstInteraction: true,
    });

    expect(reply).toContain("Hospiq");
    expect(reply).toContain("Arkkarawin");
    expect(reply).toContain("Standard");
    expect(reply).toContain("\n\n");
    expect(reply).toMatch(/\n- Standard:/);
  });

  it("does not reintroduce Hospiq on later Thai replies", () => {
    const reply = composeLineReply({
      language: "th",
      intents: ["availability"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: {},
      isFirstInteraction: false,
    });

    expect(reply).not.toContain("Hospiq");
    expect(reply).toContain("Standard");
    expect(reply).toMatch(/\n\n/);
  });
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm test -- src/lib/ai/__tests__/reply-composer.test.ts
```

Expected: FAIL because `ComposeLineReplyInput` does not accept `isFirstInteraction`, and replies do not include `Hospiq`.

---

### Task 2: Add Central Assistant Profile

**Files:**
- Create: `src/lib/ai/assistant-profile.ts`

- [ ] **Step 1: Create the profile module**

Add:

```ts
import type { HotelContext, SupportedLineLanguage } from "@/types/line-ai.types";

export interface AssistantMessagePolicy {
  maxListedItems: number;
  paragraphBreak: string;
  bulletPrefix: string;
}

export interface LineAssistantProfile {
  name: string;
  roleByLanguage: Record<SupportedLineLanguage, string>;
  openerByLanguage: Record<SupportedLineLanguage, string>;
  firstGreetingByLanguage: Record<SupportedLineLanguage, string>;
  messagePolicy: AssistantMessagePolicy;
  systemPromptRules: string[];
}

export const HOSPIQ_ASSISTANT_PROFILE: LineAssistantProfile = {
  name: "Hospiq",
  roleByLanguage: {
    th: "พนักงานผู้ช่วยดูแลลูกค้าของที่พัก",
    en: "guest service assistant for the accommodation",
    zh: "住宿客服助理",
    ja: "宿泊施設のゲストサービスアシスタント",
    es: "asistente de atención al huésped del alojamiento",
    ar: "مساعدة خدمة الضيوف في مكان الإقامة",
  },
  openerByLanguage: {
    th: "ได้เลยค่ะ",
    en: "Sure",
    zh: "可以的",
    ja: "承知しました",
    es: "Claro",
    ar: "بالتأكيد",
  },
  firstGreetingByLanguage: {
    th: "สวัสดีค่ะ {assistantName} เป็น{assistantRole}ของ {hotelName} นะคะ",
    en: "Hello, I am {assistantName}, the {assistantRole} at {hotelName}.",
    zh: "您好，我是 {hotelName} 的 {assistantRole} {assistantName}。",
    ja: "こんにちは。{hotelName} の {assistantRole}、{assistantName} です。",
    es: "Hola, soy {assistantName}, {assistantRole} de {hotelName}.",
    ar: "مرحباً، أنا {assistantName}، {assistantRole} في {hotelName}.",
  },
  messagePolicy: {
    maxListedItems: 5,
    paragraphBreak: "\n\n",
    bulletPrefix: "-",
  },
  systemPromptRules: [
    "Use only facts provided by system data. Do not invent room availability, prices, payment accounts, policies, promotions, or booking confirmations.",
    "Reply in the same supported language as the customer when possible.",
    "Keep replies polite, natural, concise, and readable on mobile.",
    "Use short paragraphs and bullet lists for multiple rooms, promotions, contacts, or steps.",
    "Ask only one follow-up question when required information is missing.",
    "Escalate risky requests such as refunds, complaints, cancellations, payment issues, special approvals, and group deals to staff.",
  ],
};

export function buildAssistantGreeting(profile: LineAssistantProfile, language: SupportedLineLanguage, context: HotelContext): string {
  return renderTemplate(profile.firstGreetingByLanguage[language], {
    assistantName: profile.name,
    assistantRole: profile.roleByLanguage[language],
    hotelName: context.hotelName,
  });
}

export function buildAssistantSystemPrompt(profile: LineAssistantProfile): string {
  return [
    `Assistant name: ${profile.name}`,
    "Assistant role: female guest service staff assistant for the active accommodation.",
    "Communication policy:",
    ...profile.systemPromptRules.map((rule) => `- ${rule}`),
  ].join("\n");
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((line, [key, value]) => line.replaceAll(`{${key}}`, value), template);
}
```

- [ ] **Step 2: Run typecheck for the new file**

Run:

```bash
npx tsc --noEmit
```

Expected: May still fail from `reply-composer.test.ts` because implementation is not wired yet; no syntax error should point to `assistant-profile.ts`.

---

### Task 3: Wire Profile Into Deterministic Reply Composer

**Files:**
- Modify: `src/lib/ai/reply-composer.ts`

- [ ] **Step 1: Import the profile helpers**

Add imports:

```ts
import { HOSPIQ_ASSISTANT_PROFILE, buildAssistantGreeting } from "./assistant-profile";
```

- [ ] **Step 2: Extend `ComposeLineReplyInput`**

Change:

```ts
interface ComposeLineReplyInput {
  language: SupportedLineLanguage;
  intents: LineIntent[];
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
  handoff?: LineHandoffRequest | null;
}
```

To:

```ts
interface ComposeLineReplyInput {
  language: SupportedLineLanguage;
  intents: LineIntent[];
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
  handoff?: LineHandoffRequest | null;
  isFirstInteraction?: boolean;
}
```

- [ ] **Step 3: Replace local hardcoded opener policy**

Replace `const EMOJI = ...` and opener usage with profile-based helpers:

```ts
function replyIntro(input: ComposeLineReplyInput): string {
  if (input.isFirstInteraction) {
    return buildAssistantGreeting(HOSPIQ_ASSISTANT_PROFILE, input.language, input.context);
  }

  return HOSPIQ_ASSISTANT_PROFILE.openerByLanguage[input.language];
}

function joinParagraphs(parts: string[]): string {
  return parts.filter(Boolean).join(HOSPIQ_ASSISTANT_PROFILE.messagePolicy.paragraphBreak);
}
```

Then update returns:

```ts
return joinParagraphs([replyIntro(input), handoffPart]);
```

And:

```ts
return joinParagraphs([replyIntro(input), parts.join(HOSPIQ_ASSISTANT_PROFILE.messagePolicy.paragraphBreak)]);
```

- [ ] **Step 4: Use profile list limit**

Replace `.slice(0, 5)` in room/promotion-style list rendering with:

```ts
.slice(0, HOSPIQ_ASSISTANT_PROFILE.messagePolicy.maxListedItems)
```

- [ ] **Step 5: Keep the existing `opener` function only if needed**

If no call sites remain, delete `opener`. Do not delete unrelated translation helpers.

- [ ] **Step 6: Run focused reply composer test**

Run:

```bash
npm test -- src/lib/ai/__tests__/reply-composer.test.ts
```

Expected: PASS or only fail on old assertions that expect the removed emoji. If old tests fail because they assert the emoji, update those assertions to check for `Standard`, `800`, `PromptPay`, and paragraph structure instead of emoji.

---

### Task 4: Pass First-Interaction State Through Orchestration

**Files:**
- Modify: `src/lib/ai/line-concierge.ts`
- Modify: `src/lib/ai/__tests__/line-concierge.test.ts`

- [ ] **Step 1: Add failing orchestration test**

Append inside `describe("generateLineConciergeReply handoff flow", ...)` or add a new describe block:

```ts
describe("generateLineConciergeReply Hospiq persona", () => {
  it("introduces Hospiq on first deterministic reply when history is empty", async () => {
    const result = await generateLineConciergeReply("มีห้องว่าง 2026-06-01 ถึง 2026-06-03 สำหรับ 2 คนไหม", {
      history: [],
    });

    expect(result.model).toBe("deterministic");
    expect(result.reply).toContain("Hospiq");
    expect(result.reply).toContain("Arkkarawin");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toMatch(/\n\n/);
  });
});
```

- [ ] **Step 2: Run the focused orchestration test**

Run:

```bash
npm test -- src/lib/ai/__tests__/line-concierge.test.ts
```

Expected: FAIL until `line-concierge.ts` passes first interaction state into `composeLineReply`.

- [ ] **Step 3: Compute first-interaction state in orchestration**

In `generateLineConciergeReply`, add:

```ts
  const history = options.history ?? [];
  const isFirstInteraction = history.length === 0;
```

Use `history` in `formatHistoryPrompt(history)` instead of repeating `options.history ?? []`.

- [ ] **Step 4: Pass the state into `composeLineReply`**

Change:

```ts
const deterministicReply = composeLineReply({ language, intents: [...intents], context, bookingUrl, memory: replyMemory, handoff });
```

To:

```ts
const deterministicReply = composeLineReply({
  language,
  intents: [...intents],
  context,
  bookingUrl,
  memory: replyMemory,
  handoff,
  isFirstInteraction,
});
```

- [ ] **Step 5: Run focused orchestration test**

Run:

```bash
npm test -- src/lib/ai/__tests__/line-concierge.test.ts
```

Expected: PASS.

---

### Task 5: Use Assistant Profile In LLM Prompt Fallback

**Files:**
- Modify: `src/lib/ai/line-concierge.ts`

- [ ] **Step 1: Import prompt helper**

Add:

```ts
import { HOSPIQ_ASSISTANT_PROFILE, buildAssistantSystemPrompt } from "./assistant-profile";
```

- [ ] **Step 2: Replace `buildSystemPrompt` body with profile-based prompt**

Keep the provider call as `system: buildSystemPrompt()`, and replace the local `buildSystemPrompt()` body with:

```ts
function buildSystemPrompt(): string {
  return buildAssistantSystemPrompt(HOSPIQ_ASSISTANT_PROFILE);
}
```

- [ ] **Step 3: Add profile policy lines to the user prompt without duplicating identity**

Keep the existing business facts and booking URL. Replace repeated tone/format/grounding instructions in the prompt array with concise policy lines:

```ts
      `Assistant: ${HOSPIQ_ASSISTANT_PROFILE.name}`,
      `Customer language: ${language}`,
      "Reply using the assistant communication policy from the system message.",
      "Use the hotel context above as the source of truth.",
```

Do not remove `formatHotelContextPrompt(context)`, `formatHistoryPrompt(history)`, `formatMemoryPrompt(memory)`, availability summary, or booking URL.

- [ ] **Step 4: Run line concierge tests**

Run:

```bash
npm test -- src/lib/ai/__tests__/line-concierge.test.ts
```

Expected: PASS.

---

### Task 6: Update AGENTS.md With Scalable Planning Rules

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Add a focused section without rewriting the file**

Add this section after `## Code Style` or before `## Before Editing`:

```md
## Planning and Scalability

- Before making code changes, read `AGENTS.md` and any relevant handoff or skill files.
- Always make a short plan before editing, even for small changes.
- Design code so future agents can extend it without rewriting unrelated flows.
- Centralize repeated business rules, assistant persona rules, labels, statuses, and formatting policies.
- Prefer small modules with clear ownership over scattered hardcoded strings.
- Keep data facts, business logic, formatting, and provider integration separated when practical.
- Do not duplicate logic across flows just to ship faster; extract a helper or config when the same rule is needed in more than one place.
```

- [ ] **Step 2: Preserve existing user changes**

Run:

```bash
git diff -- AGENTS.md
```

Expected: The diff should only add the new section to the already edited file. Do not revert existing edits.

---

### Task 7: Full Verification

**Files:**
- No code edits unless verification exposes a real issue.

- [ ] **Step 1: Run AI test suite**

Run:

```bash
npm test -- src/lib/ai
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS or report only unrelated pre-existing warnings/errors. If related errors appear, fix the real cause.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git diff -- src/lib/ai src/types src/constants AGENTS.md docs/superpowers
git status --short
```

Expected: Changes are limited to the planned files plus the already untracked user docs. No unrelated rewrites.

---

## Self-Review Notes

- Spec coverage: The plan covers assistant profile centralization, first greeting, hotel context naming, Thai formatting, prompt fallback policy, AGENTS.md scalability rules, and relevant tests.
- Placeholder scan: No task uses incomplete placeholder markers.
- Type consistency: `isFirstInteraction?: boolean` is added to `ComposeLineReplyInput` and passed only from `line-concierge.ts`; `HOSPIQ_ASSISTANT_PROFILE` is the single profile constant.
