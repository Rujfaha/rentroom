# MVP Booking Operations Plan: Admin Booking, Calendar, Atomic Booking, Booking Detail

## Summary
ทำเฉพาะรายการ 1, 2, 4, 5 สำหรับระบบโรงแรมเล็กที่เน้นการจองจริง โดยจะบันทึกแผนลง `plan.md` และสร้าง skill ใหม่สำหรับงานชุดนี้ เพื่อให้รอบ implement ทำงานตามแนวทางเดียวกัน: ไม่มี emoji ใน UI, mobile-first, ใช้ icon แบบ SVG/lucide, TypeScript ไม่ใช้ `any`, และต้องผ่าน `tsc`, lint, test, build

ค่า default ที่เลือกแล้ว:
- Calendar: ใช้แบบ **Room grid**
- Admin create booking: ใช้ **optional payment**
- Race condition: ใช้ **Postgres RPC transaction**
- Booking detail: เพิ่ม detail view/modal พร้อม reject reason/note

## Key Changes
- เพิ่มแผนใน `plan.md` สำหรับ 4 งานนี้ โดยแยกเป็น Phase:
  1. Admin create booking / walk-in / phone
  2. Room availability calendar แบบ room grid
  3. Atomic booking RPC ป้องกันจองชน
  4. Booking detail + payment/reject note UX

- สร้าง skill ใหม่ที่ `skills/rentroom-booking-operations/SKILL.md`
  - ระบุ workflow สำหรับงาน booking operations
  - บังคับอ่าน `AGENTS.md` และ `skill.md`
  - ห้ามใช้ `any`
  - ห้าม emoji ใน UI
  - ต้องใช้ server-side validation ซ้ำกับ booking public flow
  - ต้องทดสอบ `npx tsc --noEmit`, scoped eslint, `npm test`, และ `npm run build`

## Implementation Changes
- Admin create booking:
  - เพิ่มปุ่ม “สร้างการจอง” ในหน้า admin bookings
  - Form รองรับ source: `walk_in`, `phone`, `other`
  - เลือกวันที่, จำนวนผู้เข้าพัก, room type, ห้องว่าง, customer name/phone/email, note
  - Payment เป็น optional: ถ้ากรอกยอด/วิธีชำระ ให้สร้าง payment row; ถ้าไม่กรอก ให้ booking เป็น pending payment
  - ใช้ pricing logic เดิมคำนวณราคา default แต่ให้ admin override ได้แบบมี note

- Calendar room grid:
  - เพิ่มหน้า/แท็บ calendar ใน admin bookings
  - แถวคือ physical rooms, คอลัมน์คือวันที่
  - แสดง booking blocks ตามห้องจริงและสถานะ
  - มี filter ช่วงวันที่, room type, status
  - คลิก booking เพื่อเปิด detail
  - คลิกช่องว่างเพื่อ prefill create booking

- Atomic booking:
  - เพิ่ม migration สร้าง RPC เช่น `create_booking_atomic`
  - RPC ทำงานใน transaction: validate room availability, insert/reuse customer, insert booking, insert booking guest, optional payment
  - Public booking และ admin create booking ใช้ pathway เดียวกันสำหรับ critical insert
  - ถ้าห้องถูกจองไปแล้วระหว่าง submit ให้คืน error friendly และไม่สร้าง partial data

- Booking detail + reject note:
  - เพิ่ม detail modal/panel ใน admin bookings
  - แสดงข้อมูลลูกค้า, ห้อง, วันที่, ราคา, payment, slip, promotion, timestamps, notes
  - Reject ต้องกรอกเหตุผล และบันทึกลง `bookings.cancel_reason` หรือ `payments.notes`
  - เพิ่ม admin note/internal note โดยใช้ field `bookings.notes`
  - Actions เดิม approve/reject/check-in/check-out/no-show ย้ายเข้า detail ได้ แต่ยังคงใช้งานจาก list ได้ถ้าไม่ซับซ้อน

## Test Plan
- Unit tests:
  - admin booking validation: phone/email/date/guest count/payment optional
  - pricing/default total calculation
  - calendar date span mapping
  - RPC error mapping เมื่อห้องไม่ว่าง

- Integration/manual scenarios:
  - สร้าง walk-in booking แบบยังไม่จ่าย
  - สร้าง phone booking พร้อม payment verified
  - เลือกช่องว่างจาก calendar แล้ว form prefill ถูกต้อง
  - booking ที่สร้างแล้วแสดงใน list และ calendar
  - reject booking ต้องมี reason และแสดงใน detail
  - submit พร้อมกัน 2 รายการห้องเดียวกัน/วันเดียวกัน ต้องสำเร็จแค่รายการเดียว

- Required checks:
  - `npx tsc --noEmit`
  - scoped `npx eslint` ไฟล์ที่แก้
  - `npm test`
  - `npm run build`

## Assumptions
- ยังไม่ทำ storage migration ในรอบนี้ เพราะผู้ใช้เลือกทำเฉพาะรายการ 1, 2, 4, 5
- ยังไม่ทำ monthly calendar view ในรอบแรก
- ยังไม่ทำ expense/CRM/staff permission เพิ่ม
- ใช้ schema เดิมให้มากที่สุด: `bookings.source`, `bookings.notes`, `bookings.cancel_reason`, `payments.notes`, `payments.method`, `payments.status`
- ถ้าต้องเพิ่ม migration ให้เป็น additive เท่านั้น และใช้ `IF NOT EXISTS` เมื่อเหมาะสม
