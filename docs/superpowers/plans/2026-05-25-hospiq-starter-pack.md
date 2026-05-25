# Hospiq Starter Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Hospiq Starter Pack Next.js app with a new Supabase schema, backend-first API foundation, per-hotel LINE webhook, and refactored AI library copied from `rentroom`.

**Architecture:** Create `HospiqStarterPack` as an independent Next.js App Router project inside the current workspace, then move selected AI/LINE concepts from `rentroom` into self-contained modules. Use Supabase project-new migrations, RLS-first schema design, service/repository boundaries, and `hotelId`-scoped flows throughout.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Zod, Vitest, LINE Messaging API.

---

## File Structure Map

Create these project-level files:

- `HospiqStarterPack/AGENTS.md` - local continuation and safety rules copied/adapted from root `AGENTS.md`
- `HospiqStarterPack/README.md` - setup, env, migration, and dev commands
- `HospiqStarterPack/package.json` - standalone scripts and dependencies
- `HospiqStarterPack/next.config.ts` - Next.js config
- `HospiqStarterPack/tsconfig.json` - TypeScript config
- `HospiqStarterPack/eslint.config.mjs` - ESLint config
- `HospiqStarterPack/vitest.config.ts` - Vitest config
- `HospiqStarterPack/.env.example` - non-secret env names

Create these source areas:

- `HospiqStarterPack/supabase/migrations/` - Starter Pack migrations only
- `HospiqStarterPack/supabase/seed.sql` - dev seed data
- `HospiqStarterPack/src/lib/supabase/` - server/admin/browser clients
- `HospiqStarterPack/src/server/auth/` - auth, role, hotel guards
- `HospiqStarterPack/src/server/repositories/` - Supabase table access
- `HospiqStarterPack/src/server/services/` - business use cases
- `HospiqStarterPack/src/server/validators/` - Zod schemas
- `HospiqStarterPack/src/lib/line/` - LINE signature/client helpers
- `HospiqStarterPack/src/lib/ai/` - refactored AI orchestrator and helpers
- `HospiqStarterPack/src/types/` - shared TypeScript contracts
- `HospiqStarterPack/src/app/api/` - route handlers
- `HospiqStarterPack/src/app/dashboard/` - future frontend routes
- `HospiqStarterPack/src/app/onboarding/` - future onboarding route

---

### Task 1: Scaffold Standalone Next.js App

**Files:**
- Create: `HospiqStarterPack/package.json`
- Create: `HospiqStarterPack/README.md`
- Create: `HospiqStarterPack/AGENTS.md`
- Create: `HospiqStarterPack/next.config.ts`
- Create: `HospiqStarterPack/tsconfig.json`
- Create: `HospiqStarterPack/eslint.config.mjs`
- Create: `HospiqStarterPack/vitest.config.ts`
- Create: `HospiqStarterPack/.env.example`
- Create: `HospiqStarterPack/src/app/layout.tsx`
- Create: `HospiqStarterPack/src/app/page.tsx`
- Create: `HospiqStarterPack/src/app/globals.css`

- [ ] **Step 1: Create the app directory**

Run:

```bash
mkdir HospiqStarterPack
```

Expected: `HospiqStarterPack` exists under `C:\Users\msi0007\rentroom`.

- [ ] **Step 2: Initialize Next.js**

Run:

```bash
npx create-next-app@latest HospiqStarterPack --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
```

Expected: app files are created inside `HospiqStarterPack` and `HospiqStarterPack/package.json` exists.

- [ ] **Step 3: Install backend dependencies**

Run:

```bash
cd HospiqStarterPack
npm install @supabase/ssr @supabase/supabase-js zod
npm install -D vitest
```

Expected: dependencies are added to `package.json`.

- [ ] **Step 4: Add env example**

Create `HospiqStarterPack/.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
AI_PROVIDER=
GEMINI_API_KEY=
OPENAI_API_KEY=
```

- [ ] **Step 5: Copy local agent rules**

Create `HospiqStarterPack/AGENTS.md` with these rules:

```md
# HospiqStarterPack Agent Rules

- This is a standalone Next.js app.
- Do not import files from `../src` or the parent `rentroom` app.
- Use the parent `rentroom` project only as reference material.
- Use the new Supabase project and migrations in this folder.
- Keep all hotel-scoped queries scoped by `hotel_id`.
- Do not expose service role keys, LINE tokens, or channel secrets to client code.
- Do not use emoji in UI labels, buttons, tabs, badges, cards, menus, or navigation.
- Before editing, explain the issue, files, approach, and risk.
- Before stopping mid-task, update `AGENT_HANDOFF.md`.
```

- [ ] **Step 6: Verify base app**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 7: Commit scaffold**

Run:

```bash
git add HospiqStarterPack
git commit -m "feat: scaffold hospiq starter pack app"
```

Expected: commit contains only `HospiqStarterPack` scaffold files.

---

### Task 2: Add Supabase Clients and Shared API Helpers

**Files:**
- Create: `HospiqStarterPack/src/lib/supabase/server.ts`
- Create: `HospiqStarterPack/src/lib/supabase/admin.ts`
- Create: `HospiqStarterPack/src/lib/supabase/browser.ts`
- Create: `HospiqStarterPack/src/server/http/api-response.ts`
- Create: `HospiqStarterPack/src/server/http/api-error.ts`
- Test: `HospiqStarterPack/src/server/http/__tests__/api-response.test.ts`

- [ ] **Step 1: Add response tests**

Create `HospiqStarterPack/src/server/http/__tests__/api-response.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { apiError, apiOk } from "../api-response";

describe("api-response", () => {
  it("wraps successful data consistently", () => {
    expect(apiOk({ id: "hotel-1" })).toEqual({
      ok: true,
      data: { id: "hotel-1" },
    });
  });

  it("wraps errors without leaking internals", () => {
    expect(apiError("Forbidden", "FORBIDDEN")).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden",
      },
    });
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/server/http/__tests__/api-response.test.ts
```

Expected: FAIL because `api-response` does not exist yet.

- [ ] **Step 3: Implement API response helper**

Create `HospiqStarterPack/src/server/http/api-response.ts`:

```ts
export type ApiOk<TData> = {
  ok: true;
  data: TData;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function apiOk<TData>(data: TData): ApiOk<TData> {
  return { ok: true, data };
}

export function apiError(message: string, code = "BAD_REQUEST"): ApiError {
  return {
    ok: false,
    error: { code, message },
  };
}
```

- [ ] **Step 4: Implement typed error**

Create `HospiqStarterPack/src/server/http/api-error.ts`:

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
  ) {
    super(message);
  }
}
```

- [ ] **Step 5: Add Supabase server client**

Create `HospiqStarterPack/src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
```

- [ ] **Step 6: Add Supabase admin client**

Create `HospiqStarterPack/src/lib/supabase/admin.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment variables are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

- [ ] **Step 7: Add browser client**

Create `HospiqStarterPack/src/lib/supabase/browser.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

- [ ] **Step 8: Verify**

Run:

```bash
npm test -- src/server/http/__tests__/api-response.test.ts
npm run build
```

Expected: test and build pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add HospiqStarterPack/src/lib/supabase HospiqStarterPack/src/server/http
git commit -m "feat: add supabase and api helpers"
```

---

### Task 3: Create Starter Pack Database Migration

**Files:**
- Create: `HospiqStarterPack/supabase/migrations/202605250001_create_starter_pack_schema.sql`
- Create: `HospiqStarterPack/supabase/seed.sql`
- Create: `HospiqStarterPack/src/types/database.ts`

- [ ] **Step 1: Create migration file**

Create `HospiqStarterPack/supabase/migrations/202605250001_create_starter_pack_schema.sql`:

```sql
create extension if not exists "pgcrypto";

create type account_role as enum ('super_admin', 'hotel_admin');
create type account_status as enum ('active', 'inactive', 'pending');
create type hotel_status as enum ('active', 'inactive', 'setup_required');
create type booking_status as enum ('lead', 'pending', 'confirmed', 'cancelled', 'rejected', 'completed');
create type booking_source as enum ('line_ai', 'manual_admin', 'webbooking', 'other');
create type line_role as enum ('guest', 'hotel_admin', 'unknown');
create type chat_direction as enum ('incoming', 'outgoing');
create type hotel_image_type as enum ('banner', 'showcase', 'gallery');

create table hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  description text,
  contact_phone text,
  contact_email text,
  line_oa_id text,
  facebook_url text,
  website_url text,
  map_url text,
  has_webbooking boolean not null default false,
  webbooking_url text,
  onboarding_completed boolean not null default false,
  status hotel_status not null default 'setup_required',
  admin_verify_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role account_role not null,
  hotel_id uuid references hotels(id) on delete set null,
  status account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_admin_requires_hotel check (
    role <> 'hotel_admin' or hotel_id is not null
  )
);

create table roomtypes (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  description text,
  mood_description text,
  base_price numeric(12,2) not null default 0,
  bed_type text,
  bed_size text,
  standard_capacity integer not null default 2,
  max_capacity integer not null default 2,
  max_extra_beds integer not null default 0,
  extra_bed_price numeric(12,2) not null default 0,
  pet_policy text,
  total_rooms integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table roomtype_images (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid not null references roomtypes(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table roomtype_amenities (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid not null references roomtypes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (roomtype_id, name)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid references roomtypes(id) on delete set null,
  guest_name text,
  guest_phone text,
  guest_line_user_id text,
  checkin_date date,
  checkout_date date,
  guest_count integer not null default 1,
  room_count integer not null default 1,
  status booking_status not null default 'lead',
  source booking_source not null default 'line_ai',
  note text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates_order check (
    checkin_date is null or checkout_date is null or checkout_date > checkin_date
  )
);

create table line_configs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references hotels(id) on delete cascade,
  channel_id text,
  channel_secret text,
  channel_access_token text,
  webhook_url text,
  is_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table line_sessions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  line_user_id text not null,
  display_name text,
  role_in_line line_role not null default 'guest',
  admin_verified_at timestamptz,
  last_intent text,
  memory jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, line_user_id)
);

create table line_chat_history (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  line_session_id uuid references line_sessions(id) on delete set null,
  line_user_id text,
  direction chat_direction not null,
  message_type text not null default 'text',
  message_text text,
  intent text,
  ai_response_source text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table ai_settings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references hotels(id) on delete cascade,
  assistant_name text not null default 'Hospiq',
  assistant_gender_tone text not null default 'female_polite',
  language text not null default 'th',
  tone text,
  sale_mode_enabled boolean not null default true,
  fallback_to_admin_enabled boolean not null default true,
  admin_contact_message text,
  system_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_faqs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table hotel_images (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  image_type hotel_image_type not null,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table promotions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger hotels_updated_at before update on hotels for each row execute function update_updated_at_column();
create trigger accounts_updated_at before update on accounts for each row execute function update_updated_at_column();
create trigger roomtypes_updated_at before update on roomtypes for each row execute function update_updated_at_column();
create trigger bookings_updated_at before update on bookings for each row execute function update_updated_at_column();
create trigger line_configs_updated_at before update on line_configs for each row execute function update_updated_at_column();
create trigger line_sessions_updated_at before update on line_sessions for each row execute function update_updated_at_column();
create trigger ai_settings_updated_at before update on ai_settings for each row execute function update_updated_at_column();
create trigger ai_faqs_updated_at before update on ai_faqs for each row execute function update_updated_at_column();
create trigger promotions_updated_at before update on promotions for each row execute function update_updated_at_column();

create index hotels_status_idx on hotels(status);
create index accounts_hotel_idx on accounts(hotel_id);
create index roomtypes_hotel_active_idx on roomtypes(hotel_id, is_active);
create index roomtype_images_roomtype_idx on roomtype_images(roomtype_id, sort_order);
create index bookings_hotel_status_idx on bookings(hotel_id, status, created_at desc);
create index line_sessions_hotel_user_idx on line_sessions(hotel_id, line_user_id);
create index line_chat_history_session_idx on line_chat_history(line_session_id, created_at desc);
create index ai_faqs_hotel_active_idx on ai_faqs(hotel_id, is_active);
create index promotions_hotel_active_idx on promotions(hotel_id, is_active);

alter table hotels enable row level security;
alter table accounts enable row level security;
alter table roomtypes enable row level security;
alter table roomtype_images enable row level security;
alter table roomtype_amenities enable row level security;
alter table bookings enable row level security;
alter table line_configs enable row level security;
alter table line_sessions enable row level security;
alter table line_chat_history enable row level security;
alter table ai_settings enable row level security;
alter table ai_faqs enable row level security;
alter table hotel_images enable row level security;
alter table promotions enable row level security;
```

- [ ] **Step 2: Add seed data**

Create `HospiqStarterPack/supabase/seed.sql`:

```sql
insert into hotels (
  id,
  name,
  slug,
  description,
  contact_phone,
  has_webbooking,
  status,
  admin_verify_code
) values (
  '11111111-1111-1111-1111-111111111111',
  'Hospiq Demo Hotel',
  'hospiq-demo',
  'Demo accommodation for Hospiq Starter Pack development.',
  '000-000-0000',
  false,
  'setup_required',
  'HOSPIQ-DEMO'
) on conflict (id) do nothing;

insert into ai_settings (hotel_id)
values ('11111111-1111-1111-1111-111111111111')
on conflict (hotel_id) do nothing;

insert into roomtypes (
  hotel_id,
  name,
  description,
  mood_description,
  base_price,
  standard_capacity,
  max_capacity,
  total_rooms
) values (
  '11111111-1111-1111-1111-111111111111',
  'Standard',
  'Simple room for two guests.',
  'Quiet and practical room for short stays.',
  900,
  2,
  2,
  5
) on conflict (hotel_id, name) do nothing;
```

- [ ] **Step 3: Add initial database enum types**

Create `HospiqStarterPack/src/types/database.ts`:

```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface StarterPackDatabase {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_role: "super_admin" | "hotel_admin";
      account_status: "active" | "inactive" | "pending";
      hotel_status: "active" | "inactive" | "setup_required";
      booking_status: "lead" | "pending" | "confirmed" | "cancelled" | "rejected" | "completed";
      booking_source: "line_ai" | "manual_admin" | "webbooking" | "other";
      line_role: "guest" | "hotel_admin" | "unknown";
      chat_direction: "incoming" | "outgoing";
      hotel_image_type: "banner" | "showcase" | "gallery";
    };
  };
}
```

- [ ] **Step 4: Verify migration syntax locally**

Run after linking a new Supabase project or starting local Supabase:

```bash
supabase db reset
```

Expected: migration and seed complete without SQL errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add HospiqStarterPack/supabase HospiqStarterPack/src/types/database.ts
git commit -m "feat: add starter pack database schema"
```

---

### Task 4: Add Auth and Hotel Access Guards

**Files:**
- Create: `HospiqStarterPack/src/server/auth/types.ts`
- Create: `HospiqStarterPack/src/server/auth/get-current-account.ts`
- Create: `HospiqStarterPack/src/server/auth/require-role.ts`
- Create: `HospiqStarterPack/src/server/auth/require-hotel-access.ts`
- Test: `HospiqStarterPack/src/server/auth/__tests__/require-role.test.ts`

- [ ] **Step 1: Write role guard tests**

Create `HospiqStarterPack/src/server/auth/__tests__/require-role.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canUseRole } from "../require-role";

describe("canUseRole", () => {
  it("allows super admin to use super admin access", () => {
    expect(canUseRole("super_admin", ["super_admin"])).toBe(true);
  });

  it("allows hotel admin for hotel admin routes", () => {
    expect(canUseRole("hotel_admin", ["hotel_admin", "super_admin"])).toBe(true);
  });

  it("rejects hotel admin from super admin-only routes", () => {
    expect(canUseRole("hotel_admin", ["super_admin"])).toBe(false);
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/server/auth/__tests__/require-role.test.ts
```

Expected: FAIL because `require-role` does not exist yet.

- [ ] **Step 3: Add auth types**

Create `HospiqStarterPack/src/server/auth/types.ts`:

```ts
export type AccountRole = "super_admin" | "hotel_admin";

export interface CurrentAccount {
  id: string;
  email: string;
  fullName: string | null;
  role: AccountRole;
  hotelId: string | null;
  status: "active" | "inactive" | "pending";
}
```

- [ ] **Step 4: Add role helper**

Create `HospiqStarterPack/src/server/auth/require-role.ts`:

```ts
import { AppError } from "../http/api-error";
import type { AccountRole, CurrentAccount } from "./types";

export function canUseRole(role: AccountRole, allowedRoles: AccountRole[]): boolean {
  return allowedRoles.includes(role);
}

export function requireRole(account: CurrentAccount, allowedRoles: AccountRole[]): CurrentAccount {
  if (!canUseRole(account.role, allowedRoles)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  if (account.status !== "active") {
    throw new AppError("Account is not active", 403, "ACCOUNT_INACTIVE");
  }

  return account;
}
```

- [ ] **Step 5: Add current account loader**

Create `HospiqStarterPack/src/server/auth/get-current-account.ts`:

```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "../http/api-error";
import type { CurrentAccount } from "./types";

interface AccountRow {
  id: string;
  email: string;
  full_name: string | null;
  role: CurrentAccount["role"];
  hotel_id: string | null;
  status: CurrentAccount["status"];
}

export async function getCurrentAccount(): Promise<CurrentAccount> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, email, full_name, role, hotel_id, status")
    .eq("id", authData.user.id)
    .single<AccountRow>();

  if (error || !data) {
    throw new AppError("Account profile not found", 401, "ACCOUNT_NOT_FOUND");
  }

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    hotelId: data.hotel_id,
    status: data.status,
  };
}
```

- [ ] **Step 6: Add hotel guard**

Create `HospiqStarterPack/src/server/auth/require-hotel-access.ts`:

```ts
import { AppError } from "../http/api-error";
import type { CurrentAccount } from "./types";

export function requireHotelAccess(account: CurrentAccount, requestedHotelId?: string): string {
  if (account.role === "super_admin") {
    if (!requestedHotelId) {
      throw new AppError("Hotel id is required", 400, "HOTEL_ID_REQUIRED");
    }
    return requestedHotelId;
  }

  if (!account.hotelId) {
    throw new AppError("Account is not assigned to a hotel", 403, "HOTEL_REQUIRED");
  }

  if (requestedHotelId && requestedHotelId !== account.hotelId) {
    throw new AppError("Forbidden hotel access", 403, "FORBIDDEN_HOTEL");
  }

  return account.hotelId;
}
```

- [ ] **Step 7: Verify**

Run:

```bash
npm test -- src/server/auth/__tests__/require-role.test.ts
npm run build
```

Expected: test and build pass.

- [ ] **Step 8: Commit**

Run:

```bash
git add HospiqStarterPack/src/server/auth
git commit -m "feat: add auth role and hotel guards"
```

---

### Task 5: Add Core Validators, Repositories, and Services

**Files:**
- Create: `HospiqStarterPack/src/server/validators/hotel.schema.ts`
- Create: `HospiqStarterPack/src/server/validators/roomtype.schema.ts`
- Create: `HospiqStarterPack/src/server/validators/booking.schema.ts`
- Create: `HospiqStarterPack/src/server/repositories/hotel.repository.ts`
- Create: `HospiqStarterPack/src/server/repositories/roomtype.repository.ts`
- Create: `HospiqStarterPack/src/server/repositories/booking.repository.ts`
- Create: `HospiqStarterPack/src/server/services/hotel.service.ts`
- Create: `HospiqStarterPack/src/server/services/roomtype.service.ts`
- Create: `HospiqStarterPack/src/server/services/booking.service.ts`
- Test: `HospiqStarterPack/src/server/validators/__tests__/roomtype.schema.test.ts`

- [ ] **Step 1: Write roomtype validation test**

Create `HospiqStarterPack/src/server/validators/__tests__/roomtype.schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRoomtypeSchema } from "../roomtype.schema";

describe("createRoomtypeSchema", () => {
  it("accepts a minimal valid roomtype", () => {
    const parsed = createRoomtypeSchema.parse({
      name: "Standard",
      basePrice: 900,
      totalRooms: 5,
    });

    expect(parsed.name).toBe("Standard");
    expect(parsed.basePrice).toBe(900);
    expect(parsed.totalRooms).toBe(5);
  });

  it("rejects negative price", () => {
    expect(() =>
      createRoomtypeSchema.parse({
        name: "Standard",
        basePrice: -1,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm test -- src/server/validators/__tests__/roomtype.schema.test.ts
```

Expected: FAIL because schema does not exist.

- [ ] **Step 3: Add roomtype schema**

Create `HospiqStarterPack/src/server/validators/roomtype.schema.ts`:

```ts
import { z } from "zod";

export const createRoomtypeSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  moodDescription: z.string().trim().optional(),
  basePrice: z.number().nonnegative().default(0),
  bedType: z.string().trim().optional(),
  bedSize: z.string().trim().optional(),
  standardCapacity: z.number().int().positive().default(2),
  maxCapacity: z.number().int().positive().default(2),
  maxExtraBeds: z.number().int().nonnegative().default(0),
  extraBedPrice: z.number().nonnegative().default(0),
  petPolicy: z.string().trim().optional(),
  totalRooms: z.number().int().nonnegative().default(0),
});

export const updateRoomtypeSchema = createRoomtypeSchema.partial();

export type CreateRoomtypeInput = z.infer<typeof createRoomtypeSchema>;
export type UpdateRoomtypeInput = z.infer<typeof updateRoomtypeSchema>;
```

- [ ] **Step 4: Add hotel schema**

Create `HospiqStarterPack/src/server/validators/hotel.schema.ts`:

```ts
import { z } from "zod";

export const updateHotelSchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().optional(),
  description: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().email().optional(),
  facebookUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  mapUrl: z.string().url().optional(),
  hasWebbooking: z.boolean().optional(),
  webbookingUrl: z.string().url().nullable().optional(),
});

export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
```

- [ ] **Step 5: Add booking schema**

Create `HospiqStarterPack/src/server/validators/booking.schema.ts`:

```ts
import { z } from "zod";

export const createBookingLeadSchema = z.object({
  roomtypeId: z.string().uuid().optional(),
  guestName: z.string().trim().optional(),
  guestPhone: z.string().trim().optional(),
  guestLineUserId: z.string().trim().optional(),
  checkinDate: z.string().date().optional(),
  checkoutDate: z.string().date().optional(),
  guestCount: z.number().int().positive().default(1),
  roomCount: z.number().int().positive().default(1),
  note: z.string().trim().optional(),
  aiSummary: z.string().trim().optional(),
});

export type CreateBookingLeadInput = z.infer<typeof createBookingLeadSchema>;
```

- [ ] **Step 6: Add repositories**

Create repository files that use `createSupabaseAdminClient()` and only expose functions accepting `hotelId`.

`HospiqStarterPack/src/server/repositories/roomtype.repository.ts`:

```ts
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateRoomtypeInput, UpdateRoomtypeInput } from "../validators/roomtype.schema";

export const roomtypeRepository = {
  async listByHotel(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("base_price", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(hotelId: string, input: CreateRoomtypeInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .insert({
        hotel_id: hotelId,
        name: input.name,
        description: input.description,
        mood_description: input.moodDescription,
        base_price: input.basePrice,
        bed_type: input.bedType,
        bed_size: input.bedSize,
        standard_capacity: input.standardCapacity,
        max_capacity: input.maxCapacity,
        max_extra_beds: input.maxExtraBeds,
        extra_bed_price: input.extraBedPrice,
        pet_policy: input.petPolicy,
        total_rooms: input.totalRooms,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(hotelId: string, id: string, input: UpdateRoomtypeInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .update({
        name: input.name,
        description: input.description,
        mood_description: input.moodDescription,
        base_price: input.basePrice,
        total_rooms: input.totalRooms,
      })
      .eq("hotel_id", hotelId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
```

- [ ] **Step 7: Add services**

Create `HospiqStarterPack/src/server/services/roomtype.service.ts`:

```ts
import { roomtypeRepository } from "../repositories/roomtype.repository";
import type { CreateRoomtypeInput, UpdateRoomtypeInput } from "../validators/roomtype.schema";

export const roomtypeService = {
  listRoomtypes(hotelId: string) {
    return roomtypeRepository.listByHotel(hotelId);
  },

  createRoomtype(hotelId: string, input: CreateRoomtypeInput) {
    return roomtypeRepository.create(hotelId, input);
  },

  updateRoomtype(hotelId: string, id: string, input: UpdateRoomtypeInput) {
    return roomtypeRepository.update(hotelId, id, input);
  },
};
```

- [ ] **Step 8: Verify**

Run:

```bash
npm test -- src/server/validators/__tests__/roomtype.schema.test.ts
npm run build
```

Expected: validation test and build pass.

- [ ] **Step 9: Commit**

Run:

```bash
git add HospiqStarterPack/src/server/validators HospiqStarterPack/src/server/repositories HospiqStarterPack/src/server/services
git commit -m "feat: add starter pack services"
```

---

### Task 6: Add Core API Route Handlers

**Files:**
- Create: `HospiqStarterPack/src/app/api/me/route.ts`
- Create: `HospiqStarterPack/src/app/api/hotel/current/route.ts`
- Create: `HospiqStarterPack/src/app/api/roomtypes/route.ts`
- Create: `HospiqStarterPack/src/app/api/bookings/route.ts`
- Create: `HospiqStarterPack/src/app/api/ai/settings/route.ts`
- Create: `HospiqStarterPack/src/app/api/ai/faqs/route.ts`

- [ ] **Step 1: Add `/api/me`**

Create `HospiqStarterPack/src/app/api/me/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { apiError, apiOk } from "@/server/http/api-response";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    return NextResponse.json(apiOk(account));
  } catch (error) {
    return NextResponse.json(
      apiError(error instanceof Error ? error.message : "Unknown error"),
      { status: 401 },
    );
  }
}
```

- [ ] **Step 2: Add roomtypes route**

Create `HospiqStarterPack/src/app/api/roomtypes/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { apiError, apiOk } from "@/server/http/api-response";
import { roomtypeService } from "@/server/services/roomtype.service";
import { createRoomtypeSchema } from "@/server/validators/roomtype.schema";

export async function GET() {
  try {
    const account = await getCurrentAccount();
    const hotelId = requireHotelAccess(account);
    const roomtypes = await roomtypeService.listRoomtypes(hotelId);
    return NextResponse.json(apiOk(roomtypes));
  } catch (error) {
    return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error"), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = await getCurrentAccount();
    const hotelId = requireHotelAccess(account);
    const payload = createRoomtypeSchema.parse(await request.json());
    const roomtype = await roomtypeService.createRoomtype(hotelId, payload);
    return NextResponse.json(apiOk(roomtype), { status: 201 });
  } catch (error) {
    return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error"), { status: 400 });
  }
}
```

- [ ] **Step 3: Add minimal contract routes for other endpoints**

Create route handlers for hotel, bookings, AI settings, and AI FAQs using the same pattern:

```ts
import { NextResponse } from "next/server";
import { apiOk } from "@/server/http/api-response";

export async function GET() {
  return NextResponse.json(apiOk({ ready: true }));
}
```

This keeps route contracts discoverable while each service is implemented in its own task.

- [ ] **Step 4: Verify**

Run:

```bash
npm run build
```

Expected: all route handlers compile.

- [ ] **Step 5: Commit**

Run:

```bash
git add HospiqStarterPack/src/app/api
git commit -m "feat: add starter pack api routes"
```

---

### Task 7: Duplicate and Refactor AI Library

**Files:**
- Create: `HospiqStarterPack/src/lib/ai/types.ts`
- Create: `HospiqStarterPack/src/lib/ai/hotel-context.ts`
- Create: `HospiqStarterPack/src/lib/ai/intent-detector.ts`
- Create: `HospiqStarterPack/src/lib/ai/prompt-builder.ts`
- Create: `HospiqStarterPack/src/lib/ai/response-guard.ts`
- Create: `HospiqStarterPack/src/lib/ai/orchestrator.ts`
- Test: `HospiqStarterPack/src/lib/ai/__tests__/response-guard.test.ts`

- [ ] **Step 1: Copy reference files manually**

Read these files from `rentroom` and copy only useful logic into the new module shape:

```txt
src/lib/ai/line-concierge.ts
src/lib/ai/hotel-context.ts
src/lib/ai/intent-router.ts
src/lib/ai/guardrails.ts
src/lib/ai/reply-composer.ts
src/lib/ai/response-generator.ts
src/types/line-ai.types.ts
```

Do not import from parent `rentroom`.

- [ ] **Step 2: Write response guard tests**

Create `HospiqStarterPack/src/lib/ai/__tests__/response-guard.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { enforceFemalePoliteThaiTone, preventCrossHotelLeak } from "../response-guard";

describe("response guard", () => {
  it("replaces masculine Thai polite particle", () => {
    expect(enforceFemalePoliteThaiTone("ได้ครับ")).toBe("ได้ค่ะ");
  });

  it("blocks cross hotel data leak marker", () => {
    expect(preventCrossHotelLeak("ข้อมูล hotel_id อื่น", "hotel-1").allowed).toBe(false);
  });
});
```

- [ ] **Step 3: Add AI types**

Create `HospiqStarterPack/src/lib/ai/types.ts`:

```ts
export interface HospiqAiContext {
  hotelId: string;
  hotelName: string;
  hasWebbooking: boolean;
  webbookingUrl: string | null;
  roomtypes: Array<{
    id: string;
    name: string;
    description: string | null;
    moodDescription: string | null;
    basePrice: number;
    totalRooms: number;
    amenities: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
    category: string | null;
  }>;
  aiSetting: {
    assistantName: string;
    assistantGenderTone: string;
    fallbackToAdminEnabled: boolean;
    adminContactMessage: string | null;
  };
}

export interface GenerateHospiqReplyInput {
  hotelId: string;
  lineUserId: string;
  message: string;
}

export interface GenerateHospiqReplyResult {
  reply: string;
  intent: string;
  aiResponseSource: string;
}
```

- [ ] **Step 4: Add response guard**

Create `HospiqStarterPack/src/lib/ai/response-guard.ts`:

```ts
export function enforceFemalePoliteThaiTone(response: string): string {
  return response.replaceAll("ครับ", "ค่ะ").replaceAll("นะครับ", "นะคะ");
}

export function preventCrossHotelLeak(response: string, hotelId: string): { allowed: boolean; response: string } {
  if (response.includes("hotel_id") && !response.includes(hotelId)) {
    return {
      allowed: false,
      response: "ขออภัยค่ะ ระบบไม่สามารถเปิดเผยข้อมูลของที่พักอื่นได้ค่ะ",
    };
  }

  return { allowed: true, response };
}
```

- [ ] **Step 5: Add orchestrator shell**

Create `HospiqStarterPack/src/lib/ai/orchestrator.ts`:

```ts
import type { GenerateHospiqReplyInput, GenerateHospiqReplyResult } from "./types";
import { enforceFemalePoliteThaiTone, preventCrossHotelLeak } from "./response-guard";

export async function generateHospiqReply(input: GenerateHospiqReplyInput): Promise<GenerateHospiqReplyResult> {
  const draftReply = "ขอบคุณค่ะ Hospiq กำลังตรวจสอบข้อมูลจากที่พักให้ค่ะ";
  const toneSafe = enforceFemalePoliteThaiTone(draftReply);
  const leakSafe = preventCrossHotelLeak(toneSafe, input.hotelId);

  return {
    reply: leakSafe.response,
    intent: "general",
    aiResponseSource: leakSafe.allowed ? "starter_orchestrator" : "guardrail",
  };
}
```

- [ ] **Step 6: Verify**

Run:

```bash
npm test -- src/lib/ai/__tests__/response-guard.test.ts
npm run build
```

Expected: guard test and build pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add HospiqStarterPack/src/lib/ai
git commit -m "feat: add starter pack ai orchestrator"
```

---

### Task 8: Add LINE Webhook Foundation

**Files:**
- Create: `HospiqStarterPack/src/lib/line/signature.ts`
- Create: `HospiqStarterPack/src/lib/line/client.ts`
- Create: `HospiqStarterPack/src/server/services/line-webhook.service.ts`
- Create: `HospiqStarterPack/src/app/api/line/webhook/[hotelId]/route.ts`
- Test: `HospiqStarterPack/src/lib/line/__tests__/signature.test.ts`

- [ ] **Step 1: Write signature test**

Create `HospiqStarterPack/src/lib/line/__tests__/signature.test.ts`:

```ts
import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyLineSignature } from "../signature";

describe("verifyLineSignature", () => {
  it("accepts a valid LINE signature", () => {
    const body = JSON.stringify({ events: [] });
    const secret = "secret";
    const signature = createHmac("sha256", secret).update(body).digest("base64");

    expect(verifyLineSignature(body, signature, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyLineSignature("{}", "bad", "secret")).toBe(false);
  });
});
```

- [ ] **Step 2: Add signature helper**

Create `HospiqStarterPack/src/lib/line/signature.ts`:

```ts
import { createHmac, timingSafeEqual } from "crypto";

export function verifyLineSignature(body: string, signature: string | null, channelSecret: string): boolean {
  if (!signature || !channelSecret) return false;

  const expected = createHmac("sha256", channelSecret).update(body).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}
```

- [ ] **Step 3: Add LINE webhook route**

Create `HospiqStarterPack/src/app/api/line/webhook/[hotelId]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { lineWebhookService } from "@/server/services/line-webhook.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  const { hotelId } = await context.params;
  const rawBody = await request.text();

  const result = await lineWebhookService.handleWebhook({
    hotelId,
    rawBody,
    signature: request.headers.get("x-line-signature"),
  });

  return NextResponse.json(result);
}
```

- [ ] **Step 4: Add service shell**

Create `HospiqStarterPack/src/server/services/line-webhook.service.ts`:

```ts
import { apiOk } from "../http/api-response";

export const lineWebhookService = {
  async handleWebhook(input: { hotelId: string; rawBody: string; signature: string | null }) {
    JSON.parse(input.rawBody || "{\"events\":[]}");

    return apiOk({
      hotelId: input.hotelId,
      received: true,
      signaturePresent: Boolean(input.signature),
    });
  },
};
```

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- src/lib/line/__tests__/signature.test.ts
npm run build
```

Expected: signature test and build pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add HospiqStarterPack/src/lib/line HospiqStarterPack/src/server/services/line-webhook.service.ts HospiqStarterPack/src/app/api/line
git commit -m "feat: add line webhook foundation"
```

---

### Task 9: Add Frontend Route Shells and API Client Contracts

**Files:**
- Create: `HospiqStarterPack/src/app/dashboard/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/roomtypes/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/bookings/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/promotions/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/settings/hotel/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/settings/line/page.tsx`
- Create: `HospiqStarterPack/src/app/dashboard/settings/ai/page.tsx`
- Create: `HospiqStarterPack/src/app/onboarding/page.tsx`
- Create: `HospiqStarterPack/src/features/api/client.ts`

- [ ] **Step 1: Add API client**

Create `HospiqStarterPack/src/features/api/client.ts`:

```ts
export async function getApiData<TData>(path: string): Promise<TData> {
  const response = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body.error?.message ?? "API request failed");
  }

  return body.data as TData;
}
```

- [ ] **Step 2: Add route shells**

Create each route page as a minimal route shell. Example for `dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <main>Hospiq Starter Pack Dashboard</main>;
}
```

Create equivalent pages for roomtypes, bookings, promotions, hotel settings, LINE settings, AI settings, and onboarding.

- [ ] **Step 3: Verify**

Run:

```bash
npm run build
```

Expected: all routes compile.

- [ ] **Step 4: Commit**

Run:

```bash
git add HospiqStarterPack/src/app/dashboard HospiqStarterPack/src/app/onboarding HospiqStarterPack/src/features/api
git commit -m "feat: add frontend route contracts"
```

---

### Task 10: Final Verification and Handoff

**Files:**
- Create or update: `HospiqStarterPack/AGENT_HANDOFF.md`

- [ ] **Step 1: Run tests**

Run:

```bash
npm test
```

Expected: all Vitest tests pass.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: lint passes without `any`, `@ts-ignore`, or `eslint-disable` additions.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: production build passes.

- [ ] **Step 4: Write handoff**

Create `HospiqStarterPack/AGENT_HANDOFF.md`:

```md
## Agent Handoff Note

### Current Status

HospiqStarterPack has been scaffolded as a standalone Next.js app with Starter Pack database migrations, backend helper structure, initial API contracts, AI orchestrator shell, LINE webhook foundation, and frontend route shells.

### Completed Work

- [x] Scaffolded standalone Next.js app
- [x] Added Supabase client helpers
- [x] Added Starter Pack database migration and seed
- [x] Added auth/role/hotel guards
- [x] Added initial service/repository/validator structure
- [x] Added core API route contracts
- [x] Added AI orchestrator shell
- [x] Added LINE webhook foundation
- [x] Added frontend route shells

### Unfinished Work

- [ ] Connect all repositories to generated Supabase types
- [ ] Implement full onboarding service
- [ ] Implement full LINE session/chat persistence
- [ ] Implement admin verify code flow
- [ ] Expand AI context loader and prompt builder from rentroom reference
- [ ] Add RLS policies after auth contract is confirmed
- [ ] Add browser verification when UI is implemented

### Files Changed

- `HospiqStarterPack/` - new standalone Starter Pack app

### Known Issues

- AI orchestrator is a safe shell and not full production behavior yet.
- LINE webhook service foundation parses payload but still needs per-hotel config lookup and reply API calls.
- RLS is enabled in migration but policies must be finalized after auth flow is confirmed.

### Commands Already Run

```bash
npm test
npm run lint
npm run build
```

### Commands To Run Next

```bash
supabase db reset
npm test
npm run build
npm run dev
```

### Important Context

`HospiqStarterPack` is standalone and must not import from the parent `rentroom` app. `rentroom` is reference material only.

### Next Recommended Step

Implement the onboarding service and complete RLS policies for hotel-scoped access.
```

- [ ] **Step 5: Commit verification handoff**

Run:

```bash
git add HospiqStarterPack/AGENT_HANDOFF.md
git commit -m "docs: add starter pack handoff"
```

---

## Self-Review

Spec coverage:

- New Next.js app: Task 1
- Supabase project-new schema: Task 3
- Backend helpers: Tasks 2, 4, 5
- API endpoints: Task 6
- AI duplicate/refactor: Task 7
- LINE webhook: Task 8
- Frontend connection structure: Task 9
- Test/handoff: Task 10

No parent `rentroom` imports are allowed. Every Starter Pack flow must accept or derive `hotelId` explicitly.

---

## Next Phase: Starter Pack SaaS Schema, RLS, and AI Flow

Reference source: `C:\Users\msi0007\rentroom\src\lib\ai\hotel-ai-rag-architecture.md`.

### Task 11: Supabase CLI / New Project / Migration Verification

- [x] Install local Supabase CLI in `HospiqStarterPack` so the app can use `npx supabase`.
- [x] Add Starter Pack schema expansion migration for LINE sessions, room inventory, booking lead metadata, AI FAQs, AI settings policies, and AI golden test cases.
- [x] Add `rooms` table so Starter Pack can support real room availability instead of only roomtype-level inventory.
- [x] Add `line_handoff_events` and chat history AI metadata for handoff/admin review.
- [ ] Initialize local Supabase config with `npx supabase init` if `supabase/config.toml` is still missing.
- [ ] Verify migrations with `npx supabase db reset --local` after Docker or a linked Supabase project is available.
- [ ] Generate database types from the verified new Supabase project and replace the lightweight manual enum map.

### Task 12: RLS Policies

- [x] Add private `app_private` helper functions for current account role/hotel access.
- [x] Keep security definer helpers out of the exposed `public` schema.
- [x] Add hotel-scoped select/insert/update/delete policies for Starter Pack tables.
- [x] Add authenticated role grants for public tables because newer Supabase projects may not expose new tables automatically.
- [ ] Run Supabase DB advisors after migrations are verified.
- [ ] Re-check RLS behavior with real hotel admin and super admin users.

### Task 13: Onboarding Backend

- [x] Add onboarding validator for hotel profile, optional starter roomtype, and initial AI FAQs.
- [x] Add onboarding service to update hotel profile, create the first roomtype, create FAQ knowledge, and mark onboarding complete.
- [x] Add `POST /api/hotel/onboarding`.
- [x] Add booking lead update support for admin-editable check-in/check-out dates, lead status, notes, contact channel, and webbooking redirect metadata.
- [x] Add `PATCH /api/bookings/[id]`.
- [ ] Add dashboard UI for onboarding after backend and RLS are verified.

### Task 14: Duplicate / Refactor AI Internals

- [x] Create Starter Pack AI scaffold from the architecture boundary without importing parent `rentroom` code.
- [x] Add core module boundaries: `hotel-context`, `intent-detector`, `policy-resolver`, `prompt-builder`, `rag-retriever`, `reply-composer`, `evaluation`, and `orchestrator`.
- [x] Change orchestrator flow to context -> intent -> policy -> prompt payload -> composer -> guardrail.
- [x] Add policy resolver tests for booking CTA and handoff behavior.
- [x] Add DB-backed `hotel-context` loader adapted from the parent AI reference for Starter Pack tables.
- [x] Add AI provider abstraction and Gemini provider adapted from the parent AI reference.
- [x] Replace not-configured reply composer with model-backed composer that builds a grounded Starter Pack prompt.
- [x] Return provider/model metadata from AI generation for future `line_chat_history` persistence.
- [x] Add intent/entity extraction adapted from the parent AI reference.
- [x] Add memory merge from extracted booking entities and handoff signal.
- [x] Add keyword/language FAQ retrieval as the first RAG layer.
- [ ] Refactor from the parent `rentroom` AI reference into standalone Starter Pack modules only.
- [ ] Continue real logic with semantic RAG retrieval, `ai_testcases` evaluation runner, and LINE persistence.
- [ ] Replace temporary hardcoded AI shell replies with database-backed prompt/context assembly.
- [ ] Implement architecture flow: language detection, keyword fast lane, semantic FAQ search, hotel/room/availability context, prompt assembly, model call, guardrails, memory update.
- [ ] Use `ai_settings.supported_languages`, `booking_cta_policy`, `handoff_policy`, `fallback_policy`, and `max_reply_length`.
- [ ] Add RAG evaluation against `ai_testcases`.

### Task 15: LINE Session / Chat History / Admin Verify

- [ ] Load per-hotel LINE config by `hotelId` and verify signatures with stored channel secret.
- [ ] Persist `line_sessions` with `open`, `handoff`, and `closed` status.
- [ ] Persist `line_chat_history` with provider/model metadata and `(hotel_id, line_user_id, created_at desc)` query path.
- [ ] Create handoff events when AI policy decides to escalate.
- [ ] Implement admin verify code flow for hotel admins in LINE.
- [ ] Connect LINE webhook replies to the AI orchestrator and booking lead creation/update flow.
