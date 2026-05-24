# Rentroom Conversation AI Architecture Skill

ใช้ skill นี้ทุกครั้งเมื่อแก้หรือออกแบบระบบ LINE OA / Conversation AI / AI concierge ของโปรเจกต์ `rentroom`

## เป้าหมาย

สร้างระบบ AI ตอบแชทที่ ship ได้ไว แต่ยังปลอดภัย, scalable, debug ง่าย และไม่แต่งข้อมูลธุรกิจเอง

หลักสำคัญ:
- ข้อมูลสำคัญต้องมาจากระบบจริงก่อนเสมอ เช่น ห้องว่าง ราคา โปรโมชัน ช่องทางชำระเงิน เบอร์ติดต่อ
- AI มีหน้าที่ช่วยเรียบเรียงภาษา, จัดลำดับคำตอบ, ถามต่อเมื่อข้อมูลไม่ครบ
- ห้าม AI ยืนยันการจอง, ยืนยันการชำระเงิน, แต่งราคา, แต่งเลขบัญชี, แต่งห้องว่าง หรือให้ policy ที่ไม่มีในระบบ
- ถ้าข้อความเกี่ยวกับ refund, complaint, payment issue, cancellation, special approval, group deal หรือเคสเสี่ยง ให้เตรียม human handoff

## Layer Checklist

ก่อนเริ่มงานให้ประเมินว่าแตะ layer ไหนบ้าง และอย่าแก้เกิน scope

1. System Prompt / Identity
   - ระบุบทบาทว่าเป็นผู้ช่วย LINE OA ของโรงแรม/ที่พัก
   - ตอบสุภาพ กระชับ เป็นมนุษย์
   - ถามภาษาไหนตอบภาษานั้นเมื่อรองรับ
   - ใส่ emoji ได้เล็กน้อยเฉพาะข้อความแชทลูกค้า ไม่ใช้ใน UI
   - ย้ำ guardrail เรื่องห้ามแต่งข้อมูลและห้ามยืนยันจองเอง

2. Knowledge Layer
   - ดึงข้อมูลจาก Supabase/server-side เท่านั้น
   - Availability ต้อง query จาก booking overlap จริง
   - Payment ต้องมาจาก hotel settings หรือ config ที่เชื่อถือได้
   - ห้าม hardcode ราคา, availability, payment account ใน prompt หรือ client

3. Intent Detection
   - รองรับ multi-intent ในข้อความเดียว
   - intent หลัก: availability, price, promotion, payment, booking, contact, handoff, general
   - ถ้าข้อความมีหลาย intent ต้องตอบให้ครบ ไม่เลือก intent เดียวจนข้อมูลหาย
   - เพิ่ม regression test ทุกครั้งเมื่อเจอคำถามที่ตอบผิด

4. Conversation State
   - ใช้ recent message history เพื่อเข้าใจบริบทล่าสุด
   - เก็บ booking draft/lead เฉพาะข้อมูลที่ช่วยจอง เช่น checkIn, checkOut, guests, roomTypeName, guestName, phone
   - ถ้าข้อมูลไม่ครบ ให้ถามต่อทีละ 1 คำถาม

5. Structured Response Layer (SRL)
   - แยก data facts ออกจาก final text
   - คำตอบที่มาจาก business logic ควรผ่าน composer หรือ structured object ก่อน
   - AI text generation ใช้สำหรับ rewrite/translation/tone ไม่ใช่แหล่ง truth

6. Business Logic Layer
   - Booking URL ต้อง prefill checkIn/checkOut/guests เมื่อมีข้อมูล
   - Cheapest room ต้องเลือกจาก roomTypes ที่ราคา basePrice ต่ำสุด และผ่าน capacity/availability ถ้ามี date
   - Payment answer ต้องบอก upload slip และรอทีมงานตรวจสอบ
   - ไม่รับรองว่าจองสำเร็จจนกว่า flow จริงยืนยัน

7. Human Handoff
   - เคสเสี่ยงต้อง mark handoff หรือแจ้งทีมงาน
   - ตัวอย่าง trigger: โอนแล้วแต่มีปัญหา, refund, complaint, group booking, request ส่วนลดพิเศษ, ขอแก้ booking, ลูกค้าพร้อมจองแต่ข้อมูลสำคัญครบ
   - Response ต้องบอกว่าจะให้ทีมงานช่วยดูต่อ พร้อมขอข้อมูลที่จำเป็นแบบสั้น

8. Logging Layer
   - เก็บ inbound/outbound message
   - เก็บ intent, language, provider, model, metadata ที่ช่วย debug
   - ห้าม log secret, token, API key หรือข้อมูลชำระเงินละเอียดเกินจำเป็น

9. Memory / User Context
   - จำภาษา preferred language เมื่อ detect ได้
   - จำ booking lead ล่าสุด แต่ต้องไม่ assume ข้อมูลเก่าเป็นข้อมูลใหม่ถ้าลูกค้าเปลี่ยนวัน/จำนวนคน
   - Long-term memory ต้องเป็นข้อมูลที่จำเป็นต่อบริการเท่านั้น

10. Notification Layer
   - ถ้ายังไม่มีระบบแจ้งเตือน ให้ทำแบบ additive
   - Event ที่ควรแจ้ง: hot lead, handoff required, payment issue, booking draft complete
   - แจ้งเตือนต้องไม่ block webhook reply ถ้าเป็นไปได้

11. Config Layer
   - ค่า tone, supported languages, emoji policy, handoff rules, business hours ควรย้ายไป DB/config ได้ในอนาคต
   - ตอน MVP ใช้ constants/env ได้ แต่ต้องรวมศูนย์ ไม่กระจาย hardcode

12. Security / Permission Layer
   - LINE webhook ต้อง verify signature
   - Service role ใช้ server-side เท่านั้น
   - ห้าม expose secret ใน client
   - DB migration ต้อง additive และไม่ break data เดิม
   - Validate input ก่อนเขียน DB

## Implementation Rules

- อ่าน `AGENTS.md` ก่อนเริ่มงานทุกครั้ง
- ก่อนแก้ไฟล์ ให้บอกสั้น ๆ ว่าจะแก้อะไรและไฟล์ไหน
- ทำ incremental change เล็ก ๆ ไม่ rewrite ระบบใหญ่
- ใช้ TypeScript type ชัดเจน ห้ามใช้ `any` ถ้าเลี่ยงได้
- ถ้า data shape ไม่แน่ ให้ใช้ `unknown` + type narrowing
- แยก pure helpers ไว้ใน `utils/` หรือ `lib/ai/` ตามขอบเขต
- Test-first สำหรับ behavior ใหม่หรือ bugfix
- อย่าแก้ UI ถ้า user ไม่ได้ขอ
- ถ้าต้องใส่ emoji ให้ใส่เฉพาะข้อความตอบลูกค้าใน LINE ไม่ใช่ UI component

## Recommended File Boundaries

- `src/app/api/line/webhook/route.ts`
  - รับ webhook, verify, log, call AI service, reply LINE
  - ไม่ควรมี business logic ยาว

- `src/lib/ai/line-concierge.ts`
  - orchestration หลัก: parse message, load memory/history, build context, choose deterministic/AI response

- `src/lib/ai/hotel-context.ts`
  - query knowledge/business facts จาก Supabase

- `src/lib/ai/intent-router.ts`
  - detect intent และ multi-intent

- `src/lib/ai/reply-composer.ts`
  - compose deterministic reply จาก facts จริง

- `src/lib/ai/language.ts`
  - detect language และ language preference

- `src/lib/line/logging.ts`
  - logging, memory metadata, recent history

- `src/types/line-ai.types.ts`
  - shared types

## TDD Checklist

สำหรับทุก behavior ใหม่:

1. เขียน test ที่ fail ก่อน
2. Run test เฉพาะจุดเพื่อเห็น failure
3. Implement น้อยที่สุดให้ผ่าน
4. Run relevant tests
5. Run `npx tsc --noEmit`
6. Run lint เฉพาะไฟล์ที่แตะ หรือ `npm run lint` ถ้าเหมาะ
7. Run `npm run build` ก่อนบอกว่าเสร็จ

Regression test ที่ควรมี:
- multi-intent เช่น availability + price + promotion + payment
- language detection: th, zh, en, ja, es, ar
- Thai date parser
- booking URL prefill
- payment answer ไม่ตอบ vague
- handoff trigger ไม่ให้ AI แก้ปัญหาเสี่ยงเอง

## Response Quality Rules

คำตอบ LINE ควร:
- ตอบให้ครบทุกคำถามในข้อความเดียว
- สั้นพออ่านในมือถือ
- ใช้ bullet ได้เมื่อมีหลายข้อมูล
- friendly แต่ไม่เยิ่นเย้อ
- ใช้ emoji เล็กน้อยได้ 0-2 ตัวต่อข้อความ
- ถามต่อทีละ 1 คำถามเมื่อข้อมูลไม่ครบ
- ไม่อ้างว่าทำสิ่งที่ระบบยังไม่ได้ทำ

## Provider Strategy

- เริ่มจาก model ราคาถูก/เร็วสำหรับข้อความทั่วไป
- ใช้ deterministic composer สำหรับคำถามที่ตอบจาก DB ได้
- ใช้ LLM เฉพาะกรณี general, translation, tone, complex wording หรือเมื่อต้องสรุปหลาย facts
- ถ้าจะเพิ่ม DeepSeek, Kimi หรือ provider ใหม่ ให้ทำผ่าน provider interface เดิม และมี fallback
- Log provider/model ทุกครั้งเพื่อวัด cost และคุณภาพภายหลัง

## Handoff / Rate Limit Rule

ถ้าใกล้ rate limit หรือหยุดกลางงาน ให้สร้าง/อัปเดต `AGENT_HANDOFF.md` ตาม format ใน `AGENTS.md`

ต้องระบุ:
- ทำอะไรเสร็จแล้ว
- ยังเหลืออะไร
- ไฟล์ที่แก้
- คำสั่งที่รันแล้ว
- error/warning ที่รู้
- next safest step

## Before Shipping

ห้ามบอกว่าเสร็จจนกว่าจะมี evidence:

```bash
npm test
npx tsc --noEmit
npm run build
```

ถ้า deploy:
- commit เฉพาะไฟล์ที่เกี่ยวข้อง
- push branch ที่ถูกต้อง
- เช็ก Vercel deployment จน `READY`

