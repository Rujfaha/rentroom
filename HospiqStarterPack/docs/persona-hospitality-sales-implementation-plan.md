# Persona, Hospitality, and Sales Assistance Implementation Plan

Date: 2026-05-26  
Project: HospiqStarterPack  
Status: Planned, not implemented yet  

## Goal

Improve Hospiq AI from a correct DB-grounded assistant into a more natural hotel assistance experience:

- Female-presenting Thai service persona.
- Warm, human, supportive tone.
- Helpful hotel recommendation behavior before sending booking links.
- Light sales assistance without becoming pushy.
- Memory-aware summaries when customers provide booking details.
- Still no hardcoded answer templates.
- Still hotel-scoped for a multi-hotel SaaS database.

Core principle:

```txt
DB facts = source of truth
Knowledge Base = hotel-owned curated knowledge
Semantic RAG = context retrieval
LLM = reasoning, recommendation, and natural reply composition
Cost optimization = secondary benefit, not the product goal
```

## Non-Goals

- Do not add hotel-specific hardcoded replies in code.
- Do not make keyword-template chatbot logic.
- Do not let AI memorize hotel facts outside the database.
- Do not allow cross-hotel context or memory.
- Do not replace real availability logic with FAQ-only answers.
- Do not over-optimize for cost at the expense of answer quality.

## Current Observations

Local mock LINE webhook tests show that the system is already grounded and mostly useful:

- FAQ semantic retrieval works.
- Room context is used.
- Incoming and outgoing chat history is persisted.
- Outgoing records include `ai_provider` and `ai_model`.
- Handoff events can be created.

Main gaps from user feedback:

- Persona is not clear enough.
- Replies sound too much like generic AI support instead of a female hotel assistant.
- Some answers frame caveats too strongly, creating pressure.
- AI sends booking links too early instead of helping the customer choose first.
- AI should summarize customer-provided booking details before moving to booking/handoff.
- Intent router falls back to `general` too often.

Reference hand-test file:

```txt
docs/line-webhook-local-handtest-results.md
```

## Desired Conversation Style

Hospiq should behave like a capable female hotel sales assistant:

- Warm but concise.
- Helpful before transactional.
- Uses polite Thai naturally, such as `ค่ะ` and `นะคะ`.
- Recommends what fits the customer, not just lists options.
- Reduces friction and pressure.
- Avoids making constraints sound like problems.
- Keeps the conversation moving toward the next useful step.

Example direction for availability:

```txt
สำหรับคืนนี้ ห้องที่ว่างจะเป็น:

1. Standard Queen: ว่าง 2 ห้อง สำหรับ 1-2 ท่าน ราคาเริ่มต้น 1,200 บาท
2. Family Twin: ว่าง 1 ห้อง สำหรับ 3-4 ท่าน ราคาเริ่มต้น 1,900 บาท

ถ้าลูกค้าเข้าพัก 2 ท่าน แนะนำ Standard Queen จะเหมาะและคุ้มกว่านะคะ
ลูกค้าเข้าพักกี่ท่านคะ เดี๋ยว Hospiq ช่วยแนะนำห้องที่เหมาะที่สุดให้ค่ะ
```

This is an example of the expected behavior, not a template to hardcode.

## Architecture Plan

### 1. Persona Policy

Likely files:

```txt
src/lib/ai/brand-profile.ts
src/lib/ai/persona-policy.ts
src/lib/ai/system-prompt.ts
```

Implementation:

- Add a structured persona policy module.
- Keep Hospiq as the fixed SaaS brand identity.
- Define behavior rules, not ready-made replies.
- Make the assistant consistently female-presenting in Thai.
- Make the assistant warm, human, calm, and service-minded.

Suggested policy shape:

```ts
export interface HospiqPersonaPolicy {
  identity: "female_hotel_assistant";
  tone: string[];
  thaiSpeechStyle: string[];
  avoid: string[];
}
```

Key rules:

- Use natural polite Thai.
- Prefer `ค่ะ` / `นะคะ` when replying in Thai.
- Acknowledge the customer briefly when helpful.
- Do not over-greet when the customer asked a concrete question.
- Do not sound like a generic chatbot.

### 2. Hospitality Reply Policy

Likely files:

```txt
src/lib/ai/reply-composer.ts
src/lib/ai/prompt-builder.ts
src/lib/ai/system-prompt.ts
```

Implementation:

- Add prompt payload section for hospitality behavior.
- Reframe constraints into support-oriented language.
- Give the helpful answer first, then soft caveats only if needed.

Examples of behavior rules:

- For parking, lead with availability/support:
  - Better: `มีที่จอดรถรองรับค่ะ`
  - Avoid leading with: `จำนวนจำกัด`
- For missing details, ask naturally:
  - `ลูกค้าเข้าพักกี่ท่านคะ เดี๋ยว Hospiq ช่วยแนะนำห้องที่เหมาะให้ค่ะ`
- For availability, summarize available options before asking follow-up.

### 3. Sales Assistance Policy

Likely files:

```txt
src/lib/ai/sales-policy.ts
src/lib/ai/policy-resolver.ts
src/lib/ai/prompt-builder.ts
src/lib/ai/reply-composer.ts
```

Implementation:

- Add a light sales assistance policy.
- Help the customer decide before sending booking links.
- Recommend the best room based on guest count, price, room description, and availability.
- Keep sales tone soft and service-focused.

Sales behavior levels:

```txt
assist_only
suggest_next_question
recommend_room
booking_ready
handoff
```

Expected behavior:

- If user asks general room/availability, help compare options first.
- If user provides enough booking details, summarize and then send booking link or handoff.
- If user asks for admin, do not add unrelated booking CTA.
- If user seems undecided, ask one useful next question.

### 4. Memory Summary Behavior

Likely files:

```txt
src/lib/ai/intent-router.ts
src/lib/ai/reply-composer.ts
src/lib/ai/types.ts
```

Implementation:

- Use extracted entities and memory to summarize booking details.
- Do not treat memory as source of hotel facts.
- Memory can contain conversation state only:
  - guest count
  - check-in/check-out
  - preferred room
  - guest name
  - phone
  - booking readiness

Expected behavior when user provides details:

```txt
สรุปข้อมูลที่ได้รับตอนนี้นะคะ:
- ห้อง: Standard Queen
- เข้าพัก: คืนนี้
- จำนวนผู้เข้าพัก: 2 ท่าน
- ชื่อ: สมชาย
- เบอร์โทร: 0812345678

ห้องนี้ยังมีว่างค่ะ ลูกค้าสามารถดำเนินการจองผ่านลิงก์นี้ได้เลยนะคะ ...
```

This summary format is an example. Implement as structured behavior, not a fixed template.

### 5. CTA Policy

Likely files:

```txt
src/lib/ai/policy-resolver.ts
src/lib/ai/reply-composer.ts
src/lib/ai/types.ts
```

Implementation:

- Separate CTA decisions from answer generation.
- Prevent booking link overuse.
- Make CTA depend on intent and customer readiness.

Rules:

- `availability`: summarize options, ask guest count or preference if missing.
- `room_recommendation`: recommend best fit and optionally offer booking next step.
- `booking_ready`: summarize details and provide booking link.
- `handoff_request`: confirm handoff, keep reply short, no booking link unless user asked booking too.
- `policy_question` / `amenities_question`: answer directly, ask only one useful follow-up if natural.

### 6. Intent Router Improvement

Likely files:

```txt
src/lib/ai/intent-router.ts
src/lib/ai/__tests__/intent-router.test.ts
```

Implementation:

- Update LLM extraction instruction to reduce `general`.
- Add stronger intent descriptions and Thai examples in non-template system guidance.
- Keep it model-based, not keyword-based.

Targets:

- `มีที่จอดรถไหม` -> `amenities_question`
- `เช็กอินกี่โมง` -> `policy_question`
- `คืนนี้มีห้องว่างไหม` -> `availability`
- `พักสองคนแนะนำห้องไหน` -> `room_recommendation`
- `อยากจอง Standard Queen คืนนี้ 2 คน ชื่อ... เบอร์...` -> `booking_ready`
- `ขอคุยกับแอดมิน` -> `handoff_request`

### 7. Room Type Normalization

Likely files:

```txt
src/lib/ai/intent-router.ts
src/lib/ai/hotel-context.ts
src/lib/ai/orchestrator.ts
```

Implementation:

- After extraction, compare `entities.roomTypeName` with DB roomtype names.
- If the model extracts generic Thai text like `ห้องครอบครัว`, map it to the best matching DB roomtype when confidence is clear.
- Keep original extracted value if no safe match.

Example:

```txt
ห้องครอบครัว -> Family Twin
```

This should be semantic or model-assisted later. For v1, simple normalized name matching against DB names and descriptions is acceptable if clearly scoped.

### 8. Golden Tests and Before/After Export

Likely files:

```txt
src/lib/ai/__tests__/reply-composer.test.ts
src/lib/ai/__tests__/intent-router.test.ts
src/lib/ai/__tests__/semantic-rag.test.ts
scripts/mock-line-webhook.ts
docs/line-webhook-local-handtest-results.md
```

Add tests for:

- Parking answer should be supportive and not lead with pressure.
- Availability answer should summarize rooms and ask a useful next question.
- Booking-ready answer should summarize memory/details.
- Handoff request should create handoff and avoid booking CTA.
- Intent extraction should avoid `general` for common hotel questions.

After implementation:

- Re-run the same mock LINE cases.
- Export a new before/after document:

```txt
docs/line-webhook-persona-sales-after-results.md
```

## Implementation Order

1. Add persona policy module.
2. Add hospitality and sales policy modules.
3. Extend prompt payload to include persona, hospitality, sales, and CTA policy.
4. Update reply composer rules and grounding brief.
5. Update policy resolver CTA decision levels.
6. Improve intent router instructions.
7. Add memory summary behavior.
8. Add room type normalization.
9. Add tests.
10. Re-run mock LINE hand-test.
11. Export before/after results.

## Success Criteria

The next hand-test should show:

- Thai replies consistently use a female hotel assistant style.
- Answers are still grounded in DB/FAQ/room context.
- Parking answer feels helpful, not restrictive.
- Availability answer summarizes options and asks one useful follow-up.
- Room recommendation includes the best option and why.
- Booking-ready reply summarizes customer details before CTA.
- Handoff reply is short, clear, and does not add irrelevant booking CTA.
- Intent values are more specific and less often `general`.
- No hardcoded hotel answer templates are introduced.

## Known Risks

- Over-steering persona in prompts can make replies verbose.
- Too much sales behavior can feel pushy.
- If CTA policy is too aggressive, AI may send booking links too early.
- If intent router remains weak, reply policy may choose the wrong behavior.
- Room type normalization must not guess across hotels.

## Next Recommended Step

Implement `Persona + Hospitality + Sales Assistance v1`, then re-run the existing mock LINE webhook cases and compare results with `docs/line-webhook-local-handtest-results.md`.
