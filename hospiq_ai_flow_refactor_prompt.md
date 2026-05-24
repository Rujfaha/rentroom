# Task: Improve HOSPIQ AI Flow ให้เป็น Scalable Sales Assistant โดยไม่รื้อ Flow เดิม

คุณคือ senior AI product engineer + TypeScript engineer  
โปรเจกต์นี้มี AI chat assistant สำหรับโรงแรมชื่อ **HOSPIQ**  
โครงสร้างหลักอยู่ที่ `lib/ai`

โครงสร้างปัจจุบันประมาณนี้:

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

---

## Main Goal

ปรับ HOSPIQ จาก FAQ bot ให้เป็น **AI Sales Assistant สำหรับโรงแรม** โดยยังรักษา flow เดิมให้ทำงานได้

HOSPIQ ต้อง:

- ตอบตรงคำถาม
- ช่วยลูกค้าตัดสินใจ
- กล้า recommend ห้องที่เหมาะที่สุด
- ไม่ตอบกลาง ๆ ว่า “แล้วแต่ลูกค้าชอบ” อย่างเดียว
- ไม่แปะลิงก์เร็วเกินไป
- ไม่แปะลิงก์ซ้ำทุกครั้ง
- ถามวันเข้าพัก / จำนวนคน / preference เพื่อปิด lead
- คัดตัวเลือกที่ไม่ตรงกับ preference ออก
- ส่งต่อ owner/staff เมื่อเป็นเคสที่ต้องตรวจสอบจริง
- ไม่เดาข้อมูลห้องว่าง ราคา หรือ policy

---

## Important Constraints

1. ห้าม rewrite ระบบใหม่ทั้งก้อน
2. ห้ามลบ flow เดิมโดยไม่จำเป็น
3. ห้ามเปลี่ยน public interface/function signature ถ้าไม่จำเป็น
4. ถ้าต้องเปลี่ยน ให้ทำแบบ backward compatible
5. ให้แก้เฉพาะ `lib/ai` เป็นหลัก
6. ใช้โครงสร้างไฟล์เดิมให้มากที่สุด
7. เพิ่มไฟล์ใหม่ได้เฉพาะเมื่อช่วยให้ระบบ maintain ง่ายขึ้นจริง
8. ต้องมี test case เพิ่มใน `lib/ai/__tests__`
9. ห้ามทำให้ระบบตอบมั่วมากขึ้น
10. ห้าม hardcode case แคบ ๆ แบบเจอคำนี้ตอบแบบนี้เท่านั้น
11. Work incrementally: inspect → plan → implement small safe steps → test
12. Preserve existing behavior unless it conflicts with scalable AI rule architecture

---

# Existing File Responsibilities

ให้ตรวจสอบไฟล์จริงก่อน แล้วปรับตาม responsibility นี้เท่าที่เข้ากับโค้ดเดิม

---

## `assistant-profile.ts`

ใช้สำหรับ:

- persona ของ HOSPIQ
- core behavior
- sales assistant mindset
- general response principles

เพิ่มแนวคิดนี้:

```md
HOSPIQ is not a passive FAQ bot. HOSPIQ is a hotel sales assistant.

Primary goals:
1. Answer the customer directly.
2. Help the customer decide.
3. Recommend the best-fit room when possible.
4. Ask useful follow-up questions to move toward booking.
5. Collect lead information when booking intent is detected.
6. Escalate to staff when human confirmation is required.

Behavior:
- Do not only say “ขึ้นอยู่กับลูกค้าชอบ”.
- Do not send booking links too early.
- Do not use links as a replacement for answering.
- Do not reject too early if an alternative may exist.
- Do not invent availability, price, or facilities.
- If information is missing, ask the next useful question.
```

---

## `guardrails.ts`

ใช้สำหรับ:

- no hallucination
- no fake availability
- no fake price
- link behavior
- escalation safety

เพิ่ม rule:

```md
Guardrails:
- Never confirm room availability unless the system has real availability data.
- Never confirm special group pricing unless provided by staff/system.
- Never claim a room has a feature unless it exists in hotel context.
- Avoid sending the same booking link repeatedly.
- Send booking/view link only after giving a useful recommendation or when the customer asks for photos/booking.
- If uncertain, say staff can check and ask for required info.
```

---

## `hotel-context.ts`

ใช้สำหรับ:

- hotel facts
- room types
- capacity
- style
- suitableFor
- notSuitableFor
- FAQ
- policy
- links

ให้ refactor ข้อมูลห้องให้ query ได้ง่ายขึ้น เช่น:

```ts
export type RoomInfo = {
  id: string;
  name: string;
  maxGuests?: number;
  style?: string[];
  suitableFor?: string[];
  notSuitableFor?: string[];
  description?: string;
  priceNote?: string;
  bookingUrl?: string;
};
```

ตัวอย่าง:

```ts
export const rooms: RoomInfo[] = [
  {
    id: "forest-hill",
    name: "Forest Hill",
    maxGuests: 4,
    style: ["nature", "photo-friendly", "not-wooden"],
    suitableFor: [
      "customer-who-wants-beautiful-room",
      "customer-who-dislikes-wooden-house",
      "couple",
      "small-family"
    ],
    notSuitableFor: ["large-group-in-one-room"],
    description: "เหมาะกับลูกค้าที่ชอบบรรยากาศธรรมชาติ แต่ไม่อยากได้ฟีลบ้านไม้",
    bookingUrl: "https://renthotel-one.vercel.app/booking"
  }
];
```

ถ้ามีข้อมูลห้องจริงอยู่แล้ว ให้ใช้ของเดิมเป็นหลัก  
อย่าสร้างข้อมูลปลอมที่ทำให้ระบบตอบเกินจริง

---

## `intent-router.ts`

ใช้สำหรับ:

- detect intent จากข้อความลูกค้า
- return intent หลัก/หลาย intent ได้
- lightweight heuristic ก่อน ไม่ต้องใช้ AI classify ถ้าไม่จำเป็น

เพิ่ม intent เหล่านี้ถ้ายังไม่มี:

```ts
export type AiIntent =
  | "room_recommendation"
  | "group_booking"
  | "availability_check"
  | "price_inquiry"
  | "location_question"
  | "policy_question"
  | "booking_intent"
  | "handoff_required"
  | "fallback";
```

ตัวอย่าง heuristic:

```ts
// group booking
"20 คน", "15 คน", "หลายคน", "กรุ๊ป", "มาเป็นกลุ่ม", "ทัวร์", "บริษัท";

// room recommendation
"ห้องไหนดี", "แนะนำห้อง", "ที่ไหนสวยสุด", "ห้องไหนสวยสุด", "วิวดี", "ถ่ายรูปสวย", "ไม่ชอบบ้านไม้";

// availability check
"ว่างไหม", "มีห้องไหม", "25-27", "คืนนี้", "พรุ่งนี้", "เสาร์นี้";

// price inquiry
"ราคา", "เท่าไหร่", "คืนละกี่บาท", "แพงไหม";
```

หลักสำคัญ:

- ควร return ได้มากกว่า 1 intent เช่น `group_booking + availability_check`
- ต้องมี debug info เช่น matched keywords / reason
- ห้ามทำ logic ซับซ้อนเกินจน maintain ยาก

---

## `reply-composer.ts`

ใช้สำหรับ:

- compose response
- เลือก rule ตาม intent
- format คำตอบ
- ตัดสินใจว่าจะถามอะไรต่อ
- ควบคุมไม่ให้แปะลิงก์พร่ำเพรื่อ

ปรับ response flow เป็น:

```txt
ตอบตรงคำถาม → แนะนำ/คัดตัวเลือก → ถามข้อมูลต่อเพื่อปิด lead
```

ไม่ควรเป็น:

```txt
ตอบกว้าง ๆ → แปะลิงก์ → จบ
```

เพิ่ม logic สำหรับ:

1. ถ้า intent คือ `room_recommendation`
   - recommend 1 best-fit room
   - ให้เหตุผลสั้น ๆ 1-2 ข้อ
   - ถามวันที่เข้าพัก + จำนวนคน
   - อย่าส่ง link ทันทีถ้าลูกค้ายังไม่ได้ขอดูรูป/จอง

2. ถ้า intent คือ `group_booking`
   - treat as high-value lead
   - ไม่ปฏิเสธเร็ว
   - แนะนำ multi-room arrangement
   - ถามวันที่ถ้ายังไม่มี
   - ถามจำนวนผู้ใหญ่/เด็ก
   - ถามว่าสะดวกแยกหลายห้องไหม
   - ขอชื่อ/เบอร์โทรเมื่อเหมาะสม
   - เตรียม escalate summary ให้ owner/staff

3. ถ้า intent คือ `availability_check`
   - ถ้าไม่มี real availability data ห้ามยืนยันว่ามี/ไม่มี
   - ให้ถามข้อมูลที่ขาด
   - บอกว่าจะช่วยตรวจสอบหรือส่งต่อทีมงาน

4. ถ้า intent คือ `price_inquiry`
   - ตอบจาก data เท่านั้น
   - ถ้าไม่มี data ให้บอกว่าต้องให้ทีมงานตรวจสอบ
   - ถามวันเข้าพัก/จำนวนคน เพราะราคาอาจขึ้นกับเงื่อนไข

---

## `line-concierge.ts`

ใช้สำหรับ:

- main orchestration ของ LINE chat
- รับ message/context
- เรียก intent-router
- เรียก reply-composer
- เรียก provider/model
- ส่ง response กลับ

ห้ามรื้อ flow เดิม ถ้าไม่จำเป็น

ให้เพิ่ม orchestration แบบปลอดภัย:

```txt
incoming message
→ normalize language/context
→ detect intent
→ extract lead info
→ select relevant rules/context
→ compose prompt/response
→ apply guardrails
→ return response
```

ถ้าปัจจุบันยังไม่มี `extractLeadInfo` ให้เพิ่มเป็น helper แยกไฟล์ได้ เช่น:

```txt
lib/ai/lead-extractor.ts
```

แต่ถ้าเพิ่มแล้วกระทบ flow เดิมมากเกินไป ให้เริ่มจาก simple helper ใน `reply-composer.ts` ก่อน แล้วค่อยแยกทีหลัง

---

## `handoff.ts`

ใช้สำหรับ:

- ส่งต่อ owner/staff
- สรุปข้อมูลลูกค้า
- escalation summary

เพิ่ม format summary:

```md
มีลูกค้าสอบถามเข้าพัก

Intent:
ข้อมูลที่ทราบ:
- วันที่:
- จำนวนผู้เข้าพัก:
- ผู้ใหญ่/เด็ก:
- ความต้องการ:
- ห้องที่สนใจ:
- สิ่งที่ไม่ชอบ:
- เบอร์โทร:
- สถานะล่าสุด:

สิ่งที่ควรดำเนินการ:
- ตรวจสอบห้องว่าง
- เสนอราคาหรือแพ็กเกจ
- ติดต่อกลับลูกค้า
```

ต้อง escalate เมื่อ:

- group booking 10+ คน
- ลูกค้าถามห้องว่างจริง
- ลูกค้าต้องการราคาพิเศษ
- ข้อมูลไม่พอหรือ AI ไม่ควรยืนยันเอง
- ลูกค้าขอคุยกับคนจริง

---

## `language.ts`

ใช้สำหรับ:

- language detection
- Thai polite tone
- tone consistency

เพิ่มหลัก:

- ถ้าลูกค้าพิมพ์ไทย ให้ตอบไทย
- ภาษาไทยควรสุภาพ ธรรมชาติ ไม่แข็งเกินไป
- ใช้ “ค่ะ/ครับ” ให้ consistent ตาม persona เดิมของระบบ
- ไม่ต้องใช้ emoji พร่ำเพรื่อ
- อย่าใช้คำขายแรงเกินไป
- ให้ฟีลช่วยเลือก ไม่ใช่กดดันให้จอง

---

# Lead Extraction

เพิ่มหรือปรับ helper สำหรับ extract ข้อมูล lead จากข้อความและ conversation context

ควร extract:

```ts
type LeadInfo = {
  checkIn?: string;
  checkOut?: string;
  rawDateText?: string;
  guests?: number;
  adults?: number;
  children?: number;
  roomPreference?: string[];
  dislikedFeatures?: string[];
  phone?: string;
  name?: string;
  isGroupBooking?: boolean;
  leadScore?: "low" | "medium" | "high";
};
```

ตัวอย่าง:

- “25-27 เดือนนี้” → `rawDateText = "25-27 เดือนนี้"`
- “ไปกัน 20 คน” → `guests = 20`, `isGroupBooking = true`, `leadScore = "high"`
- “ไม่ชอบบ้านไม้” → `dislikedFeatures includes "wooden"`

ถ้า parse วันที่ไม่มั่นใจ ให้เก็บ raw text และถามยืนยัน ไม่ควรเดามั่ว

---

# Room Recommendation Logic

เพิ่ม helper ถ้าเหมาะสม:

```ts
recommendRooms({
  guests,
  preferences,
  dislikedFeatures,
  rooms
})
```

หลักการ:

- ถ้าลูกค้าไม่ชอบอะไร ให้ filter ห้องที่ไม่ตรงออกก่อน
- ถ้าถาม “สวยสุด” ให้เลือก best candidate จาก `suitableFor`
- ถ้าจำนวนคนเกิน maxGuests ต่อห้อง ให้เสนอ multi-room arrangement
- ถ้าไม่มีข้อมูลพอ ให้แนะนำแบบมีเงื่อนไข เช่น “จากข้อมูลห้องพักที่มีตอนนี้...”
- ห้าม invent feature ที่ไม่มีใน data

ตัวอย่างการตอบที่ควรได้:

```txt
ถ้าไม่ชอบบ้านไม้ แนะนำ Forest Hill มากที่สุดค่ะ เพราะบรรยากาศดูโปร่ง เป็นธรรมชาติ และไม่ใช่ฟีลบ้านไม้แบบดั้งเดิมค่ะ

คุณลูกค้าเข้าพักกี่ท่าน และต้องการเข้าพักวันไหนคะ เดี๋ยวช่วยดูตัวเลือกที่เหมาะที่สุดให้ค่ะ
```

---

# Group Booking Logic

สำหรับลูกค้ากลุ่มใหญ่ เช่น 10+ คน:

- treat as high-value lead
- อย่าปฏิเสธเร็ว
- อย่าบอกว่าไม่ได้ ถ้ายังไม่ตรวจสอบ
- แนะนำ multi-room arrangement
- ถามวันเข้าพัก
- ถามจำนวนผู้ใหญ่/เด็ก
- ถามว่าสะดวกแยกหลายห้องไหม
- ขอชื่อ/เบอร์โทรเมื่อเหมาะสม
- ส่งต่อ owner/staff พร้อม structured summary

ตัวอย่างการตอบ:

```txt
สำหรับ 20 ท่าน แนะนำเป็นการจองหลายห้องค่ะ โดยอาจจัดเป็นหลายห้องตามจำนวนผู้เข้าพักและรูปแบบการนอนที่ต้องการ

รบกวนแจ้งวันที่เข้าพัก จำนวนผู้ใหญ่/เด็ก และสะดวกแยกหลายห้องไหมคะ เดี๋ยวช่วยประสานทีมงานเช็กห้องว่างและข้อเสนอสำหรับกรุ๊ปให้ค่ะ
```

---

# Link Behavior

แก้นิสัย FAQ bot ที่แปะลิงก์เร็วเกินไป

Rules:

- อย่าใช้ booking link แทนการตอบคำถาม
- ส่งลิงก์ได้เมื่อ:
  - ลูกค้าขอดูรูป
  - ลูกค้าขอจอง
  - หลังจาก AI แนะนำตัวเลือกที่มีประโยชน์แล้ว
- อย่าส่งลิงก์เดิมซ้ำทุก response
- ถ้าส่งลิงก์ ให้มี context สั้น ๆ ก่อนส่ง

Bad:

```txt
สามารถดูรายละเอียดเพิ่มเติมและจองผ่านลิงก์นี้ได้เลยค่ะ: <link>
```

Good:

```txt
ถ้าต้องการดูรูปเพิ่มเติมของ Forest Hill สามารถกดดูจากหน้านี้ได้ค่ะ: <link>
```

---

# Feedback-to-Rule Principle

เพิ่มเอกสารหรือ comment สำหรับ dev flow:

```md
When new feedback is found:
1. Do not create a narrow rule for only that exact sentence.
2. Identify the broader pattern.
3. Convert it into reusable intent behavior.
4. Add or update test cases.
5. Keep hotel facts in data files, not scattered in prompts.
6. Keep sales behavior in sales rules, not duplicated in every intent.
```

ตัวอย่าง:

Bad:

```md
ถ้าลูกค้าพูดว่า "ไม่ชอบบ้านไม้" ให้แนะนำ Forest Hill
```

Good:

```md
ถ้าลูกค้าบอกสิ่งที่ไม่ชอบ ให้คัดตัวเลือกที่มีลักษณะนั้นออก แล้วแนะนำห้องที่เหมาะที่สุดจากข้อมูลห้องพัก
```

Bad:

```md
ถ้าลูกค้าบอก 20 คน ให้ถามเบอร์
```

Good:

```md
ถ้าลูกค้าเป็น group booking 10+ คน ให้ treat as high-value lead, collect contact info, and escalate to staff.
```

---

# Required Test Cases

เพิ่ม test cases ใน `lib/ai/__tests__`

## Room Recommendation

Input:

```txt
ที่ไหนสวยสุดอ่ะ
```

Expected:

- ไม่ตอบแค่ว่าแล้วแต่ลูกค้าชอบ
- recommend 1 room
- มีเหตุผล
- ถามวันเข้าพัก/จำนวนคน
- ไม่แปะลิงก์ทันทีถ้าไม่จำเป็น

Input:

```txt
ไม่ชอบแบบบ้านไม้อ่ะ
```

Expected:

- filter out wooden-house style
- recommend non-wooden option
- ถามวันเข้าพัก/จำนวนคน
- ไม่ส่งลิงก์ซ้ำโดยไม่จำเป็น

## Group Booking

Input:

```txt
ไปกัน 20 คนแนะนำห้องไหน
```

Expected:

- detect group_booking
- ไม่ปฏิเสธเร็ว
- เสนอ multi-room
- ถามวันเข้าพักถ้ายังไม่มี
- leadScore = high

Follow-up:

```txt
25-27 เดือนนี้
```

Expected:

- จดจำว่าเป็น group 20 คนจาก context
- ไม่ตอบเหมือนเริ่มใหม่
- ถาม adult/children/sleeping arrangement/phone
- escalate summary ได้

## Link Behavior

Input:

```txt
ขอดูรูปห้อง
```

Expected:

- สามารถส่งลิงก์ได้
- แต่ต้องมี context สั้น ๆ

Input:

```txt
ห้องไหนเหมาะกับครอบครัว
```

Expected:

- แนะนำก่อน
- ยังไม่ควรแปะลิงก์เป็นคำตอบหลัก

---

# Implementation Requirements

หลังแก้เสร็จ ให้สรุป:

1. ไฟล์ที่แก้
2. ไฟล์ที่เพิ่ม
3. flow เดิมทำงานอย่างไร
4. flow ใหม่ทำงานอย่างไร
5. จุดที่ backward compatible
6. test cases ที่เพิ่ม
7. วิธีเพิ่ม rule ใหม่ในอนาคต
8. คำสั่งที่ใช้รัน test
9. test ผ่านหรือไม่ ถ้าไม่ผ่านให้บอกเหตุผลชัดเจน

---

# Safety Requirements

- ห้ามทำให้ระบบตอบมั่วมากขึ้น
- ห้ามยืนยันห้องว่างถ้าไม่ได้เชื่อม availability จริง
- ห้ามยืนยันราคาพิเศษถ้าไม่มีข้อมูล
- ห้ามบอกว่ารับกรุ๊ปได้แน่นอน ถ้ายังไม่เช็ก
- ใช้คำว่า “ช่วยตรวจสอบให้” หรือ “ประสานทีมงานให้” เมื่อข้อมูลต้องยืนยันจาก staff
- ห้ามลบ existing fallback/escalation ถ้ามีอยู่แล้ว ให้ refactor ให้ดีขึ้นแทน
- ห้าม hardcode ข้อมูลโรงแรมปลอมที่ไม่มีใน project จริง

---

# Final Expected Behavior

Customer:

```txt
ที่ไหนสวยสุดอ่ะ
```

HOSPIQ:

```txt
ถ้าเน้นสวยและถ่ายรูปง่าย แนะนำ Forest Hill ค่ะ เพราะบรรยากาศดูโปร่ง เป็นธรรมชาติ และเหมาะกับคนที่อยากได้ห้องพักฟีลสบาย ๆ ค่ะ

คุณลูกค้าเข้าพักกี่ท่าน และต้องการเข้าพักวันไหนคะ เดี๋ยวช่วยดูตัวเลือกที่เหมาะที่สุดให้ค่ะ
```

Customer:

```txt
ไม่ชอบบ้านไม้อ่ะ
```

HOSPIQ:

```txt
เข้าใจค่ะ ถ้าไม่ชอบบ้านไม้ แนะนำตัดห้องสไตล์บ้านไม้ออกก่อน แล้วดูตัวที่บรรยากาศโปร่งหรือทันสมัยกว่า เช่น Forest Hill ค่ะ

ลูกค้าเข้าพักกี่ท่าน และวันไหนคะ เดี๋ยวช่วยเช็กตัวเลือกที่เหมาะให้ค่ะ
```

Customer:

```txt
ไปกัน 20 คนแนะนำห้องไหน
```

HOSPIQ:

```txt
สำหรับ 20 ท่าน แนะนำเป็นการจองหลายห้องค่ะ โดยอาจจัดเป็นหลายห้องตามจำนวนผู้เข้าพักและรูปแบบการนอนที่ต้องการ

รบกวนแจ้งวันที่เข้าพัก จำนวนผู้ใหญ่/เด็ก และสะดวกแยกหลายห้องไหมคะ เดี๋ยวช่วยประสานทีมงานเช็กห้องว่างและข้อเสนอสำหรับกรุ๊ปให้ค่ะ
```
