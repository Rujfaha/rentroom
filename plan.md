⏳ งานที่ยังไม่ได้ทำ (Pending Tasks)
นี่คือสิ่งที่เราต้องทำต่อเรียงตามลำดับความสำคัญครับ:

🟢 1. จัดการส่วนที่เหลือของ Phase 2 (CMS) ให้จบ
 Room Types (/admin/cms/rooms): หน้าสำหรับเพิ่ม/แก้ไข "ประเภทห้องพัก" (รูปภาพ, ราคา, สิ่งอำนวยความสะดวก)
 About & Attractions (/admin/cms/about): หน้าสำหรับแก้ไขคำอธิบายรีสอร์ต และสร้างรายการ "สถานที่ท่องเที่ยวใกล้เคียง"
🟢 2. เชื่อมต่อหน้าเว็บหน้าบ้านกับฐานข้อมูล (Landing Page Integration)
 ลบข้อมูล Mock-up: เปลี่ยนหน้า Landing Page เดิมที่ใช้ข้อมูลจำลอง ให้ดึงข้อมูลจริงจากฐานข้อมูลที่เพิ่งกรอกในหน้า CMS ไปแสดงผล (ภาพ Hero, โปรโมชั่น, ราคาห้อง, ข้อมูลติดต่อ ฯลฯ)
🔵 3. Phase 3 — Booking Management (ระบบจัดการการจอง)
 Booking List: ตารางรายการคนจอง พร้อมปุ่มค้นหาและ Filter สถานะ (รอชำระ, ยืนยันแล้ว, ยกเลิก)
 Booking Detail & Action: หน้าตรวจสอบการจองแบบละเอียด, การเปลี่ยนสถานะ (Check-in / Check-out)
 Calendar View: ปฏิทินแสดงภาพรวมรายเดือน ว่าวันไหนห้องประเภทใดว่าง/ไม่ว่างบ้าง
🟡 4. Phase 4 — Room & Housekeeping (ระบบสถานะห้องและแม่บ้าน)
 Room Overview: หน้าดูสถานะห้องพักจริง (ห้อง 101, 102...) ว่าตอนนี้ว่าง, มีแขก, หรือต้องซ่อม
 Housekeeping Kanban: บอร์ดสถานะ (สกปรก -> กำลังทำ -> สะอาด) เพื่อให้แม่บ้านหรือพนักงานใช้ทำงานผ่านมือถือได้ง่าย
🟠 5. Phase 5 — Payment & Pricing (ระบบการเงินและราคา)
 Payment Verification: หน้าสำหรับกดเข้ามา "ดูสลิปโอนเงิน" ของลูกค้า แล้วกด ยืนยัน/ปฏิเสธ เพื่ออนุมัติการจอง
 Pricing Rules: ระบบกำหนดราคาล่วงหน้า (เช่น วันเสาร์-อาทิตย์ ราคาแพงกว่าปกติ หรือช่วง High Season)
## MVP Booking Operations Addendum

งานที่เลือกทำในรอบนี้:

1. Admin create booking / walk-in / phone
   - แอดมินสร้าง booking จากหลังบ้านได้
   - รองรับ source: walk-in, phone, OTA, other
   - Payment เป็น optional: ยังไม่จ่ายก็สร้าง booking ได้ หรือถ้าจ่ายแล้วให้บันทึก method/status/reference ได้ทันที
   - ใช้ server-side validation และไม่ใช้ `any`

2. Atomic booking RPC
   - เพิ่ม Postgres RPC สำหรับสร้าง booking ใน transaction เดียว
   - เลือกห้องว่างและ insert customer/booking/booking_guest/payment แบบ atomic
   - กัน booking ชนด้วยการ lock room row และตรวจ overlapping booking statuses: pending, confirmed, checked_in
   - Public booking และ admin create booking ใช้ critical path เดียวกัน

งานที่แยกให้อีกตัวทำ:

1. Calendar room grid
   - แถวเป็น physical rooms, คอลัมน์เป็นวันที่
   - แสดง booking blocks และ filter ตาม room type/status/date

2. Booking detail + reject note UX
   - Detail modal/panel
   - Reject reason, internal note, payment note

Quality gates:

- `npx tsc --noEmit`
- scoped `npx eslint`
- `npm test`
- `npm run build`
