---
name: rentroom-live-data
description: Use when working on this rentroom Next.js/Supabase project, especially app/admin data flows, Supabase schema changes, live booking/payment data, and avoiding mock data regressions.
---

# Arkkarawin Live Data

## Project Rules

- Follow `AGENTS.md`: no emoji in UI labels, buttons, badges, or options. Use SVG/lucide icons instead.
- Keep UI mobile-first and visually consistent with the existing forest/gold/cream admin and landing styles.
- Avoid destructive database changes on a live project. Prefer additive migrations with `IF NOT EXISTS`, new indexes, nullable columns, or compatibility code.
- Do not remove tables/columns just because they are unused in the current UI; first verify no live workflow, report, script, or future module depends on them.

## Supabase Shape

- Tenant root: `hotels`.
- Auth/admin mapping: `users`, `user_hotels`, `staff_permissions`.
- Landing CMS: `hero_slides`, `cms_hotel_contacts`, `local_attractions`, `promotions`, plus generic `cms_pages`, `cms_sections`, `cms_images`.
- Room inventory: `room_types`, `room_type_images`, `rooms`.
- Booking flow: `customers`, `bookings`, `booking_guests`, `payments`.
- Future/optional modules currently present: `housekeeping_logs`, `seasons`, `pricing_rules`, `expense_categories`, `expenses`.

## Live Data Patterns

- Public booking lookup should query `bookings` by `booking_number`, join `customers` by email, join `rooms -> room_types`, and read latest `payments`.
- PromptPay QR config should come from `hotels.settings.promptpay`, which admin updates from the contacts CMS page.
- Website booking creation writes real rows to `customers`, `bookings`, `booking_guests`, and `payments`.
- Availability checks must exclude bookings with statuses `pending`, `confirmed`, and `checked_in` when date ranges overlap.
- Room cards should use `room_type_images` for cover/gallery and count active available rooms from `rooms`.
- Booking prices should come from `pricing_rules` + active `seasons`, not from client-submitted values. The booking server action recalculates totals before insert.
- Pricing priority per night: active season `special`, active season `holiday`, active season matching `weekday/weekend`, active season `weekday`, base matching `weekday/weekend`, base `weekday`, then `room_types.base_price`.
- Automatic day type is `weekend` for Friday, Saturday, and Sunday; otherwise `weekday`. `holiday` and `special` are treated as season overrides.

## Migration Safety

- For live performance work, add indexes in a separate migration and prefer `CREATE INDEX CONCURRENTLY IF NOT EXISTS`.
- Do not wrap concurrent index creation in a transaction.
- Useful current indexes are in `migrations/optimize_live_query_indexes.sql`.
- If a query uses case-insensitive promotion codes or emails, index `lower(column)` and keep query behavior aligned.

## Mock Data Checklist

When touching app/admin data flow, search:

```bash
rg -n "mock|Mock|dummy|sample|fake|DEMO|placeholder|id: \"new\"|getHotelConfig|getLandingPageData|getPromptPayConfig|lookupBooking" src
```

- `id: "new"` is acceptable only as unsaved client-side form state and must be translated into an insert action before hitting Supabase.
- Do not import booking/payment/account data from `src/services/mock-data.ts` in production flows.
- Static labels, nav copy, or fallback display copy can remain as constants, but live customer/booking/payment/room data should come from Supabase.

