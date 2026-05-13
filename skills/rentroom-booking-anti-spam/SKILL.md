---
name: rentroom-booking-anti-spam
description: Use when implementing or revisiting booking spam protection, booking attempt logging, rate limiting, duplicate booking prevention, promotion-code brute-force protection, or adaptive captcha in this rentroom Next.js/Supabase project.
---

# Rentroom Booking Anti-Spam

## Goal

Protect public website booking and promotion-code validation from spam, accidental duplicate submissions, and brute-force attempts while keeping UX smooth for normal guests.

Use this skill when the user asks to:

- Add Phase 2 booking anti-spam protection.
- Add booking attempt logs or rate limits.
- Investigate suspicious pending bookings.
- Prevent duplicate bookings beyond the current Phase 1 guard.
- Rate-limit promotion code validation.
- Add adaptive Cloudflare Turnstile or captcha later.

## Current Phase 1 Baseline

Phase 1 has already been implemented in the booking flow.

Relevant paths:

- `src/components/booking/StepGuestInfo.tsx`
- `src/components/booking/BookingFlow.tsx`
- `src/app/actions/booking.ts`
- `src/types/landing.types.ts`

Current protections:

- Honeypot field: `companyName` on `GuestInfo`.
- Minimum form time: `formStartedAt` sent through `antiSpam` to `createWebsiteBooking`.
- Server-side guest normalization: full name, phone, email, special requests.
- Server-side validation: date range, no past check-in, max 30 nights, name length, phone pattern, email pattern, special request length, slip requirement.
- Duplicate booking guard: blocks similar `pending`/`confirmed` bookings within 30 minutes for the same hotel, room type, dates, and email or phone.

Do not remove Phase 1 protections when implementing Phase 2.

## Non-Negotiable Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options. Use SVG/lucide icons if an icon is needed.
- Keep UI mobile-first and consistent with existing forest/gold/cream styles.
- Do not trust client-submitted room counts, prices, anti-spam values, or promotion discounts.
- Never store raw IP addresses, emails, or phone numbers in anti-spam logs unless explicitly required. Prefer hashes.
- Use generic user-facing errors. Do not reveal whether honeypot, timing, IP, email, phone, or captcha caused the block.
- Prefer additive migrations with `IF NOT EXISTS`. Do not make destructive database changes.

## Phase 2 Recommendation

Implement Phase 2 before opening public booking broadly, before running ads, or when suspicious pending bookings appear.

Phase 2 should add:

- `booking_attempts` table.
- Hashing for identifiers.
- Attempt logging for success and failure.
- Rate limits for booking creation by IP/email/phone.
- Rate limits for promotion code validation attempts.
- Soft risk scoring that can later trigger adaptive captcha.

## Suggested Migration

Create a new additive migration, for example:

```sql
create table if not exists booking_attempts (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references hotels(id) on delete cascade,
  action text not null,
  ip_hash text,
  email_hash text,
  phone_hash text,
  room_type_id uuid references room_types(id) on delete set null,
  check_in_date date,
  check_out_date date,
  success boolean not null default false,
  reason text,
  risk_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists booking_attempts_hotel_created_idx
on booking_attempts(hotel_id, created_at desc);

create index if not exists booking_attempts_action_ip_created_idx
on booking_attempts(action, ip_hash, created_at desc);

create index if not exists booking_attempts_action_email_created_idx
on booking_attempts(action, email_hash, created_at desc);

create index if not exists booking_attempts_action_phone_created_idx
on booking_attempts(action, phone_hash, created_at desc);

create index if not exists booking_attempts_action_success_created_idx
on booking_attempts(action, success, created_at desc);
```

For large live databases, prefer `CREATE INDEX CONCURRENTLY IF NOT EXISTS` in a separate migration and do not wrap it in a transaction.

## Identifier Hashing Pattern

Use a server-only secret from environment, for example `BOOKING_ANTISPAM_SECRET`.

Hash:

- IP after normalizing from trusted headers.
- Email after trim/lowercase.
- Phone after removing spaces and hyphens.

Do not expose the secret to client components.

Suggested server helper location:

- `src/lib/booking/anti-spam.ts`

Suggested helper names:

- `normalizeBookingIdentifier`
- `hashBookingIdentifier`
- `getBookingClientIp`
- `recordBookingAttempt`
- `countRecentBookingAttempts`
- `evaluateBookingRateLimit`
- `evaluatePromotionValidationRateLimit`

## Rate Limit Thresholds

Start conservative to avoid blocking real guests.

Booking creation:

- IP: 5 attempts per 10 minutes, 20 attempts per 24 hours.
- Email: 3 attempts per 30 minutes, 8 attempts per 24 hours.
- Phone: 3 attempts per 30 minutes, 8 attempts per 24 hours.

Promotion code validation:

- IP: 10 failed attempts per 10 minutes.
- Email or phone when available: 8 failed attempts per 30 minutes.

Do not count successful normal user behavior too aggressively. Prefer checking failures plus total attempts.

## Risk Scoring Draft

Use scores for future adaptive captcha.

Suggested scoring:

- Honeypot filled: +100.
- Form time under 1 second: +50.
- Form time under 3 seconds: +25.
- IP booking attempts over soft limit: +30.
- Email attempts over soft limit: +30.
- Phone attempts over soft limit: +30.
- Recent duplicate booking: +40.
- Promotion code failures over soft limit: +20.

Actions:

- Score under 30: allow.
- Score 30-69: allow for now, log as suspicious; later require Turnstile.
- Score 70 or above: block temporarily.

## Integration: `createWebsiteBooking`

In `src/app/actions/booking.ts`, keep the order safe:

1. Normalize guest input.
2. Validate required booking input.
3. Extract and hash client identifiers.
4. Evaluate Phase 1 guards: honeypot, form timing, duplicate booking.
5. Evaluate Phase 2 rate limits.
6. If blocked, record a failed `booking_attempts` row and return generic rate-limit error.
7. Recheck availability server-side.
8. Recalculate pricing and promotions server-side.
9. Insert customer, booking, guests, payment, promotion snapshots/usages.
10. Record successful booking attempt.

Important: record failures and successes so thresholds have useful data.

Suggested user-facing rate-limit message:

```text
มีการทำรายการหลายครั้งในช่วงเวลาสั้น ๆ กรุณารอสักครู่แล้วลองใหม่อีกครั้ง
```

## Integration: Promotion Code Validation

In `src/app/actions/booking.ts`, apply Phase 2 to `validatePromotionCode` or any promotion-code server action.

Goals:

- Prevent brute-force discount code guessing.
- Record failed validation attempts.
- Rate-limit by IP and, if present, email/phone context.

If the current validation action lacks email/phone/IP context, add only what is necessary and keep UI simple.

## Optional Phase 3: Adaptive Turnstile

Do not add captcha for every guest by default.

Use Cloudflare Turnstile only when risk is elevated:

- IP/email/phone over soft limit.
- Promotion code failures repeated.
- Very fast submission.
- Suspicious score in the medium range.

Recommended UX copy:

```text
เพื่อความปลอดภัย กรุณายืนยันตัวตนก่อนทำรายการจอง
```

Verify Turnstile token server-side only. Never trust a client-only captcha result.

## Admin / Monitoring Ideas

Future admin dashboard can show:

- Total booking attempts today.
- Blocked attempts today.
- Suspicious attempts by action.
- Duplicate booking blocks.
- Promotion-code validation failures.

Avoid showing raw IP/email/phone. Show hashes, counts, and timestamps.

## Verification Checklist

Run lightweight checks first:

```bash
npx tsc --noEmit
git diff --check
```

For scoped lint after implementation:

```bash
npx eslint src/app/actions/booking.ts src/components/booking/BookingFlow.tsx src/components/booking/StepGuestInfo.tsx src/types/landing.types.ts
```

If adding a new anti-spam library file:

```bash
npx eslint src/lib/booking/anti-spam.ts
```

Manual checks:

- Normal booking still succeeds.
- Duplicate booking within 30 minutes is blocked.
- Booking with honeypot value is blocked.
- Very fast submission is blocked.
- Rate-limited booking attempts return a generic friendly message.
- Promotion code validation cannot be brute-forced rapidly.
- Admin booking list still shows real bookings correctly.
