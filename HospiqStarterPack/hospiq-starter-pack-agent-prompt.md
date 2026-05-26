# Prompt สำหรับ Agent: Hospiq AI Hotel — Starter Pack Beta

## บทบาทของ Agent

คุณคือ Senior Full-stack / Backend Architect ที่เชี่ยวชาญด้าน Next.js, Supabase, PostgreSQL, LINE Messaging API, AI Workflow, RAG Architecture และการออกแบบระบบ SaaS สำหรับธุรกิจโรงแรม

เป้าหมายของงานนี้คือออกแบบและเริ่ม implement ระบบ **Hospiq AI Hotel — Starter Pack Beta** โดยเน้นที่ **Backend, Database, API Endpoint, AI Library Integration และ System Architecture** ก่อนเป็นหลัก ยังไม่ต้องเริ่มทำ Frontend เต็มระบบ แต่ต้องวาง structure ให้ชัดเจนว่า Frontend จะเชื่อมต่ออะไรบ้างในอนาคต

ระบบนี้ต้องออกแบบให้ **ใช้งานง่าย, lightweight, scalable, debug ง่าย, ต่อขยายเป็น Pro Pack ได้ในอนาคต** และต้องสอดคล้องกับแนวคิดในไฟล์ `hotel-ai-rag-architecture.md`

---

# 1. ภาพรวม Product

## 1.1 Product Name

**Hospiq AI Hotel — Starter Pack**

## 1.2 Product Concept

Hospiq Starter Pack คือระบบ AI LINE Assistant สำหรับโรงแรม/ที่พักขนาดเล็กถึงกลาง ที่ต้องการให้ AI ช่วยตอบลูกค้า เก็บ lead การจอง และช่วยปิดการขายผ่าน LINE OA โดยไม่จำเป็นต้องมีระบบ Hotel OS เต็มรูปแบบ

Starter Pack ต้องเป็นระบบที่เบากว่า Pro Pack แต่ยังมีโครงสร้างที่สามารถ scale ไปสู่ระบบใหญ่ได้ในอนาคต

## 1.3 ความแตกต่างจาก Pro Pack

ระบบ `rentroom` ปัจจุบันจะถูกมองเป็นแนวทางของ **Pro Pack** ในอนาคต ให้ Agent เข้าไปดู Database / Logic / AI Library จาก Supabase และ codebase ของ rentroom ก่อน จากนั้นนำแนวคิดที่ดีมาออกแบบใหม่เป็นเวอร์ชัน Lite สำหรับ Starter Pack

ห้าม copy database เดิมมาตรง ๆ แบบไม่คิดใหม่  
ต้อง refactor และ redesign ให้เหมาะกับ Starter Pack โดยยังสามารถต่อยอดเป็น Pro Pack ได้

---

# 2. Tech Stack

## 2.1 Main Stack

- Next.js
- TypeScript
- Supabase
- PostgreSQL
- Supabase Auth หรือ custom auth ตามความเหมาะสม
- Supabase Storage สำหรับรูปภาพ
- LINE Messaging API
- AI Workflow API / AI Library ที่ duplicate มาจาก rentroom แล้ว refactor
- Server Actions หรือ Route Handlers ตามความเหมาะสม
- Zod สำหรับ validation
- Repository / Service Layer สำหรับแยก logic
- RLS ของ Supabase ต้องออกแบบไว้ตั้งแต่แรก

## 2.2 Focus ของรอบนี้

ให้เริ่มจาก:

1. ตรวจสอบ database และ AI library เดิมจาก rentroom
2. ออกแบบ backend architecture ใหม่สำหรับ Starter Pack
3. ออกแบบ database schema ใหม่
4. ออกแบบ API endpoints
5. Duplicate AI library จาก rentroom แล้ว refactor ให้เหมาะกับ multi-hotel SaaS
6. วาง onboarding flow สำหรับ hotel admin ครั้งแรก
7. วาง LINE webhook flow
8. วาง admin registration flow ผ่าน LINE
9. วาง test case
10. วาง frontend connection structure แต่ยังไม่ต้อง build frontend เต็มระบบ

---

# 3. Role และ Permission

## 3.1 Roles

ระบบต้องมี role หลักดังนี้

### 1. Super Admin

- เป็นเจ้าของระบบ Hospiq
- ตอนนี้มีคนเดียว คือเจ้าของ project
- เห็นทุกโรงแรม
- จัดการ hotel ทั้งหมดได้
- สร้าง account ให้ hotel admin ได้
- ดู log / booking / line session / ai setting ของทุกโรงแรมได้
- ใช้สำหรับ monitor ระบบ SaaS ทั้งหมด

### 2. Hotel Admin

- เป็นเจ้าของหรือแอดมินของโรงแรม
- มีความสัมพันธ์แบบ many-to-one กับ hotel
- Hotel หนึ่งแห่งมี hotel admin ได้หลายคน
- Hotel admin หนึ่งคนใน Starter Pack ให้ผูกกับ hotel เดียวก่อน เพื่อความง่าย
- เห็นและจัดการได้เฉพาะข้อมูล hotel ของตัวเองเท่านั้น

## 3.2 Permission Principle

- ใช้หลัก least privilege
- ทุก query ต้อง scope ด้วย `hotel_id` เสมอ ยกเว้น super_admin
- API ทุกตัวต้องตรวจ role และ hotel ownership
- ห้ามให้ hotel_admin เข้าถึงข้อมูลของ hotel อื่น
- ออกแบบ RLS Policy ไว้ตั้งแต่แรก แม้ช่วงแรกจะยังใช้ server-side service role บางส่วน

---

# 4. Database Design Requirement

## 4.1 หลักคิดในการออกแบบ Database

Database ต้อง:

- Scalable
- อ่านง่าย
- มี FK ชัดเจน
- รองรับ multi-hotel
- รองรับ web booking และ non-web booking flow
- รองรับ AI response จาก hotel data / FAQ / rule / roomtype
- รองรับ LINE session
- รองรับ chat history
- รองรับการขยายเป็น booking engine ในอนาคต
- รองรับ audit/debug เบื้องต้น
- มี timestamp ทุก table สำคัญ
- ใช้ UUID เป็น primary key
- ใช้ soft delete เฉพาะ table ที่จำเป็น
- มี index สำหรับ field ที่ query บ่อย

---

# 5. Tables ที่ต้องมี (แนวทางที่ควร (ชื่อ table เป็นแค่ตัวอย่างไม่ใช่ชื่อจริงๆ))

## 5.1 account

ใช้เก็บผู้ใช้ระบบหลังบ้าน

Fields ที่ควรมี:

- `id uuid primary key`
- `email text unique`
- `full_name text`
- `role text` enum: `super_admin`, `hotel_admin`
- `hotel_id uuid nullable`
- `status text` enum: `active`, `inactive`, `pending`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- super_admin อาจไม่มี `hotel_id`
- hotel_admin ต้องมี `hotel_id`
- ในอนาคตอาจแยกเป็น `account_hotel_membership` หากต้องการให้ 1 account ดูแลหลาย hotel

---

## 5.2 hotel

ใช้เก็บข้อมูลที่พัก

Fields ที่ควรมี:

- `id uuid primary key`
- `name text`
- `slug text unique`
- `address text`
- `description text`
- `contact_phone text`
- `contact_email text`
- `line_oa_id text`
- `facebook_url text`
- `website_url text`
- `map_url text`
- `has_webbooking boolean default false`
- `webbooking_url text nullable`
- `onboarding_completed boolean default false`
- `status text` enum: `active`, `inactive`, `setup_required`
- `admin_verify_code text unique`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- `has_webbooking` ใช้กำหนด AI closing flow
- ถ้ามี webbooking ให้ AI พยายามส่งลูกค้าไปจองผ่าน URL
- ถ้าไม่มี webbooking ให้ AI เก็บ lead และส่งต่อ admin
- `admin_verify_code` ใช้ให้ hotel admin ยืนยันตัวใน LINE

---

## 5.3 roomtype

ใช้เก็บประเภทห้องพัก

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `name text`
- `description text`
- `mood_description text`
- `base_price numeric`
- `bed_type text`
- `bed_size text`
- `standard_capacity int`
- `max_capacity int`
- `max_extra_beds int default 0`
- `extra_bed_price numeric default 0`
- `pet_policy text`
- `total_rooms int`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- `mood_description` ใช้ให้ AI อธิบายบรรยากาศห้องแบบขายได้มากขึ้น
- `total_rooms` ใช้ใน Starter Pack ก่อน ยังไม่ต้องทำ inventory ซับซ้อน
- ใน Pro Pack อาจแยก availability / room inventory ละเอียดขึ้น

---

## 5.4 room

ใช้เก็บห้องจริงในแต่ละ roomtype

Fields ที่ควรมี:

- `id uuid primary key`
- `roomtype_id uuid references roomtype(id)`
- `room_number text`
- `floor text nullable`
- `status text` enum: `available`, `occupied`, `maintenance`, `inactive`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- Starter Pack อาจใช้แค่จำนวนห้องใน `roomtype.total_rooms`
- แต่ยังควรมี table `room` เพื่อรองรับ Pro Pack และการจัดการห้องจริงในอนาคต

---

## 5.5 roomtype_image

ใช้เก็บรูปภาพของ roomtype

Fields ที่ควรมี:

- `id uuid primary key`
- `roomtype_id uuid references roomtype(id)`
- `image_url text`
- `storage_path text`
- `alt_text text`
- `sort_order int default 0`
- `is_cover boolean default false`
- `created_at timestamptz`

ข้อกำหนด:

- Onboarding ให้ upload รูปได้สูงสุด 5 รูปต่อ roomtype แรก
- ต้อง validate limit ที่ backend ด้วย ไม่ใช่แค่ frontend

---

## 5.6 roomtype_amenities

ใช้เก็บ amenities ของ roomtype

Fields ที่ควรมี:

- `id uuid primary key`
- `roomtype_id uuid references roomtype(id)`
- `name text`
- `created_at timestamptz`

หมายเหตุ:

- Starter Pack ใช้ text list ง่าย ๆ ก่อน
- ในอนาคตอาจ normalize เป็น `amenity_master` ได้

---

## 5.7 booking

ใช้เก็บ booking / booking lead

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `roomtype_id uuid nullable references roomtype(id)`
- `guest_name text`
- `guest_phone text`
- `guest_line_user_id text`
- `checkin_date date`
- `checkout_date date`
- `guest_count int`
- `room_count int default 1`
- `status text` enum: `lead`, `pending`, `confirmed`, `cancelled`, `rejected`, `completed`
- `source text` enum: `line_ai`, `manual_admin`, `webbooking`, `other`
- `note text`
- `ai_summary text`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- ถ้า hotel ไม่มี webbooking AI ต้องเก็บ booking lead มาที่ table นี้
- ถ้า hotel มี webbooking AI อาจสร้าง lead เบื้องต้นได้ แต่ควรพาลูกค้าไปจองที่ webbooking_url

---

## 5.8 line_session

ใช้เก็บ session ของผู้ใช้ LINE ต่อ hotel

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `line_user_id text`
- `display_name text`
- `role_in_line text` enum: `guest`, `hotel_admin`, `unknown`
- `admin_verified_at timestamptz nullable`
- `last_intent text`
- `last_seen_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Unique constraint:

- `(hotel_id, line_user_id)`

---

## 5.9 line_chat_history

ใช้เก็บประวัติแชท

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `line_session_id uuid references line_session(id)`
- `line_user_id text`
- `direction text` enum: `incoming`, `outgoing`
- `message_type text`
- `message_text text`
- `intent text`
- `ai_response_source text` เช่น `faq`, `roomtype`, `hotel_info`, `fallback`, `admin_mode`
- `raw_payload jsonb`
- `created_at timestamptz`

หมายเหตุ:

- เก็บเพื่อ debug, improve AI, และสร้าง training data ในอนาคต
- ห้ามเก็บข้อมูลอ่อนไหวเกินจำเป็น

---

## 5.10 ai_setting

ใช้เก็บ setting ของ AI ราย hotel

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id) unique`
- `assistant_name text default 'Hospiq'`
- `assistant_gender_tone text default 'female_polite'`
- `language text default 'th'`
- `tone text`
- `sale_mode_enabled boolean default true`
- `fallback_to_admin_enabled boolean default true`
- `admin_contact_message text`
- `system_prompt text`
- `created_at timestamptz`
- `updated_at timestamptz`

ข้อกำหนดสำคัญ:

- AI ต้องตอบเป็นผู้หญิงอย่างสม่ำเสมอ เช่น ใช้ “ค่ะ”
- ห้ามสลับไปตอบ “ครับ”
- ต้องตอบตรงคำถาม
- ต้องไม่เป็น FAQ bot แข็ง ๆ
- ต้องเป็น sale assistant ที่ช่วยแนะนำและปิดการจองอย่างนุ่มนวล

---

## 5.11 ai_faq

ใช้เก็บ FAQ ของแต่ละ hotel

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `question text`
- `answer text`
- `category text`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- ใช้เป็น knowledge base เบื้องต้น
- ต้อง query ตาม `hotel_id` เสมอ
- สามารถนำไปเข้า RAG architecture ในอนาคต

---

## 5.12 hotel_image

แนะนำเพิ่มสำหรับ banner / showcase

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `image_type text` enum: `banner`, `showcase`, `gallery`
- `image_url text`
- `storage_path text`
- `alt_text text`
- `sort_order int default 0`
- `created_at timestamptz`

---

## 5.13 line_config

แนะนำเพิ่มเพื่อเก็บ LINE config แยกจาก hotel

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id) unique`
- `channel_id text`
- `channel_secret text`
- `channel_access_token text`
- `webhook_url text`
- `is_configured boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

หมายเหตุ:

- field ที่เป็น secret ต้องพิจารณา encryption หรือเก็บใน secret manager ถ้า production จริง
- ห้าม expose token ออก frontend

---

## 5.14 promotion

แนะนำเพิ่มเพราะ dashboard มีจัดการโปรโมชั่น

Fields ที่ควรมี:

- `id uuid primary key`
- `hotel_id uuid references hotel(id)`
- `title text`
- `description text`
- `start_date date`
- `end_date date`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`


---

# 7. API Endpoint Design

## 7.1 หลักการออกแบบ API

- API ต้องอยู่ใน `app/api/.../route.ts`
- Validate input ด้วย Zod ทุก endpoint
- ตรวจ auth และ role ทุก endpoint
- ทุก endpoint ต้อง scope ด้วย `hotel_id`
- แยก service layer ออกจาก route handler
- ห้าม query database กระจัดกระจายใน component
- response format ต้อง consistent
- error message ต้อง debug ได้ แต่ไม่ leak secret

## 7.2 API Endpoint ที่ต้องวาง (แค่แนวทางเท่านั้น)

### Auth / Account

```txt
GET    /api/me
POST   /api/admin/accounts
PATCH  /api/admin/accounts/:id
```

### Hotel

```txt
GET    /api/hotel/current
PATCH  /api/hotel/current
POST   /api/hotel/onboarding
PATCH  /api/hotel/onboarding/step
```

### Roomtype

```txt
GET    /api/roomtypes
POST   /api/roomtypes
GET    /api/roomtypes/:id
PATCH  /api/roomtypes/:id
DELETE /api/roomtypes/:id
```

### Roomtype Images

```txt
POST   /api/roomtypes/:id/images
DELETE /api/roomtypes/:id/images/:imageId
PATCH  /api/roomtypes/:id/images/reorder
```

### Amenities

```txt
POST   /api/roomtypes/:id/amenities
PATCH  /api/roomtypes/:id/amenities
```

### Booking

```txt
GET    /api/bookings
POST   /api/bookings
PATCH  /api/bookings/:id/status
PATCH  /api/bookings/:id
```

### Hotel Images

```txt
GET    /api/hotel/images
POST   /api/hotel/images
DELETE /api/hotel/images/:id
PATCH  /api/hotel/images/reorder
```

### AI Setting / FAQ

```txt
GET    /api/ai/settings
PATCH  /api/ai/settings
GET    /api/ai/faqs
POST   /api/ai/faqs
PATCH  /api/ai/faqs/:id
DELETE /api/ai/faqs/:id
```

### LINE

```txt
POST   /api/line/webhook/[hotelId]
GET    /api/line/webhook-url
GET    /api/line/config
PATCH  /api/line/config
POST   /api/line/admin/verify
```

---

# 8. LINE Webhook Requirement

## 8.1 Webhook URL

ระบบต้อง generate webhook URL ให้แต่ละ hotel เช่น

```txt
https://your-domain.com/api/line/webhook/{hotelId}
```

หรือถ้าต้องการความปลอดภัยมากขึ้น:

```txt
https://your-domain.com/api/line/webhook/{hotelId}?token={webhookSecret}
```

## 8.2 LINE Webhook Flow

เมื่อ LINE ส่ง message เข้ามา:

1. รับ request ที่ `/api/line/webhook/[hotelId]`
2. ตรวจว่า hotel มีอยู่จริง
3. โหลด line_config ของ hotel
4. Verify signature จาก LINE channel secret
5. Parse event
6. หา หรือ create `line_session`
7. ตรวจว่า user เป็น guest หรือ hotel_admin
8. เก็บ incoming message ลง `line_chat_history`
9. ส่ง message เข้า AI Orchestrator
10. AI Orchestrator โหลดข้อมูลที่เกี่ยวข้อง:
   - hotel info
   - roomtype
   - amenities
   - promotion
   - FAQ
   - AI setting
   - booking flow state ถ้ามี
11. Generate response
12. เก็บ outgoing message ลง `line_chat_history`
13. Reply กลับ LINE

---

# 9. LINE Admin Setup Flow

## 9.1 Concept

แต่ละ hotel ต้องมี `admin_verify_code` ที่ unique เช่น:

```txt
HOSPIQ-8F3K2A
```

Hotel admin สามารถพิมพ์ใน LINE OA เช่น:

```txt
ยืนยันแอดมิน HOSPIQ-8F3K2A
```

หรือ

```txt
admin HOSPIQ-8F3K2A
```

## 9.2 Flow

1. Hotel admin เปิด LINE OA ของโรงแรม
2. ส่งรหัส admin verify code
3. Webhook ตรวจ message intent ว่าเป็น admin verification
4. ตรวจ code กับ hotel ปัจจุบัน
5. ถ้าถูกต้อง:
   - update `line_session.role_in_line = hotel_admin`
   - set `admin_verified_at = now()`
   - ตอบกลับว่าเชื่อมต่อ admin สำเร็จ
6. หลังจากนั้นถ้า admin คุยกับ Hospiq:
   - AI ต้องเข้าใจว่าเป็น human admin
   - ตอบในโหมด admin assistant ไม่ใช่ guest sales assistant

## 9.3 Admin Mode ตัวอย่าง ( Plan ในอนาคตตอนนี้ Admin รอรับข้อมูล Handoff อย่างเดียว)

Admin ถาม:

```txt
วันนี้มีลูกค้าสนใจจองกี่คน
```

AI ควรตอบจาก booking lead / chat history ของ hotel นั้นเท่านั้น

Admin ถาม:

```txt
สรุปแชทลูกค้าวันนี้ให้หน่อย
```

AI ควร summarize เฉพาะข้อมูลของ hotel ตัวเอง

---

# 10. AI Library Integration

## 10.1 งานที่ต้องทำ

ให้ duplicate AI library จาก rentroom แล้ว refactor เป็น module ใหม่สำหรับ Hospiq Starter Pack

ตัวอย่าง path ที่ควรวาง:

```txt
src/lib/ai/
  orchestrator.ts
  prompt-builder.ts
  hotel-context.ts
  intent-detector.ts
  response-guard.ts
  tools/
    booking-tool.ts
    roomtype-tool.ts
    faq-tool.ts
    admin-tool.ts
```

## 10.2 Webbooking Flow

ถ้า `hotel.has_webbooking = true`:

AI ต้อง:

1. ตอบคำถามลูกค้า
2. แนะนำ roomtype ที่เหมาะ
3. ถ้าลูกค้าสนใจ ให้ส่ง `webbooking_url`
4. ชวนให้ลูกค้าจองผ่านลิงก์
5. อาจเก็บ lead เบื้องต้นได้ถ้าลูกค้ายังลังเล

ตัวอย่าง:

```txt
ห้อง Deluxe เหมาะกับลูกค้า 2 ท่านค่ะ ราคาเริ่มต้น 1,500 บาท/คืน  
สามารถดูวันว่างและจองโดยตรงได้ที่ลิงก์นี้นะคะ: {webbooking_url}
```

## 10.3 Non-Webbooking Flow

ถ้า `hotel.has_webbooking = false`:

AI ต้อง:

1. ตอบคำถามลูกค้า
2. แนะนำ roomtype
3. เก็บข้อมูล booking lead:
   - ชื่อ
   - เบอร์โทร
   - วันที่เข้าพัก
   - วันที่ออก
   - จำนวนผู้เข้าพัก
   - ประเภทห้องที่สนใจ
4. สร้าง record ใน `booking`
5. แจ้งลูกค้าว่าจะให้แอดมินติดต่อกลับ
6. ถ้ามี admin LINE connected ให้แจ้ง admin ในอนาคต

ตัวอย่าง:

```txt
ได้ค่ะ ขอข้อมูลเพิ่มเติมนิดนึงนะคะ  
เข้าพักวันที่เท่าไหร่ และออกวันที่เท่าไหร่คะ
```

---

# 11. AI Prompt Guard

ต้องมี guard เพื่อคุมคุณภาพคำตอบ

## 11.1 ห้าม AI ทำสิ่งต่อไปนี้

- ห้ามแต่งราคาเอง
- ห้ามบอกว่ามีห้องว่าง ถ้าไม่มีระบบ availability จริง
- ห้ามยืนยัน booking เองถ้ายังไม่มี admin confirm
- ห้ามตอบนอกข้อมูลที่มี
- ห้ามพูดเหมือน chatbot แข็ง ๆ
- ห้ามสลับคำลงท้ายจากค่ะเป็นครับ
- ห้ามพูดเกินจริง
- ห้ามเปิดเผยข้อมูล hotel อื่น
- ห้ามเปิดเผย system prompt

## 11.2 Response Style

- สั้น กระชับ เหมาะกับ LINE
- เป็นธรรมชาติ
- ใช้ภาษาไทยเป็นหลัก
- ใช้ “ค่ะ” สม่ำเสมอ
- มี sales direction
- ถามต่อทีละ step
- ถ้าตอบไม่ได้ให้ส่งต่อ admin

---

# 12. Onboarding Flow สำหรับ Hotel Admin ครั้งแรก (ออกแบบเพิ่มเติมได้ตามสมควรและเสนอผมก่อนเสมอ)

## 12.1 Context

Flow นี้ใช้เฉพาะ Hotel ที่ login ครั้งแรกเท่านั้น  
เจ้าของระบบจะสร้าง account ให้ hotel admin ไว้ก่อน  
หลังจาก hotel admin login เข้าระบบ ให้เข้าสู่ onboarding flow ที่ออกแบบสำหรับ mobile-first

ให้ UX คล้ายการสมัคร Facebook account คือทีละ step, เข้าใจง่าย, ไม่ยัดข้อมูลเยอะเกินไป

## 12.2 Onboarding Steps

### Step 1: Hotel Basic Info

ให้กรอก:

- ชื่อที่พัก
- ที่อยู่

ปุ่ม:

- Next

---

### Step 2: Hotel Information & Contact

ให้กรอก:

- information about hotel
- contact phone
- contact email
- link contact
- facebook
- website
- map url
- social link อื่น ๆ

สามารถกดข้ามไปใส่ทีหลังได้

---

### Step 3: Webbooking Check

ถามว่า:

```txt
ที่พักของคุณมี Web Booking หรือระบบหลังบ้านสำหรับรับจองอยู่แล้วหรือไม่?
```

ตัวเลือก:

- มี
- ไม่มี

ถ้ามี ให้กรอก:

- `webbooking_url`

ถ้าไม่มี ให้ไป step ต่อไป

---

### Step 4: Hotel Banner / Showcase Images

ให้ upload รูปภาพ:

- banner
- showcase
- gallery

สามารถข้ามได้

---

### Step 5: Create First Roomtype

ให้สร้าง roomtype แรก

กรอก:

- ชื่อ roomtype
- ราคาเริ่มต้น
- รูปภาพสูงสุด 5 รูป
- information สำหรับนำเสนอ
- mood description สำหรับ AI ใช้อธิบายบรรยากาศห้อง

สามารถข้ามได้

ถ้าข้าม step นี้ ให้ข้าม step amenities ด้วย

---

### Step 6: Roomtype Detail

กรอก:

- ขนาดเตียง
- ประเภทเตียง
- คนเข้าพักหลัก
- คนเข้าพักสูงสุด
- เตียงเสริมสูงสุด
- ราคาเตียงเสริม
- การรองรับสัตว์เลี้ยง
- จำนวนห้องที่มี

---

### Step 7: Roomtype Amenities

ให้เลือก amenities จาก quick pick และเพิ่มเองได้

Quick pick ตัวอย่าง:

- Wi-Fi
- แอร์
- ทีวี
- ตู้เย็น
- เครื่องทำน้ำอุ่น
- ไดร์เป่าผม
- ผ้าเช็ดตัว
- ระเบียง
- วิวภูเขา
- วิวทะเล
- ที่จอดรถ
- อาหารเช้า
- อ่างอาบน้ำ
- โต๊ะทำงาน

ถ้าไม่มีอะไรเพิ่มเติม ให้แนะนำ amenities พื้นฐานได้

---

### Step 8: LINE Hospiq Setup

หน้านี้ต้องแสดง:

- generated webhook URL
- ช่องกรอก LINE config:
  - channel id
  - channel secret
  - channel access token
- คำแนะนำการนำ webhook URL ไปใส่ใน LINE Developers
- ปุ่ม test connection ถ้าทำได้
- ปุ่ม skip

ถ้ากด skip ต้องเตือนว่า:

```txt
ถ้ายังตั้งค่า LINE ไม่เสร็จ Hospiq AI จะยังไม่สามารถตอบแชทลูกค้าได้
```

หลังจบ step นี้ ให้ไปหน้า dashboard

---

# 13. Dashboard Requirement

## 13.1 Mobile-first Dashboard

Dashboard ต้องออกแบบสำหรับ mobile-first ก่อน

มี bottom navbar และมีปุ่ม `+` ตรงกลางสำหรับเพิ่มการจอง

## 13.2 Bottom Navbar

Tab ที่ควรมี:

1. Dashboard
2. Room
3. Booking
4. Promotion
5. Settings

ปุ่มกลาง:

- `+` เพิ่มการจอง

## 13.3 Dashboard Modules

Dashboard ต้องมีเมนูหรือ section สำหรับ:

- แสดงภาพรวมข้อมูลต่าง ๆ
- จัดการห้องพัก
- จัดการการจอง
- จัดการโปรโมชั่น
- จัดการรูปภาพ banner / showcase
- จัดการ LINE config setting
- จัดการข้อมูลที่พัก
- จัดการ AI FAQ
- จัดการ AI setting

## 13.4 Dashboard Data Example

สิ่งที่ควรแสดงในอนาคต:

- จำนวน booking lead วันนี้
- จำนวนแชท LINE วันนี้
- roomtype ทั้งหมด
- promotion ที่ active
- LINE setup status
- onboarding completion status
- recent booking leads
- recent customer messages

---

# 14. Frontend Structure ที่ต้องวางไว้ก่อน

ยังไม่ต้องเริ่มทำ frontend เต็มระบบ แต่ต้องวาง structure ให้พร้อมเชื่อม backend

```txt
src/app/
  dashboard/
    page.tsx
    roomtypes/
    bookings/
    promotions/
    settings/
      hotel/
      line/
      ai/
  onboarding/
    page.tsx

src/components/
  dashboard/
  onboarding/
  roomtypes/
  bookings/
  shared/

src/features/
  hotel/
  roomtype/
  booking/
  line/
  ai/
  onboarding/

src/lib/
  supabase/
  auth/
  ai/
  line/
  validators/
  services/
  repositories/
```

## 14.1 UI / Style Direction

- Mobile-first
- Clean
- Modern SaaS
- ใช้งานง่ายสำหรับเจ้าของที่พักที่ไม่ถนัดเทคโนโลยี
- ห้ามใช้ emoji พร่ำเพรื่อใน UI
- ถ้าต้องการ icon ให้ใช้ SVG icon หรือ icon library
- ใช้ Tailwind CSS
- ปุ่มชัดเจน
- Form ควรแบ่งเป็น step
- ลด cognitive load
- รองรับ responsive desktop ในอนาคต

---

# 15. Backend Structure ที่ต้องใช้

```txt
src/server/
  auth/
    get-current-user.ts
    require-role.ts
    require-hotel-access.ts

  repositories/
    hotel.repository.ts
    account.repository.ts
    roomtype.repository.ts
    booking.repository.ts
    line.repository.ts
    ai.repository.ts

  services/
    hotel.service.ts
    onboarding.service.ts
    roomtype.service.ts
    booking.service.ts
    line-webhook.service.ts
    ai-orchestrator.service.ts

  validators/
    hotel.schema.ts
    roomtype.schema.ts
    booking.schema.ts
    line.schema.ts
    ai.schema.ts

src/lib/
  supabase/
    server.ts
    admin.ts
  line/
    verify-signature.ts
    line-client.ts
  ai/
    orchestrator.ts
    prompt-builder.ts
    hotel-context.ts
    intent-detector.ts
    response-guard.ts
```

---

# 16. ตัวอย่าง Code Pattern ที่ต้องใช้

## 16.1 API Route Pattern

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { roomtypeService } from "@/server/services/roomtype.service";

const createRoomtypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  moodDescription: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  bedType: z.string().optional(),
  bedSize: z.string().optional(),
  standardCapacity: z.number().int().positive().optional(),
  maxCapacity: z.number().int().positive().optional(),
  totalRooms: z.number().int().nonnegative().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireHotelAccess();
    const body = await req.json();
    const payload = createRoomtypeSchema.parse(body);

    const result = await roomtypeService.createRoomtype({
      hotelId: user.hotelId,
      payload,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
```

---

## 16.2 Service Pattern

```ts
export const roomtypeService = {
  async createRoomtype(input: {
    hotelId: string;
    payload: CreateRoomtypeInput;
  }) {
    return roomtypeRepository.create({
      hotelId: input.hotelId,
      ...input.payload,
    });
  },
};
```

---

## 16.3 Repository Pattern

```ts
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const roomtypeRepository = {
  async create(data: {
    hotelId: string;
    name: string;
    description?: string;
    moodDescription?: string;
    basePrice?: number;
    totalRooms?: number;
  }) {
    const supabase = createSupabaseAdminClient();

    const { data: roomtype, error } = await supabase
      .from("roomtype")
      .insert({
        hotel_id: data.hotelId,
        name: data.name,
        description: data.description,
        mood_description: data.moodDescription,
        base_price: data.basePrice,
        total_rooms: data.totalRooms ?? 0,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return roomtype;
  },
};
```

---

## 16.4 LINE Webhook Pattern

```ts
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await context.params;
  const rawBody = await req.text();

  const result = await lineWebhookService.handleWebhook({
    hotelId,
    rawBody,
    headers: req.headers,
  });

  return NextResponse.json(result);
}
```

---

## 16.5 AI Orchestrator Pattern

```ts
export async function generateHospiqReply(input: {
  hotelId: string;
  lineUserId: string;
  message: string;
}) {
  const context = await getHotelAIContext(input.hotelId);
  const intent = await detectIntent(input.message);

  const prompt = buildHotelPrompt({
    context,
    intent,
    userMessage: input.message,
  });

  const rawResponse = await callAIModel(prompt);

  const guardedResponse = enforceResponseGuard({
    response: rawResponse,
    tone: context.aiSetting.assistant_gender_tone,
  });

  return {
    reply: guardedResponse,
    intent,
  };
}
```

---

# 17. Skill ที่ Agent ควรใช้เพื่อประหยัด Usage

Agent ต้องทำงานแบบประหยัด usage แต่ได้ผลลัพธ์ดี โดยใช้แนวทางต่อไปนี้

## 17.1 Inspect Before Edit

ก่อนแก้ไขไฟล์ใด ๆ ต้องอ่านไฟล์ที่เกี่ยวข้องก่อนเสมอ  
ห้ามเดาโครงสร้าง project

## 17.2 Small Patch First

แก้ทีละส่วนเล็ก ๆ ไม่ rewrite ทั้ง project โดยไม่จำเป็น

## 17.3 Architecture First

ก่อนเขียน code ให้สร้างแผน:

- database
- route
- service
- repository
- validator
- AI library
- test case

## 17.4 Reuse Existing Patterns

ถ้า project เดิมมี pattern ที่ดี ให้ reuse  
ถ้า pattern เดิม spaghetti หรือ hardcode ให้ refactor อย่างระมัดระวัง

## 17.5 Contract-first Development

กำหนด interface / schema / API contract ก่อน implement

## 17.6 Backend-first

ให้ทำ backend ก่อน แล้วค่อยวาง frontend connection  
ห้ามเริ่มจาก UI สวย ๆ โดยที่ data flow ยังไม่ชัด

## 17.7 Test Critical Flow

ต้องมี test case สำหรับ flow สำคัญ:

- hotel admin onboarding
- create roomtype
- line webhook
- admin verify code
- AI response จาก roomtype
- AI response เมื่อไม่มีข้อมูล
- booking lead creation
- webbooking flow
- non-webbooking flow

---

# 18. Implementation Plan ภาษาไทย

## Phase 1: Inspect Project

1. อ่านโครงสร้าง project ปัจจุบัน
2. อ่านไฟล์ Supabase / database ที่เกี่ยวข้องกับ rentroom
3. อ่าน AI library เดิม
4. อ่าน `hotel-ai-rag-architecture.md`
5. สรุปว่าอะไรควร reuse, อะไรควร refactor, อะไรไม่ควรนำมาใช้

Output ที่ต้องได้:

- สรุป current architecture
- สรุป database เดิม
- สรุป AI library เดิม
- รายการ file ที่เกี่ยวข้อง

---

## Phase 2: Design Starter Pack Architecture

1. ออกแบบ database schema ใหม่
2. ออกแบบ API endpoint
3. ออกแบบ service/repository layer
4. ออกแบบ LINE webhook flow
5. ออกแบบ AI orchestrator flow
6. ออกแบบ onboarding flow
7. ออกแบบ dashboard data contract

Output ที่ต้องได้:

- migration SQL
- folder structure
- API contract
- data flow diagram แบบข้อความ
- implementation checklist

---

## Phase 3: Database Migration

1. สร้าง migration SQL
2. สร้าง table หลัก
3. สร้าง index
4. สร้าง FK
5. เตรียม RLS policy เบื้องต้น
6. สร้าง seed data สำหรับ dev

Output ที่ต้องได้:

- migration file
- seed file
- SQL test query

---

## Phase 4: Backend Foundation

1. สร้าง Supabase server/admin client
2. สร้าง auth helper
3. สร้าง role guard
4. สร้าง hotel access guard
5. สร้าง response helper
6. สร้าง error helper

Output ที่ต้องได้:

- auth utilities
- backend helpers
- consistent API response

---

## Phase 5: Core Services

Implement service/repository สำหรับ:

1. hotel
2. onboarding
3. roomtype
4. booking
5. ai setting
6. ai faq
7. line config
8. line session
9. line chat history

Output ที่ต้องได้:

- repository layer
- service layer
- validation schema

---

## Phase 6: API Endpoints

Implement endpoints หลัก:

1. `/api/me`
2. `/api/hotel/current`
3. `/api/hotel/onboarding`
4. `/api/roomtypes`
5. `/api/bookings`
6. `/api/ai/settings`
7. `/api/ai/faqs`
8. `/api/line/config`
9. `/api/line/webhook/[hotelId]`

Output ที่ต้องได้:

- route handlers
- validation
- role checking
- hotel scoping

---

## Phase 7: AI Library Refactor

1. Duplicate AI library จาก rentroom
2. แยก prompt builder
3. แยก hotel context loader
4. แยก intent detector
5. แยก response guard
6. เพิ่ม webbooking / non-webbooking behavior
7. เพิ่ม female polite tone guard
8. เพิ่ม fallback to admin
9. เพิ่ม admin mode

Output ที่ต้องได้:

- `src/lib/ai/*`
- AI orchestrator
- test prompt
- response examples

---

## Phase 8: LINE Integration

1. สร้าง webhook endpoint
2. verify LINE signature
3. handle message event
4. create/update line_session
5. save chat history
6. call AI orchestrator
7. reply message
8. support admin verify code

Output ที่ต้องได้:

- LINE webhook working
- chat history saved
- guest/admin mode separated

---

## Phase 9: Frontend Contract Preparation

ยังไม่ต้องทำ UI เต็มระบบ แต่ต้องเตรียม:

1. route structure
2. dashboard data contract
3. onboarding data contract
4. form schema
5. API client function
6. types

Output ที่ต้องได้:

- frontend folder structure
- types
- client API wrapper
- TODO checklist สำหรับ UI

---

## Phase 10: Testing & Debug

1. ทดสอบ migration
2. ทดสอบ role access
3. ทดสอบ onboarding
4. ทดสอบ create roomtype
5. ทดสอบ webhook
6. ทดสอบ admin verify
7. ทดสอบ AI response
8. ทดสอบ booking lead creation

Output ที่ต้องได้:

- test checklist
- manual test case
- known issues
- next step suggestion

---

# 19. Test Case ที่ต้องมี

## 19.1 Role Test

- super_admin เห็น hotel ทั้งหมด
- hotel_admin เห็นเฉพาะ hotel ตัวเอง
- hotel_admin ห้ามแก้ hotel อื่น
- unauthenticated user เข้า API ไม่ได้

## 19.2 Onboarding Test

- login ครั้งแรกแล้วไป onboarding
- กรอกชื่อที่พักและที่อยู่สำเร็จ
- skip contact ได้
- เลือกมี webbooking แล้วบันทึก URL ได้
- เลือกไม่มี webbooking แล้วไปต่อได้
- skip roomtype ได้
- ถ้า skip roomtype ต้อง skip amenities
- line setup skip ได้แต่ต้องขึ้น warning
- onboarding complete แล้วไป dashboard

## 19.3 Roomtype Test

- สร้าง roomtype ได้
- upload รูปได้ไม่เกิน 5 รูป
- เพิ่ม amenities ได้
- hotel_admin แก้ roomtype ของ hotel อื่นไม่ได้

## 19.4 LINE Test

- webhook รับ message ได้
- verify signature ได้
- create line_session ได้
- save incoming/outgoing chat ได้
- admin verify code ถูกต้องแล้วเปลี่ยนเป็น hotel_admin
- admin verify code ผิดต้อง reject

## 19.5 AI Test

- ถามราคาห้องแล้วตอบจาก roomtype จริง
- ถามห้องแพง/ถูกต่างกันยังไงแล้วเปรียบเทียบจากข้อมูลจริง
- ถาม policy ที่ไม่มีข้อมูลแล้วไม่มั่ว
- ถ้า hotel มี webbooking ต้องส่งลิงก์จอง
- ถ้า hotel ไม่มี webbooking ต้องเก็บ lead
- AI ต้องใช้ “ค่ะ” ไม่ใช้ “ครับ”
- AI ต้องไม่ตอบยาวเกินไป
- AI ต้องไม่เปิดเผยข้อมูล hotel อื่น

---

# 20. Expected Output จาก Agent

หลังทำงาน Agent ต้องส่งผลลัพธ์เป็นภาษาไทย โดยมีหัวข้อ:

1. สรุปสิ่งที่ตรวจพบจาก rentroom
2. Architecture ที่ออกแบบสำหรับ Starter Pack
3. Database schema ที่สร้าง/แก้ไข
4. API endpoints ที่สร้าง
5. AI library ที่ duplicate/refactor
6. LINE webhook flow
7. Onboarding flow
8. Backend structure
9. Frontend connection plan
10. Test case ที่เพิ่ม
11. สิ่งที่ยังไม่ได้ทำ
12. Next steps ที่แนะนำ

---

# 21. Definition of Done

งานนี้ถือว่าเสร็จเมื่อ:

- มี database schema สำหรับ Starter Pack
- มี migration SQL ที่รันได้
- มี backend structure ชัดเจน
- มี API endpoint หลัก
- มี LINE webhook endpoint
- มี AI orchestrator structure
- มี hotel context loader
- มี admin verify code flow
- มี onboarding backend flow
- มี roomtype / booking / ai setting / faq service
- มี test case หรือ manual test checklist
- โครงสร้างพร้อมต่อ frontend
- ระบบแยก hotel ด้วย `hotel_id` อย่างถูกต้อง
- ไม่มี hardcode hotel เดียวแบบแก้ต่อยาก
- โค้ดไม่ spaghetti
- อธิบายสิ่งที่ทำเป็นภาษาไทยชัดเจน

---

# 22. ข้อควรระวัง

- อย่า build ใหญ่เกิน Starter Pack
- อย่าทำ Hotel OS เต็มระบบในรอบแรก
- อย่าเริ่ม frontend ก่อน backend ชัด
- อย่า copy database rentroom มาทั้งก้อน
- อย่า hardcode hotel id
- อย่าให้ AI ตอบมั่ว
- อย่าให้ AI ยืนยันการจองเองถ้ายังไม่มีระบบ confirm
- อย่า expose LINE token
- อย่าให้ hotel_admin เห็นข้อมูล hotel อื่น
- อย่าใช้ service role ฝั่ง client
- อย่าทำ logic กระจายใน route handler
- อย่าทำ prompt AI รวมทุกอย่างเป็นไฟล์เดียวจน maintain ยาก

---

# 23. คำสั่งเริ่มงานสำหรับ Agent

เริ่มจากอ่าน project ปัจจุบันและไฟล์ที่เกี่ยวข้องก่อน โดยเฉพาะ:

- Supabase database schema เดิม
- AI library เดิมของ rentroom
- LINE integration เดิม ถ้ามี
- `hotel-ai-rag-architecture.md`
- โครงสร้าง API เดิม
- โครงสร้าง auth เดิม

จากนั้นให้สรุปแผนก่อนลงมือแก้ code และเริ่ม implement ตามลำดับนี้:

1. Database schema / migration
2. Backend folder structure
3. Auth / role guard
4. Core repositories
5. Core services
6. API endpoints
7. AI library refactor
8. LINE webhook
9. Test checklist
10. Frontend connection plan

ให้ทำงานแบบเป็นขั้นตอน ตรวจสอบได้ และรายงานผลเป็นภาษาไทย
