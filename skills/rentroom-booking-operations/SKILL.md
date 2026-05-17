---
name: rentroom-booking-operations
description: Use when implementing admin-created bookings, walk-in/phone booking flows, atomic reservation RPCs, booking calendar integration contracts, or booking payment operations in this rentroom Next.js/Supabase project.
---

# Rentroom Booking Operations

## Goal

Build real hotel booking operations that staff can use daily without breaking public booking, pricing, payment, or room availability.

Use this skill when working on:

- Admin-created bookings for walk-in, phone, OTA, or other manual sources.
- Atomic booking creation and race-condition prevention.
- Booking payment status during manual booking creation.
- Availability contracts used by admin calendar or booking detail screens.

## Non-Negotiable Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options.
- Use inline SVG or lucide icons for UI icons.
- Keep admin UI mobile-first and consistent with the current forest/gold/cream admin design.
- Follow root `skill.md`: do not introduce `any`; use concrete interfaces, `unknown`, or generics.
- Do not bypass server-side validation.
- Do not trust client-submitted prices, room availability, payment status, or room ids.
- Keep database migrations additive and compatible with existing data.

## Implementation Pattern

- Put critical booking creation in one server-side path.
- Public website booking and admin-created booking should both use the atomic booking creation helper/RPC.
- Admin can provide a preferred room, but the server must re-check availability.
- If no preferred room is provided, the server should assign the first available active room for the selected room type.
- Optional payment means no payment row is created unless an amount greater than zero is provided.
- If payment status is `verified`, set `verified_by` and `verified_at` server-side only.

## Atomic Booking Rules

- Lock the selected room row or use an RPC transaction before inserting the booking.
- Block overlapping bookings with statuses: `pending`, `confirmed`, `checked_in`.
- Never create partial booking data if room assignment fails.
- Return a friendly error when the room is no longer available.

## Admin Booking Defaults

- Sources: `walk_in`, `phone`, `ota`, `other`.
- Default source: `walk_in`.
- Default booking status: `pending`.
- Default payment: optional and empty.
- Default total amount: server-calculated stay total.
- Admin may override amount, but the UI should collect a note/internal note when practical.

## Verification Checklist

Run:

```bash
npx tsc --noEmit
npx eslint src/app/actions/booking.ts src/components/admin/bookings/AdminBookingsClient.tsx
npm test
npm run build
```

Manual checks:

- Create a walk-in booking without payment.
- Create a phone booking with verified cash/bank transfer payment.
- Create a booking for a room/date that just became unavailable and confirm it fails cleanly.
- Confirm public website booking still creates customer, booking guest, payment, promotion usage, and email notification as before.
