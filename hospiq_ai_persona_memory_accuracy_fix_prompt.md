# HOSPIQ AI Flow Refactor Prompt — Persona, Memory, Accuracy Fix

## Context

โปรเจกต์นี้คือ HOSPIQ AI assistant สำหรับตอบแชทลูกค้าโรงแรมผ่าน LINE / chat interface  
ตอนนี้โค้ดหลักอยู่ที่:

```txt
lib/ai/
  __tests__/
  providers/
  assistant-profile.ts
  guardrails.ts
  handoff.ts
  hotel-context.ts
  intent-router.ts
  language.ts
  line-concierge.ts
  provider.ts
  reply-composer.ts
```

ระบบเดิมเริ่มมีปัญหาหลังจาก optimize mood and tone:
- ต้องการ persona เป็นพนักงานหญิง แต่บางครั้ง AI ยังตอบ “ครับ / ผม”
- ตอบไม่ตรงคำถาม
- เดาข้อมูลวันเข้าพักเอง
- จำ context ผิด
- เสนอห้อง/availability โดยไม่มีข้อมูลจริง
- แปะลิงก์เร็วเกินไป
- ทำตัวเหมือน FAQ bot มากกว่า sales assistant

เป้าหมายคือ refactor เฉพาะส่วน AI flow ให้แม่นขึ้น scalable ขึ้น โดยไม่ทำ flow เดิมพัง

---

## Main Objective

ปรับ HOSPIQ ให้เป็น AI Sales Assistant ผู้หญิงที่:
1. ตอบด้วย persona ผู้หญิงสม่ำเสมอ
2. ใช้คำลงท้าย “ค่ะ / นะคะ” เท่านั้น
3. ห้ามใช้ “ครับ / ผม” ในคำตอบของ HOSPIQ
4. ตอบให้ตรง intent ของลูกค้า
5. ไม่เดาข้อมูลวันที่ จำนวนคน ราคา ห้องว่าง หรือข้อมูลที่ไม่มี
6. จำ context จาก conversation ได้ถูกต้อง
7. ไม่เอาค่า default วันที่/จำนวนคนมาใช้เป็นข้อมูลจริง ถ้าลูกค้ายังไม่ได้บอก
8. ช่วยแนะนำและปิด lead แบบ sales assistant
9. ไม่แปะลิงก์เร็วเกินไป
10. ไม่ rewrite ระบบใหม่ทั้งก้อน

---

## Critical Bugs From Feedback

### Bug 1: Persona ไม่คงที่

Customer:
```txt
สวัสดีครับ
```

Old HOSPIQ:
```txt
สวัสดีครับ ยินดีต้อนรับสู่ Arkkarawin ครับ
ผมคือ Hospiq ผู้ช่วยส่วนตัวของโรงแรม...
```

Problem:
- HOSPIQ ต้องเป็นพนักงานหญิง
- ไม่ควรใช้ “ครับ”
- ไม่ควรใช้ “ผม”
- ถึงลูกค้าจะพูด “ครับ” AI ก็ยังต้องตอบเป็น persona ผู้หญิง

Expected:
```txt
สวัสดีค่ะ ยินดีต้อนรับสู่ Arkkarawin นะคะ
HOSPIQ ยินดีช่วยแนะนำห้องพัก ตรวจสอบข้อมูล และประสานงานเรื่องการจองให้ค่ะ

คุณลูกค้าสนใจเข้าพักวันไหน และเข้าพักกี่ท่านคะ
```

---

### Bug 2: ลูกค้าถามห้องถูกที่สุด แต่ AI ตอบกว้างเกินไป

Customer:
```txt
ขอข้อมูลเพิ่มเติมของห้องที่ถูกที่สุดหน่อยครับ
```

Old HOSPIQ:
```txt
ราคาเริ่มต้นของห้องมีดังนี้ค่ะ
- Warmly House...
- Honeymoon House...
- Slowly House...
- Forest Hill...
จองต่อได้ที่ ...
```

Problem:
- ลูกค้าถาม “ห้องที่ถูกที่สุด”
- AI ควรตอบห้องเดียวที่ตรงคำถามก่อน
- ไม่ควร list ทุกห้องเป็นคำตอบหลัก
- ไม่ควรแปะลิงก์ทันที

Expected:
```txt
ห้องที่ราคาถูกที่สุดตอนนี้คือ Warmly House ค่ะ ราคาเริ่มต้น 2,500 บาท สำหรับ 2 ท่าน

เหมาะกับลูกค้าที่ต้องการห้องพักเริ่มต้น บรรยากาศเรียบง่าย และคุ้มค่าที่สุดค่ะ  
คุณลูกค้าต้องการเข้าพักวันไหน และเข้าพักกี่ท่านคะ เดี๋ยวช่วยดูความเหมาะสมให้ค่ะ
```

---

### Bug 3: ลูกค้าถามสิ่งอำนวยความสะดวก แต่ AI ตอบ availability มั่ว

Customer:
```txt
มีสิ่งอำนวยความสะดวกอะไรบ้าง Warmly house แล้วว่างวันไหนบ้าง
```

Old HOSPIQ:
```txt
ช่วง 2026-05-25 - 2026-05-26 สำหรับ 2 ท่าน มีตัวเลือกว่างดังนี้ค่ะ
- Warmly House: ว่าง 2...
...
```

Problem:
- ลูกค้าถาม 2 intent:
  1. amenities ของ Warmly House
  2. วันที่ว่าง
- AI ข้าม amenities
- AI เดาวัน 2026-05-25 - 2026-05-26 เอง
- AI เดาจำนวน 2 ท่านเอง
- AI บอกว่าห้องว่างทั้งที่อาจไม่มี real availability source

Expected:
```txt
Warmly House เป็นห้องเริ่มต้นของที่พักค่ะ ส่วนสิ่งอำนวยความสะดวกที่ยืนยันได้จากข้อมูลตอนนี้มีดังนี้ค่ะ:
- [ใส่ amenities จาก hotel-context เท่านั้น]

ส่วนเรื่องวันว่าง รบกวนแจ้งวันที่ต้องการเข้าพักและวันที่เช็กเอาต์ก่อนนะคะ เดี๋ยวช่วยตรวจสอบให้ค่ะ
```

ถ้าไม่มี amenities ใน data:
```txt
ตอนนี้ข้อมูลสิ่งอำนวยความสะดวกของ Warmly House ในระบบยังไม่ครบค่ะ เดี๋ยวสามารถประสานทีมงานให้ตรวจสอบเพิ่มเติมได้ค่ะ

ส่วนเรื่องวันว่าง รบกวนแจ้งวันที่เข้าพักและวันที่เช็กเอาต์ก่อนนะคะ
```

---

### Bug 4: ลูกค้าสนใจห้อง แต่ AI ใช้ข้อมูลวันที่เก่าหรือ default เอง

Customer:
```txt
สนใจ Warmly house
```

Old HOSPIQ:
```txt
ข้อมูลจองที่จำไว้: 2026-05-25 - 2026-05-26 สำหรับ 2 ท่าน
จองต่อได้ที่...
```

Problem:
- ลูกค้ายังไม่ได้ยืนยันวันเข้าพักจริงในบริบทนี้
- AI ไม่ควร assume วันที่และจำนวนคน
- AI ควรถามข้อมูลที่ขาด

Expected:
```txt
ได้เลยค่ะ Warmly House เป็นตัวเลือกที่เหมาะกับลูกค้าที่ต้องการห้องพักราคาเริ่มต้นและคุ้มค่าค่ะ

รบกวนแจ้งวันที่เข้าพัก วันที่เช็กเอาต์ และจำนวนผู้เข้าพักได้ไหมคะ เดี๋ยวช่วยดูข้อมูลให้ต่อค่ะ
```

---

### Bug 5: ลูกค้าให้วันที่ใหม่ แต่ AI ยังย้อนใช้วันที่เดิม

Customer:
```txt
เข้าพักพรุ่งนี้ออกวันที่30เดือนหน้าครับ ขอเป็นห้อง warmly house
```

Old HOSPIQ:
```txt
ช่วง 2026-05-25 - 2026-05-26 มีตัวเลือกว่างดังนี้ค่ะ
...
```

Problem:
- AI ไม่ update memory/context
- AI ignore วันที่ใหม่
- AI แสดงวันที่เก่าหรือ default
- AI เสนอทุกห้อง ทั้งที่ลูกค้าระบุ Warmly House แล้ว
- AI ยืนยัน availability โดยไม่มีหลักฐาน

Expected:
```txt
รับทราบค่ะ คุณลูกค้าสนใจ Warmly House เข้าพักพรุ่งนี้ และเช็กเอาต์วันที่ 30 เดือนหน้าใช่ไหมคะ

ขออนุญาตยืนยันจำนวนผู้เข้าพักกี่ท่านคะ แล้วเดี๋ยวช่วยตรวจสอบห้องว่างให้ค่ะ
```

ถ้าระบบ parse วันที่ได้ไม่มั่นใจ:
```txt
รับทราบค่ะ คุณลูกค้าสนใจ Warmly House โดยต้องการเข้าพักพรุ่งนี้ และเช็กเอาต์วันที่ 30 เดือนหน้าใช่ไหมคะ

เพื่อความถูกต้อง รบกวนยืนยันวันที่เข้าพักเป็นรูปแบบวัน/เดือนให้อีกครั้งได้ไหมคะ และเข้าพักกี่ท่านคะ
```

---

## Required Fix Areas

ให้แก้หรือเพิ่ม logic โดยใช้โครงสร้างไฟล์เดิมให้มากที่สุด

---

# 1. `assistant-profile.ts` — Persona Lock

เพิ่ม persona rule ให้ชัดเจนและแรงขึ้น

```md
HOSPIQ persona:
- HOSPIQ is a female hotel assistant.
- Always speak as a female staff member in Thai.
- Always use polite feminine Thai particles: “ค่ะ”, “นะคะ”.
- Never use “ครับ”.
- Never refer to yourself as “ผม”.
- Use “HOSPIQ” or “แอดมิน” only when self-reference is needed.
- Do not mirror the customer’s gendered particle.
  Example: If customer says “ครับ”, HOSPIQ still replies with “ค่ะ”.
- Keep tone warm, professional, helpful, and concise.
```

Implementation requirement:
- เพิ่ม final response sanitizer เพื่อตรวจคำต้องห้าม:
  - replace “ครับ” -> “ค่ะ”
  - replace “นะครับ” -> “นะคะ”
  - replace “ผม” -> “HOSPIQ” หรือ “แอดมิน”
- ระวังอย่า replace ข้อความ quote ของลูกค้าถ้ามีการ quote โดยตรง
- ควรทำ sanitizer ที่ response final เท่านั้น ไม่ใช่แก้ raw user message

---

# 2. `guardrails.ts` — No Hallucination / No Fake Availability

เพิ่มกฎห้ามเดา:

```md
Accuracy guardrails:
- Do not invent dates.
- Do not invent guest count.
- Do not invent room availability.
- Do not invent amenities.
- Do not invent room features.
- Do not invent booking state.
- Do not treat default search params as confirmed customer data.
- If the customer has not provided check-in/check-out dates, ask for them.
- If the customer has not provided guest count, ask for it.
- If availability is not connected to a real source, never say “ว่าง”.
- Use “ช่วยตรวจสอบให้” instead of confirming availability.
```

Important:
- ถ้าระบบมี availability API จริง ให้ใช้ผลจาก API เท่านั้น
- ถ้าไม่มี API จริง หรือข้อมูลไม่แน่ใจ ให้ถามข้อมูลและบอกว่าจะตรวจสอบให้
- ห้ามสร้างวันที่ 2026-05-25 - 2026-05-26 เอง

---

# 3. `intent-router.ts` — Multi-Intent Detection

เพิ่มการ detect หลาย intent ในข้อความเดียว

ตัวอย่าง:
```txt
มีสิ่งอำนวยความสะดวกอะไรบ้าง Warmly house แล้วว่างวันไหนบ้าง
```

ควร detect:
```ts
["room_detail", "amenities_question", "availability_check"]
```

เพิ่ม intent ถ้ายังไม่มี:

```ts
export type AiIntent =
  | "greeting"
  | "room_detail"
  | "room_recommendation"
  | "amenities_question"
  | "availability_check"
  | "price_inquiry"
  | "cheapest_room"
  | "group_booking"
  | "booking_intent"
  | "handoff_required"
  | "fallback";
```

Heuristic examples:
```ts
// cheapest room
["ถูกที่สุด", "ถูกสุด", "ราคาถูก", "ประหยัดสุด"]

// amenities
["สิ่งอำนวยความสะดวก", "มีอะไรบ้าง", "facility", "amenities", "ของใช้", "อุปกรณ์"]

// availability
["ว่างไหม", "ว่างวันไหน", "มีห้องไหม", "เช็กห้อง", "เช็คห้อง"]

// room detail
["รายละเอียด", "ข้อมูลเพิ่มเติม", "สนใจ", "ห้อง", "house", "warmly", "honeymoon", "slowly", "forest"]

// date mention
["พรุ่งนี้", "วันนี้", "มะรืน", "วันที่", "เดือนหน้า", regex date patterns]
```

Rule:
- ถ้าลูกค้าถามหลายอย่าง ให้ตอบหลายส่วนตามลำดับความสำคัญ
- ห้ามทิ้งคำถามบางส่วน เช่น ถาม amenities + availability ต้องตอบ amenities ก่อน แล้วถามวันที่สำหรับ availability

---

# 4. `line-concierge.ts` — Conversation State / Memory Fix

ตรวจสอบว่ามี conversation context/memory อย่างไร  
ต้องแก้ไม่ให้ AI ใช้ default booking params เป็น confirmed customer data

เพิ่มหลักการ:

```ts
type BookingMemory = {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  adults?: number;
  children?: number;
  source: {
    roomId?: "customer" | "system_default" | "inferred";
    checkIn?: "customer" | "system_default" | "inferred";
    checkOut?: "customer" | "system_default" | "inferred";
    guests?: "customer" | "system_default" | "inferred";
  };
};
```

Rules:
- ใช้ข้อมูลเป็น confirmed ได้เฉพาะ source = "customer"
- source = "system_default" ห้ามพูดเหมือนลูกค้ายืนยันแล้ว
- source = "inferred" ต้องถามยืนยันก่อน
- ถ้าลูกค้าให้ข้อมูลใหม่ ต้อง override ข้อมูลเก่า
- ถ้าข้อมูลเก่า conflict กับข้อความล่าสุด ให้เชื่อข้อความล่าสุดก่อน
- ถ้าข้อความล่าสุดระบุห้องเดียว เช่น “Warmly House” ห้ามเสนอทุกห้องซ้ำเป็นคำตอบหลัก

ตัวอย่าง:
Customer:
```txt
สนใจ Warmly house
```

Memory should be:
```ts
roomId = "warmly-house", source.roomId = "customer"
checkIn = undefined
checkOut = undefined
guests = undefined
```

Response:
```txt
รบกวนแจ้งวันที่เข้าพัก วันที่เช็กเอาต์ และจำนวนผู้เข้าพักได้ไหมคะ
```

---

# 5. `reply-composer.ts` — Direct Answer First

ปรับ composer ให้เรียงคำตอบแบบ:

```txt
1. ตอบคำถามที่ลูกค้าถามตรง ๆ
2. ใช้ข้อมูลจาก hotel-context เท่านั้น
3. ถ้าข้อมูลไม่พอ ให้บอกไม่พอและถามต่อ
4. ถ้ามี booking intent ให้ถาม missing fields
5. ถ้าพร้อมแล้วค่อยส่ง link หรือ handoff
```

ห้าม:
```txt
ตอบกว้าง ๆ → แปะลิงก์ → จบ
```

ควร:
```txt
ตอบเฉพาะสิ่งที่ถาม → แนะนำ → ถาม missing info → ค่อยส่งต่อ/ส่งลิงก์เมื่อเหมาะสม
```

เพิ่ม response rules:
- ถ้าถาม cheapest room ให้ตอบห้องถูกที่สุดก่อน
- ถ้าถาม amenities ให้ตอบ amenities ของห้องนั้นก่อน
- ถ้าถาม availability แต่ไม่มีวันที่ ให้ถามวันที่
- ถ้าถาม availability แต่ไม่มี guest count ให้ถาม guest count
- ถ้าระบุห้องแล้ว ห้าม list ทุกห้องยกเว้นลูกค้าขอเปรียบเทียบ
- ถ้าลูกค้าขอข้อมูลห้องหนึ่ง ให้โฟกัสห้องนั้น
- ถ้าลูกค้าบอก preference ให้ filter ตัวเลือกที่ไม่ตรง

---

# 6. `hotel-context.ts` — Data Completeness Check

ตรวจสอบว่า data มีข้อมูลพอไหม เช่น:
- room name
- price
- capacity
- amenities
- style
- suitableFor
- notSuitableFor
- description
- bookingUrl

เพิ่ม type ที่ชัดเจน เช่น:

```ts
export type RoomInfo = {
  id: string;
  name: string;
  aliases: string[];
  priceFrom?: number;
  maxGuests?: number;
  amenities?: string[];
  style?: string[];
  suitableFor?: string[];
  notSuitableFor?: string[];
  description?: string;
  bookingUrl?: string;
};
```

ถ้า amenities ไม่มี:
- ห้าม AI แต่งเอง
- ให้ตอบว่า “ข้อมูลสิ่งอำนวยความสะดวกในระบบยังไม่ครบ”
- แล้วเสนอประสานทีมงาน

---

# 7. Link Behavior

แก้ rule การส่ง link:

ส่ง link ได้เมื่อ:
- ลูกค้าขอลิงก์
- ลูกค้าขอดูรูป
- ลูกค้าบอกว่าจะจอง
- ระบบมีข้อมูลครบพอ เช่น room + date + guests
- หลังจากตอบคำถามหลักแล้ว และ link ช่วยต่อ action จริง

ห้ามส่ง link เมื่อ:
- ลูกค้าถามข้อมูลทั่วไป
- ลูกค้าถามห้องถูกที่สุด แต่ยังไม่ได้ถามจอง
- ลูกค้าถาม amenities แต่ยังไม่ได้ระบุวัน/จำนวนคน
- ใช้ link เพื่อหลบการตอบ

Rule:
- ห้ามส่งลิงก์ซ้ำใน 2-3 ข้อความติดกัน ถ้าลูกค้าไม่ได้ขอ

---

# 8. Sales Assistant Behavior

เพิ่มหลักคิด:

```md
HOSPIQ should sell by helping.

For every response, ask:
1. What exactly did the customer ask?
2. What data do we have?
3. What data is missing?
4. What is the next best question that moves toward booking?
5. Should we recommend, ask, link, or handoff?
```

Examples:
- ถาม “ถูกที่สุด” → ตอบห้องถูกที่สุด → ถามวัน/จำนวนคน
- ถาม “ว่างวันไหน” → ถามวันที่/จำนวนคนถ้ายังไม่มี → ไม่เดา
- ถาม “Warmly House มีอะไรบ้าง” → ตอบเฉพาะ Warmly House → ถ้าข้อมูลไม่ครบให้บอก
- บอก “สนใจ Warmly House” → สรุปห้อง → ถามวัน/จำนวนคน
- บอก “20 คน” → high-value lead → ถามวัน/ผู้ใหญ่เด็ก/นอนกี่ห้อง/เบอร์ → handoff

---

# 9. Date Parsing Safety

แก้เรื่อง relative date เช่น:
```txt
พรุ่งนี้
วันที่ 30 เดือนหน้า
25-27 เดือนนี้
```

Rules:
- ถ้ามี current date/time ที่เชื่อถือได้ ให้ parse ได้
- ถ้าไม่มี current date/time ให้ถามยืนยัน
- ถ้า parse แล้วได้วันที่ที่ไม่มั่นใจ ให้ถามยืนยัน
- ห้าม fallback เป็นวันที่ default
- ห้ามใช้วันที่จาก previous test/default ถ้าลูกค้าไม่ได้ยืนยัน
- ถ้าลูกค้าให้วันที่ใหม่ ต้อง override วันที่เก่า

Expected:
```txt
เข้าพักพรุ่งนี้ออกวันที่30เดือนหน้าครับ ขอเป็นห้อง warmly house
```

Response:
```txt
รับทราบค่ะ คุณลูกค้าสนใจ Warmly House เข้าพักพรุ่งนี้ และเช็กเอาต์วันที่ 30 เดือนหน้าใช่ไหมคะ

ขอทราบจำนวนผู้เข้าพักกี่ท่านคะ เดี๋ยวช่วยตรวจสอบห้องว่างให้ค่ะ
```

---

# 10. Required Tests

เพิ่มหรือแก้ test ใน `lib/ai/__tests__`

## Persona Tests

Input:
```txt
สวัสดีครับ
```

Expected:
- response contains “ค่ะ” or “นะคะ”
- response does not contain “ครับ”
- response does not contain “ผม”

Input:
```txt
ขอรายละเอียดที่พักหน่อยครับ
```

Expected:
- feminine persona
- no “ครับ”
- no “ผม”

---

## Direct Answer Tests

Input:
```txt
ขอข้อมูลเพิ่มเติมของห้องที่ถูกที่สุดหน่อยครับ
```

Expected:
- mentions cheapest room first, e.g. Warmly House
- does not list all rooms as primary answer unless additional context
- asks check-in date and guest count
- does not send booking link immediately unless current logic intentionally allows after useful answer

---

## Multi-Intent Tests

Input:
```txt
มีสิ่งอำนวยความสะดวกอะไรบ้าง Warmly house แล้วว่างวันไหนบ้าง
```

Expected:
- detects amenities_question
- detects availability_check
- focuses on Warmly House
- answers amenities from hotel-context only
- does not invent availability
- asks for check-in/check-out if missing
- asks guest count if missing

---

## Memory Safety Tests

Input:
```txt
สนใจ Warmly house
```

Expected:
- remembers selected room = Warmly House
- does not invent check-in date
- does not invent check-out date
- does not invent guest count
- asks for missing booking info

Follow-up:
```txt
เข้าพักพรุ่งนี้ออกวันที่30เดือนหน้าครับ ขอเป็นห้อง warmly house
```

Expected:
- updates/overrides date info from latest customer message
- keeps selected room = Warmly House
- does not use old/default dates
- asks for guest count if missing
- does not list all rooms

---

## Link Tests

Input:
```txt
ขอข้อมูลเพิ่มเติมของห้องที่ถูกที่สุดหน่อยครับ
```

Expected:
- no link as main answer

Input:
```txt
ขอดูรูปห้อง Warmly House
```

Expected:
- may send booking/photo link if available
- still answers contextually

---

# 11. Implementation Plan

ให้ทำแบบ incremental:

1. Inspect existing `lib/ai` files
2. Identify current flow:
   - input message
   - intent routing
   - context building
   - prompt composing
   - provider call
   - reply composing
   - handoff
3. Add persona lock in `assistant-profile.ts`
4. Add final response sanitizer in `reply-composer.ts` or suitable place
5. Improve guardrails
6. Improve intent-router for multi-intent
7. Fix memory / booking state source tracking
8. Improve link behavior
9. Add tests
10. Run existing tests
11. Summarize changed files

---

# 12. Do Not Do

- Do not rewrite unrelated UI files
- Do not redesign the whole app
- Do not change provider architecture unless necessary
- Do not hardcode exact customer sentences only
- Do not create huge duplicated prompts
- Do not make the AI over-apologize
- Do not force booking link into every answer
- Do not confirm availability without real availability data
- Do not create fake amenities
- Do not make HOSPIQ mirror customer’s “ครับ”

---

# 13. Final Acceptance Criteria

The refactor is successful if:

1. HOSPIQ consistently replies as female staff:
   - Uses “ค่ะ / นะคะ”
   - Does not use “ครับ / ผม”

2. HOSPIQ answers direct questions directly:
   - Cheapest room question → cheapest room first
   - Amenities question → amenities first
   - Availability question → asks needed dates/guests if missing

3. HOSPIQ stops hallucinating:
   - No fake dates
   - No fake guest count
   - No fake availability
   - No fake amenities

4. HOSPIQ memory becomes safer:
   - Latest customer message overrides old/default info
   - Default params are not treated as customer-confirmed
   - Inferred values are confirmed before use

5. HOSPIQ behaves more like sales assistant:
   - Recommends clearly
   - Asks the next booking question
   - Escalates when needed
   - Links only when useful

6. Existing flow still works:
   - No broken imports
   - Tests pass
   - Provider still works
   - LINE concierge flow still returns response

---

## Summary of Feedback Source

The uploaded feedback shows these concrete issues:
- HOSPIQ used male persona words “ครับ / ผม” despite the desired female staff persona
- HOSPIQ answered a cheapest-room request by listing all rooms instead of focusing on the cheapest room
- HOSPIQ answered an amenities + availability question by inventing availability and skipping amenities
- HOSPIQ invented or reused dates and guest count that the customer had not confirmed
- HOSPIQ failed to update memory when the customer later gave a new date and selected Warmly House
