---
name: rentroom-performance-optimization
description: Use when investigating or fixing slow loading, high Supabase latency, expensive Next.js rendering, realtime refresh behavior, middleware overhead, or admin/public performance issues in this rentroom Next.js/Supabase project.
---

# Rentroom Performance Optimization

## Goal

Optimize the Rentroom production app without breaking live booking data, admin workflows, or realtime room availability counts.

Use this skill when the user reports:

- Slow loading on public pages or admin pages
- High TTFB or slow SSR
- Too many Supabase requests
- Realtime updates causing page refreshes or reload loops
- Middleware/session latency
- Admin dashboard or room management taking too long to load

## Non-Negotiable Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options. Use SVG/lucide icons instead.
- Keep UI mobile-first and consistent with the existing forest/gold/cream visual system.
- Do not remove realtime room availability counts unless explicitly requested.
- Do not trade correctness of booking availability for speed.
- Do not cache user-specific admin/session data as public static data.
- Do not use destructive database changes for performance work.

## First Checks

When investigating slow loading, inspect these files first:

- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/session.ts`
- `src/app/page.tsx`
- `src/app/actions/landing.ts`
- `src/components/sections/RoomTypesSection.tsx`
- `src/components/realtime/RealtimeRoomSync.tsx`
- `src/app/actions/booking.ts`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/app/(admin)/admin/rooms/page.tsx`
- `src/app/(admin)/admin/bookings/page.tsx`

Look for:

- `dynamic = "force-dynamic"`
- `revalidate = 0`
- sequential Supabase queries that can be parallelized
- `select("*")` on large tables
- unbounded booking lists without pagination
- `router.refresh()` inside high-frequency realtime subscriptions
- realtime subscriptions without `hotel_id` filters
- production debug logs or debug queries
- `JSON.stringify()` of large Supabase payloads
- middleware calling Supabase on every request

## Middleware Pattern

Avoid refreshing Supabase auth on every request.

Preferred pattern:

- Check for a Supabase auth cookie first.
- Only call `updateSession(request)` when a cookie like `sb-*-auth-token` exists.
- Preserve custom admin JWT/session validation separately.

This reduces latency on public pages, static assets, and admin routes that do not need Supabase auth refresh.

## Landing Page Pattern

The public landing page is mostly CMS content plus live room availability.

Preferred pattern:

- Avoid `force-dynamic` unless the entire page truly must be fresh every request.
- Use ISR such as `export const revalidate = 120` for hotel, hero, contact, promotion, attraction, and room type content.
- Fetch the hotel row first if other queries require `hotel_id`.
- After `hotel_id` is known, run independent queries with `Promise.all`.
- Keep room availability counts fresh client-side through `RoomTypesSection`.

Do not make the whole landing page dynamic only for room counts. Room counts should be refreshed separately.

## Realtime Room Count Pattern

Room availability counts are a live-data requirement.

Preferred pattern in `RoomTypesSection`:

- Fetch `getRoomAvailabilityCounts(hotelId)` on mount.
- Subscribe to `rooms` changes with `filter: "hotel_id=eq." + hotelId`.
- On room changes, refresh only availability counts.
- Keep a low-frequency polling fallback, currently 60 seconds.
- Do not rely on full-page `router.refresh()` for frequent room count updates.

This keeps counts fresh without re-rendering the whole landing page.

## Realtime Full Page Refresh Pattern

Use full-page refresh carefully.

If `RealtimeRoomSync` is needed:

- Filter all subscriptions by `hotel_id` when possible.
- Avoid broad `event: "*"` without filters on shared tables.
- Remove production `console.log` calls.
- Memoize the Supabase browser client to avoid unnecessary re-subscriptions.
- Prefer debounced refreshes for low-frequency CMS changes.

Avoid using `router.refresh()` for high-frequency inventory count changes when a local count refresh is enough.

## Booking Availability Pattern

Booking availability must remain correct.

Preferred pattern:

- Use live Supabase data from `room_types`, `rooms`, and `bookings`.
- Blocking booking statuses are `pending`, `confirmed`, and `checked_in`.
- Overlap rule: block a room when existing booking `check_in_date < requested checkOut` and `check_out_date > requested checkIn`.
- Recalculate pricing server-side from `pricing_rules` and `seasons`.
- Parallelize independent queries such as rooms, bookings, and pricing context with `Promise.all`.

Do not trust client-submitted room counts or prices.

## Admin Dashboard Pattern

Admin dashboard should avoid sequential stats queries.

Preferred pattern:

- Get session first and redirect early if invalid.
- Run independent dashboard queries with `Promise.all`.
- Use narrow column selects.
- Limit recent bookings, normally `limit(5)`.
- Consider Supabase count queries or RPC/views if data grows large.

High-value queries to parallelize:

- rooms inventory
- today bookings
- yesterday bookings
- today check-ins
- yesterday check-ins
- recent bookings

## Admin Rooms Pattern

Room management can become slow because it joins room types, images, rooms, bookings, and customers.

Preferred pattern:

- Fetch `room_types` and `rooms` in parallel.
- Avoid debug fallback queries in production.
- Avoid logging full room payloads in production.
- If the room list grows, limit joined bookings to active/current bookings or create a dedicated view/RPC.
- Avoid loading full booking history for every room when only the current guest/status is needed.

## Admin Layout Pattern

Avoid repeat global queries on every admin page.

Preferred pattern:

- Use `session.hotelName` when already present.
- Query `hotels.name` only as fallback when the session does not contain it.
- Do not fetch public CMS data from admin layout unless required by every admin page.

## Database Index Pattern

Before adding indexes, inspect current migrations and schema.

Relevant files:

- `schema.sql`
- `migrations/optimize_live_query_indexes.sql`

Safe live index guidance:

- Prefer additive migrations.
- Use `CREATE INDEX CONCURRENTLY IF NOT EXISTS` for live production indexes.
- Do not wrap concurrent index creation in a transaction.
- Index columns used by frequent filters and joins: `hotel_id`, `is_active`, `status`, `created_at`, `check_in_date`, `check_out_date`, `room_type_id`, and booking/customer lookup fields.

## Verification Checklist

Use lightweight verification first:

```bash
git diff --check
npx tsc --noEmit --pretty false
```

Then, when the codebase lint state allows it:

```bash
npm run lint
npm run build
```

Also manually check:

- Public landing page loads and room counts appear.
- Room count updates after room status changes.
- Booking search returns correct availability.
- Admin dashboard loads stats.
- Admin rooms page still shows room types, rooms, and current booking/customer info.
- Admin login/session redirects still work.

## Common Fix Order

1. Remove middleware-wide Supabase auth refresh overhead.
2. Disable production debug logs and debug Supabase queries.
3. Add `hotel_id` filters to realtime subscriptions.
4. Keep room counts realtime through local count refresh, not full-page refresh.
5. Convert landing page from fully dynamic to ISR when safe.
6. Parallelize independent Supabase queries with `Promise.all`.
7. Narrow selects and add pagination where needed.
8. Add safe indexes or RPC/views only after query patterns are clear.
