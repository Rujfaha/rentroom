# Hospiq AI Persona Design

## Goal

Update the LINE conversation AI so it presents itself as **Hospiq**, a polite female staff assistant for the active accommodation, while keeping the code clean, reusable, and ready to scale to more assistant policies later.

## Scope

This change focuses on the existing AI conversation flow in `src/lib/ai/`.

In scope:

- Add a central assistant profile/policy module for Hospiq identity, tone, greeting, and message formatting rules.
- Use the active hotel name from `HotelContext` when Hospiq introduces herself.
- Improve first-contact greeting so Hospiq naturally says her name, role, and accommodation name.
- Improve Thai response formatting with readable line breaks and concise sections.
- Update system prompt construction so LLM fallback follows the same identity, data-grounding, and formatting rules.
- Add regression tests for first greeting, Thai tone/formatting, and profile reuse.
- Update `AGENTS.md` with the project rule that agents must read the file, plan before work, and design scalable code with clear boundaries.

Out of scope:

- Database schema changes.
- New AI providers.
- UI redesign.
- Rewriting the full AI pipeline.
- Per-hotel persona stored in the database. The profile should be designed so it can move to config/database later.

## Current Architecture

The current LINE AI flow is split across focused modules:

- `src/lib/ai/line-concierge.ts` orchestrates message handling, memory, hotel context, deterministic replies, and AI provider fallback.
- `src/lib/ai/hotel-context.ts` loads real accommodation data from Supabase and formats it for prompts.
- `src/lib/ai/reply-composer.ts` composes deterministic replies from trusted facts.
- `src/lib/ai/intent-router.ts`, `handoff.ts`, `guardrails.ts`, and `language.ts` handle routing, safety, and language behavior.

The desired behavior fits this architecture. The main gap is that assistant identity, tone, and formatting rules are currently embedded in prompt strings and reply templates instead of being centralized.

## Proposed Architecture

Create a small central profile module:

- `src/lib/ai/assistant-profile.ts`

This file owns stable assistant communication policy:

- Assistant display name: `Hospiq`
- Thai role: female staff assistant for the accommodation
- Supported tone rules: polite, natural, complete enough, concise, mobile-readable
- First greeting rule: mention assistant name, role, and `context.hotelName`
- Message formatting rule: short paragraphs, section spacing, bullets for lists, one follow-up question at a time
- Grounding rule: use only facts from system data and ask or hand off when data is missing or risky

Other AI modules should consume this profile rather than repeating strings:

- `line-concierge.ts` uses the profile to build the system prompt and decide whether a message is the first customer interaction.
- `reply-composer.ts` uses the profile for deterministic opener/greeting and layout.
- Tests assert behavior through public functions instead of testing private prompt internals.

## First Greeting Behavior

Hospiq should introduce herself only when the conversation appears to be the first interaction. The existing `history` option can be used for this:

- If no previous conversation history is passed, include a short introduction.
- If history exists, use a shorter natural opener and avoid reintroducing herself repeatedly.

Example Thai first greeting style:

```txt
สวัสดีค่ะ Hospiq เป็นพนักงานผู้ช่วยดูแลลูกค้าของ Arkkarawin นะคะ

ช่วง 2026-05-26 - 2026-05-27 สำหรับ 2 ท่าน มีตัวเลือกว่างดังนี้
- Standard: ว่าง 2 ห้อง, เริ่มต้น 800 บาท
- Deluxe: ว่าง 1 ห้อง, เริ่มต้น 1,200 บาท

จองต่อได้ที่ https://example.com/booking?checkIn=2026-05-26&checkOut=2026-05-27&guests=2
```

For non-first replies, Hospiq should be shorter:

```txt
ได้เลยค่ะ

ช่วง 2026-05-26 - 2026-05-27 สำหรับ 2 ท่าน มีตัวเลือกว่างดังนี้
- Standard: ว่าง 2 ห้อง, เริ่มต้น 800 บาท
- Deluxe: ว่าง 1 ห้อง, เริ่มต้น 1,200 บาท
```

## Context Understanding

Hospiq should understand the accommodation from `HotelContext` as much as possible without inventing facts:

- Hotel name, description, address, phone, email
- Visible contact channels
- Room types, starting price, capacity, active room count
- Promotions
- Payment configuration
- Availability results when dates are available

Rules:

- Do not invent room availability, prices, payment accounts, promotions, policies, or booking confirmations.
- Deterministic replies should remain the source of truth for facts that are already structured.
- LLM fallback should rewrite, summarize, or answer general questions from provided facts only.
- If data is missing, Hospiq should say the system does not have that information yet and ask one short follow-up question or hand off when appropriate.

## Message Formatting

Thai messages should be readable in LINE:

- Use short first lines.
- Put each major topic in its own paragraph.
- Use `-` bullets for lists of rooms, contacts, promotions, or steps.
- Avoid dense single-paragraph replies.
- Avoid overly long text; prefer the top few relevant items and a booking/contact link when useful.
- Ask only one follow-up question when information is missing.

No emoji is required for this change. If an emoji remains in chat replies, keep it limited to customer messages and never use emoji in UI labels or controls.

## Scalability Rules

The implementation should avoid hardcoded repeated strings across flows:

- Keep assistant identity and common tone rules in `assistant-profile.ts`.
- Keep reply layout helpers in `reply-composer.ts` or a small helper only if it reduces duplication.
- Do not duplicate Hospiq name, role, or first greeting text across modules.
- Keep data facts in `HotelContext`; do not move business facts into prompts.
- Design profile fields so a later database-backed persona can map onto the same shape.

## Testing

Add or update Vitest coverage:

- `reply-composer.test.ts` should verify first Thai greeting includes `Hospiq`, the hotel name, and female polite Thai wording.
- It should verify later replies do not reintroduce Hospiq when history exists.
- It should verify Thai replies contain clear line breaks and bullet list formatting for multi-room answers.
- `line-concierge.test.ts` should verify generated deterministic replies can detect first contact through empty history.
- Existing handoff and guardrail tests must keep passing.

## Risks

- Existing tests contain Thai mojibake text, so new test assertions should use stable ASCII strings where possible, such as `Hospiq`, hotel names, URLs, and room names, plus line structure checks.
- Changing Thai wording may break tests that assert exact old phrases. Prefer containment and structure assertions over exact full-string matches.
- The first-contact heuristic depends on whether callers pass `history`. If no history is available for returning users, Hospiq may introduce herself again. This is acceptable for this iteration and can be improved later with persisted conversation state.

## Acceptance Criteria

- Hospiq introduces herself naturally on first contact with name, role, and active accommodation name.
- Hospiq uses a polite female Thai style for Thai replies.
- Replies remain concise, readable, and structured with useful line breaks.
- Assistant identity and communication policy are centralized instead of repeated across AI files.
- Prompt fallback and deterministic composer follow the same profile/policy.
- `AGENTS.md` includes the scalable code and planning rule requested by the user.
- Relevant AI tests pass.
