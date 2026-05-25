# Hospiq Starter Pack Design Spec

## เป้าหมาย

ออกแบบ **Hospiq AI Hotel Starter Pack** เป็น Next.js application ใหม่ที่แยกจาก `rentroom` เดิม โดยใช้ `rentroom` เป็น reference ของ Pro Pack เท่านั้น ระบบใหม่ต้อง lightweight, backend-first, รองรับ multi-hotel, ย้ายออกไปเป็น repo ใหม่ได้ง่าย และพร้อมต่อยอดเป็น Pro Pack ภายหลัง

## Decisions ที่ตกลงแล้ว

- สร้าง app ใหม่ชื่อ `HospiqStarterPack`
- วาง app ไว้ที่ `C:\Users\msi0007\rentroom\HospiqStarterPack` ในช่วงพัฒนา
- `HospiqStarterPack` ต้องเป็น standalone Next.js project มี `package.json` และ config ของตัวเอง
- ห้ามอ้างไฟล์จาก `rentroom` ด้วย relative path เช่น `../src/lib/ai`
- ใช้ Supabase project ใหม่สำหรับ Starter Pack
- ใช้ schema/migrations ใหม่ ไม่ copy schema `rentroom` ทั้งก้อน
- รอบนี้ทำ design และ implementation plan ก่อน ยังไม่ scaffold code

## Current Rentroom Findings

`rentroom` ปัจจุบันเป็น Next.js 16 + React 19 + Supabase มีโครง AI และ LINE ที่ใช้เป็น reference ได้:

- `src/lib/ai/line-concierge.ts` เป็น orchestrator เดิมของ LINE AI
- `src/lib/ai/hotel-context.ts` โหลดข้อมูลโรงแรม, room type, promotion, contact, AI knowledge
- `src/lib/ai/intent-router.ts` แยก intent และ extract booking lead entities
- `src/lib/ai/guardrails.ts` ป้องกัน privacy/hallucination บางส่วน
- `src/lib/ai/reply-composer.ts` compose deterministic replies จากข้อมูลจริง
- `src/app/api/line/webhook/route.ts` รับ LINE webhook, verify signature, log message, call AI, reply LINE
- `migrations/add_line_ai_mvp.sql` มี line user/conversation/message tables
- `migrations/add_hotel_ai_knowledge.sql` มี `hotel_ai_settings`, `hotel_faqs`, `hotel_ai_testcases`

ข้อจำกัดที่ต้อง refactor เมื่อย้ายไป Starter Pack:

- flow เดิมบางส่วนใช้ active hotel ตัวแรกผ่าน `resolveActiveHotelId()` ซึ่งไม่เหมาะกับ multi-hotel SaaS
- schema เดิมมีความเป็น Pro Pack เช่น physical room, booking engine, CMS, pricing, payment, housekeeping
- LINE config เดิมใช้ env เดียว เหมาะกับ single hotel มากกว่า per-hotel config
- AI library เดิมมี logic ดีหลายส่วน แต่ต้องแยก contract ใหม่ให้รับ `hotelId` ทุก entry point

## Product Boundary

Starter Pack ไม่ใช่ Hotel OS เต็มระบบ รอบแรกต้องเน้น:

- hotel onboarding
- roomtype พื้นฐาน
- booking lead capture
- LINE webhook per hotel
- LINE session และ chat history
- AI settings และ FAQ
- AI orchestrator ที่ตอบจากข้อมูลจริง
- admin verify code ผ่าน LINE
- backend/API contract สำหรับ frontend ในอนาคต

ยังไม่ทำ:

- inventory engine ละเอียด
- payment verification เต็มระบบ
- housekeeping
- expense/finance
- OTA integration
- CMS/landing page editor เต็มรูปแบบ
- frontend dashboard เต็มระบบ

## Architecture

`HospiqStarterPack` จะใช้ Next.js App Router, TypeScript, Tailwind, Supabase, PostgreSQL, Zod, Vitest และ service/repository pattern

โครงสร้างหลัก:

```txt
HospiqStarterPack/
  AGENTS.md
  README.md
  package.json
  next.config.ts
  tsconfig.json
  eslint.config.mjs
  supabase/
    migrations/
    seed.sql
  src/
    app/
      api/
      dashboard/
      onboarding/
    components/
    constants/
    features/
    lib/
      ai/
      line/
      supabase/
    server/
      auth/
      repositories/
      services/
      validators/
    types/
```

Backend flow:

```txt
Route Handler
  -> Zod validation
  -> auth / role / hotel access guard
  -> service layer
  -> repository layer
  -> Supabase
  -> normalized API response
```

LINE flow:

```txt
POST /api/line/webhook/[hotelId]
  -> load hotel + line_config
  -> verify LINE signature
  -> parse events
  -> upsert line_session
  -> store incoming line_chat_history
  -> detect admin verify code or guest flow
  -> call AI orchestrator with hotelId
  -> store outgoing line_chat_history
  -> reply LINE
```

AI flow:

```txt
hotelId + lineUserId + message
  -> load hotel AI context
  -> load recent session memory
  -> detect intent/entities
  -> build prompt/context
  -> generate reply
  -> enforce response guard
  -> return reply + intent + memory update + optional booking lead
```

## Database Design

Starter Pack ใช้ schema ใหม่ที่เบากว่า Pro Pack แต่ยัง scale ได้

Core tables:

- `accounts`
- `hotels`
- `roomtypes`
- `roomtype_images`
- `roomtype_amenities`
- `bookings`
- `line_configs`
- `line_sessions`
- `line_chat_history`
- `ai_settings`
- `ai_faqs`
- `hotel_images`
- `promotions`

หลักการ:

- ใช้ UUID primary key
- table ที่เป็นข้อมูลของโรงแรมต้องมี `hotel_id`
- query ทุกตัวต้อง scope ด้วย `hotel_id` ยกเว้น super admin
- ใช้ enum/check constraints สำหรับ role/status/source
- เปิด RLS ตั้งแต่ migration แรก
- service role ใช้ server-side เท่านั้น
- LINE channel secret/access token เก็บใน server-side table และไม่ส่งออก client

## Roles

`super_admin`

- เห็นทุก hotel
- สร้าง/จัดการ hotel และ hotel admin
- ดู logs, bookings, line sessions, AI settings ทุก hotel

`hotel_admin`

- ผูกกับ hotel เดียวใน Starter Pack
- เห็นและแก้ไขข้อมูลเฉพาะ hotel ของตัวเอง
- จัดการ onboarding, roomtypes, bookings, LINE config, AI settings, FAQ

## API Contract

Auth/account:

```txt
GET    /api/me
POST   /api/admin/accounts
PATCH  /api/admin/accounts/[id]
```

Hotel/onboarding:

```txt
GET    /api/hotel/current
PATCH  /api/hotel/current
POST   /api/hotel/onboarding
PATCH  /api/hotel/onboarding/step
```

Roomtypes:

```txt
GET    /api/roomtypes
POST   /api/roomtypes
GET    /api/roomtypes/[id]
PATCH  /api/roomtypes/[id]
DELETE /api/roomtypes/[id]
POST   /api/roomtypes/[id]/images
DELETE /api/roomtypes/[id]/images/[imageId]
PATCH  /api/roomtypes/[id]/images/reorder
PATCH  /api/roomtypes/[id]/amenities
```

Bookings:

```txt
GET    /api/bookings
POST   /api/bookings
PATCH  /api/bookings/[id]
PATCH  /api/bookings/[id]/status
```

AI:

```txt
GET    /api/ai/settings
PATCH  /api/ai/settings
GET    /api/ai/faqs
POST   /api/ai/faqs
PATCH  /api/ai/faqs/[id]
DELETE /api/ai/faqs/[id]
```

LINE:

```txt
GET    /api/line/webhook-url
GET    /api/line/config
PATCH  /api/line/config
POST   /api/line/admin/verify
POST   /api/line/webhook/[hotelId]
```

## Frontend Connection Plan

ยังไม่ทำ dashboard เต็มระบบในรอบแรก แต่ต้องเตรียม route และ contract:

```txt
src/app/dashboard/page.tsx
src/app/dashboard/roomtypes/page.tsx
src/app/dashboard/bookings/page.tsx
src/app/dashboard/promotions/page.tsx
src/app/dashboard/settings/hotel/page.tsx
src/app/dashboard/settings/line/page.tsx
src/app/dashboard/settings/ai/page.tsx
src/app/onboarding/page.tsx
```

UI direction:

- mobile-first
- clean SaaS
- ไม่ใช้ emoji ใน UI labels/buttons/tabs/cards/navigation
- ใช้ SVG/lucide icons เมื่อจำเป็น
- form แบบ step ลด cognitive load

## Testing Strategy

ต้องมี Vitest/manual test checklist สำหรับ:

- role access
- hotel scoping
- onboarding
- roomtype CRUD
- roomtype image limit 5 รูป
- booking lead creation
- LINE signature verification
- LINE session/chat history
- admin verify code
- AI roomtype answer
- AI unknown-data fallback
- AI female polite tone guard
- webbooking vs non-webbooking behavior

## Risks

- หาก duplicate AI โดยไม่ refactor `hotelId` จะเกิด single-hotel coupling
- หาก schema ใหม่ copy จาก `rentroom` มากไป Starter Pack จะใหญ่เกิน
- หาก LINE config ใช้ env เดียว จะไม่รองรับ multi-hotel
- หาก RLS ไม่วางตั้งแต่แรก การแก้ย้อนหลังเสี่ยงกว่า
- หาก frontend มาก่อน backend contract จะเกิด UI ที่ต่อ data จริงยาก

## Acceptance Criteria

- มีแผนสร้าง standalone Next.js app ใหม่ใน `HospiqStarterPack`
- มีแผนใช้ Supabase project ใหม่และ migrations ใหม่
- มี database schema สำหรับ Starter Pack
- มี API contract หลัก
- มี backend folder structure
- มี AI duplicate/refactor plan ที่ไม่พึ่งไฟล์ `rentroom`
- มี LINE webhook per-hotel plan
- มี onboarding/backend-first plan
- มี frontend connection plan โดยยังไม่ build UI เต็มระบบ
- มี testing checklist ชัดเจน
