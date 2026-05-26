# Core Infrastructure Verification Report

Date: 2026-05-26  
Project: HospiqStarterPack  

## Scope

This report covers the work requested after pausing AI response optimization:

- RLS + multi-hotel safety
- Production availability
- Supabase generated types
- Supabase DB advisors

## RLS + Multi-Hotel Safety

### App Guard

Added unit coverage for `requireHotelAccess`:

- hotel admin can access their own hotel
- hotel admin cannot request another hotel
- super admin must pass an explicit `hotelId`

Command:

```bash
npm test -- src/server/auth/__tests__/require-hotel-access.test.ts
```

Result:

```txt
3 tests passed
```

### Remote RLS Audit

Remote query checked key public tables:

- `accounts`
- `hotels`
- `roomtypes`
- `roomtype_images`
- `roomtype_amenities`
- `rooms`
- `bookings`
- `line_configs`
- `line_sessions`
- `line_chat_history`
- `line_handoff_events`
- `ai_settings`
- `ai_faqs`
- `ai_testcases`
- `hotel_images`
- `promotions`

Result:

```txt
All checked tables have RLS enabled.
All checked tables have policies.
Hotel-scoped tables use app_private.can_access_hotel(hotel_id) in USING and WITH CHECK.
```

Important policy sample:

```txt
bookings_all_accessible:
USING      app_private.can_access_hotel(hotel_id)
WITH CHECK app_private.can_access_hotel(hotel_id)
```

## Production Availability

### Implemented

Added availability calculation that subtracts overlapping blocking bookings from active room inventory.

Blocking booking statuses:

```txt
pending
confirmed
```

Ignored statuses:

```txt
lead
cancelled
rejected
completed
```

Date overlap rule:

```txt
booking.checkin_date < requested.checkoutDate
booking.checkout_date > requested.checkinDate
```

This prevents checkout day from blocking the next guest.

### Integrated Areas

- `GET /api/roomtypes?checkinDate=YYYY-MM-DD&checkoutDate=YYYY-MM-DD`
- `roomtypeRepository.listByHotel`
- AI context through `applyStayAvailabilityToContext`

When AI memory includes `checkIn` and `checkOut`, room availability now uses booking-aware counts.

### Remote Smoke Test

Temporary confirmed booking inserted and cleaned up:

```txt
Hotel: hospiq-handtest-hotel
Roomtype: Standard Queen
Date range: 2026-06-01 to 2026-06-03
Room count: 1
Status: confirmed
```

Result:

```json
[
  {
    "name": "Standard Queen",
    "total_rooms": 2,
    "available_rooms": 1
  },
  {
    "name": "Family Twin",
    "total_rooms": 2,
    "available_rooms": 1
  }
]
```

The temporary booking was deleted after verification.

## Supabase Types

Generated TypeScript database types from the linked remote project:

```txt
src/lib/supabase/database.types.ts
```

Supabase clients now use generated `Database` types:

- `src/lib/supabase/admin.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/browser.ts`

The generated types caught real mismatches:

- pgvector RPC input needed pgvector string format.
- booking enum fields needed literal enum typing.
- JSON fields needed explicit JSON typing/casting.

Fixes were applied.

## Supabase Advisors

Initial advisor run found:

- mutable `search_path` on `public.update_updated_at_column`
- mutable `search_path` on `public.match_ai_faqs`
- public/authenticated execute on `public.rls_auto_enable`
- `vector` extension installed in public

Added and pushed migration:

```txt
supabase/migrations/20260526123610_harden_functions_search_path.sql
```

It:

- sets search path for `public.update_updated_at_column`
- sets search path for `public.match_ai_faqs`
- revokes execute on `public.rls_auto_enable` from `public`, `anon`, and `authenticated`

Advisor result after migration:

```txt
Only one warning remains: extension_in_public for vector.
```

Residual warning:

```txt
Extension `vector` is installed in the public schema.
```

Decision:

Do not move `vector` right now because it may affect existing `vector(768)` columns, RPC signatures, and indexes. Treat as a known residual advisor warning until a dedicated migration is planned and tested.

## Verification

Latest verification:

```bash
npm test
npm run lint
npm run build
```

Result:

```txt
Tests: 19 files, 42 tests passed
Lint: passed
Build: passed
```

## Remaining Work

After this scope, the main remaining product work is:

1. Real LINE webhook test with actual LINE channel secret/access token.
2. Admin UI:
   - LINE sessions
   - chat history
   - handoff queue
   - booking leads
   - Knowledge Base / FAQ
3. Onboarding UI.
4. Optional future hardening:
   - plan safe `vector` extension relocation
   - stronger end-to-end RLS tests using real Supabase Auth JWTs
