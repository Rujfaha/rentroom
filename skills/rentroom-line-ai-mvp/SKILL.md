---
name: rentroom-line-ai-mvp
description: Use when implementing, reviewing, or extending the LINE Official Account AI concierge MVP in this rentroom Next.js/Supabase project, including LINE webhook handling, AI provider abstraction, Gemini/OpenAI/Groq integration, hotel context retrieval, room availability answers, booking lead capture, and fast scalable product shipping without admin settings UI.
---

# Rentroom LINE AI MVP

## Goal

Ship a LINE OA AI concierge quickly while keeping the architecture clean enough to swap AI providers, add booking draft creation, and scale toward production without rewriting the core.

Use existing rentroom systems first: Supabase hotel/room/booking/payment data, PromptPay config, public booking flow, and admin booking operations.

## Non-Negotiable Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options.
- Follow root `skill.md`: do not introduce `any`; use concrete interfaces, `unknown`, or narrow runtime guards.
- Do not change existing booking behavior unless the user explicitly asks.
- Do not let AI create confirmed bookings directly in the first MVP.
- Do not trust AI-generated prices, room availability, room ids, payment status, or booking status.
- Re-query Supabase server-side before answering availability, price, or booking-sensitive questions.
- Keep secrets in environment variables only. Never expose LINE, Gemini, OpenAI, Groq, or Supabase service keys to the client.
- Keep migrations additive and compatible with live data.

## Fast MVP Scope

Build the first shippable version as backend-only:

- LINE webhook endpoint receives events and verifies `X-Line-Signature`.
- Text messages are stored in a minimal message log.
- AI answers in Thai using hotel context from Supabase.
- Room availability and starting prices come from live data.
- When the user wants to book, reply with the existing `/booking` URL plus a short summary.
- If AI confidence is low or the request is operationally risky, reply with a handoff-style message that staff will follow up.

Explicitly defer:

- Admin bot settings UI.
- Admin inbox UI.
- Rich menu.
- AI-created confirmed bookings.
- Slip OCR or payment verification through LINE.
- Full RAG/file search unless the user provides a large FAQ/policy corpus.

## Recommended File Shape

Add focused modules:

- `src/app/api/line/webhook/route.ts`: LINE webhook, signature verification, event loop, reply dispatch.
- `src/lib/line/client.ts`: LINE reply API client.
- `src/lib/line/signature.ts`: HMAC-SHA256 signature verification helpers.
- `src/lib/ai/provider.ts`: AI provider interface and provider selection.
- `src/lib/ai/providers/gemini.ts`: Gemini implementation for low-cost/free-tier start.
- `src/lib/ai/line-concierge.ts`: prompt, tool orchestration, final response normalization.
- `src/lib/ai/hotel-context.ts`: read-only Supabase queries for hotel info, contacts, room types, promotions, and availability.
- `src/constants/line-ai.ts`: provider names, limits, fallback copy, event constants.
- `src/types/line-ai.types.ts`: shared LINE event and AI result types.
- `migrations/add_line_ai_mvp.sql`: message/user/conversation tables.

Keep each file small. Move pure parsing, date extraction, and formatting helpers into `utils/` if they grow.

## Data Model

Start with minimal tables:

- `line_users`: `id`, `hotel_id`, `line_user_id`, `display_name`, `customer_id`, `created_at`, `updated_at`.
- `line_conversations`: `id`, `hotel_id`, `line_user_id`, `status`, `last_intent`, `last_message_at`, `created_at`, `updated_at`.
- `line_messages`: `id`, `hotel_id`, `line_user_id`, `conversation_id`, `direction`, `message_type`, `line_message_id`, `text`, `ai_provider`, `ai_model`, `metadata`, `created_at`.

Use `jsonb` for provider metadata and raw event snippets, but keep searchable fields as columns.

## AI Provider Contract

Use a provider abstraction from the start:

```ts
export interface AiProvider {
  generate(input: AiGenerateInput): Promise<AiGenerateResult>;
}
```

Start with Gemini using `AI_PROVIDER=gemini`. Keep provider-specific SDK code out of the LINE route.

Provider env:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_BOT_ENABLED=true
NEXT_PUBLIC_SITE_URL=
```

## AI Behavior Contract

The concierge must:

- Answer in concise Thai.
- Ask one clear follow-up question when booking details are missing.
- Avoid claiming availability without a live availability query.
- Prefer sending the existing booking link for final booking in the first MVP.
- Never invent policies, discounts, facilities, bank details, or payment verification.
- Mention staff follow-up when the user asks for refunds, complaints, cancellations, special approvals, group deals, or unclear payment issues.

## Availability and Pricing Rules

- Availability checks must exclude overlapping bookings with statuses `pending`, `confirmed`, and `checked_in`.
- Room type data should come from `room_types` and active `rooms`.
- Starting price can use existing pricing helpers where practical. If a quick MVP must use `room_types.base_price`, label it as starting price and keep the implementation replaceable.
- For exact booking totals, route the user to `/booking` or use the existing server pricing path.

## LINE Webhook Rules

- Read the raw body before JSON parsing for signature verification.
- Reject invalid signatures with `401`.
- Return `200` quickly after processing or safe failure logging.
- Reply only to supported text message events in the first MVP.
- Ignore non-text events with a polite fallback only when useful.
- Do not throw unhandled errors from the webhook route; log and return `200` after best-effort handling so LINE does not retry endlessly for nonrecoverable issues.

## Implementation Phases

Phase 1: webhook and echo-safe AI reply

- Add env checks.
- Verify signature.
- Store inbound and outbound messages.
- Reply with AI-generated answer using hotel summary context.

Phase 2: live hotel tools

- Add room type, contact, promotion, and availability context.
- Add structured intent detection for availability, booking, payment, contact, and fallback.
- Add short deterministic responses for common operational questions.

Phase 3: booking lead capture

- Store requested check-in, check-out, guests, room preference, name, and phone in conversation metadata or a booking lead table.
- Reply with `/booking` URL and prefilled query params when feasible.
- Keep confirmed booking creation in the existing booking flow.

## Verification Checklist

Run:

```bash
npx tsc --noEmit
npx eslint src/app/api/line/webhook/route.ts src/lib/line src/lib/ai src/types/line-ai.types.ts
npm test
npm run build
```

Manual checks:

- LINE webhook verify passes in LINE Developers Console.
- Invalid signature returns `401`.
- Text message receives a Thai reply.
- Availability question uses live room/booking data.
- Missing booking details triggers one follow-up question.
- Booking intent returns the existing booking URL.
- Provider outage returns a polite fallback and logs the failure.
