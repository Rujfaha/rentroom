# Promotion System Design

เอกสารนี้เป็นการออกแบบระบบ Promotion สำหรับโปรเจกต์ Rentroom โดยยังไม่เริ่ม implementation จุดประสงค์คือขยายจากระบบ code ส่วนลดเดิม ให้รองรับ promotion แบบยืดหยุ่น เช่น ลดตามช่วงวันที่, ประเภทห้อง, จำนวนคืน, ช่องทางการจอง และเงื่อนไขอื่นในอนาคต

## เป้าหมายของระบบ

- รองรับ promotion แบบอัตโนมัติ โดยลูกค้าไม่ต้องกรอก code
- รองรับ promotion แบบใช้ code ส่วนลดเดิมต่อไป
- กำหนดเงื่อนไขได้ตาม room type, วันที่เข้าพัก, จำนวนคืน, ยอดรวม, ช่องทางการจอง และเงื่อนไขอื่น
- รองรับรูปแบบส่วนลดหลายแบบ เช่น เปอร์เซ็นต์, จำนวนเงิน, ลดต่อคืน, พัก X จ่าย Y, tiered discount
- มี snapshot ราคาและ promotion ตอนสร้าง booking เพื่อไม่ให้ booking เก่าเปลี่ยนราคาย้อนหลัง
- คำนวณราคาซ้ำฝั่ง server เสมอ เพื่อป้องกัน client ส่งราคาปลอม
- ออกแบบให้ query ได้เร็วและขยาย rule ใหม่ได้โดยไม่ต้องแก้ database บ่อย

## แนวคิดหลัก

ระบบควรแยก promotion ออกเป็น 2 กลุ่มหลัก

### 1. Automatic Promotion

Promotion ที่ระบบเลือกให้เองเมื่อ booking เข้าเงื่อนไข

ตัวอย่าง:

- พักอย่างน้อย 3 คืน ลด 10%
- ห้อง Deluxe ลด 500 บาท เฉพาะเดือนมิถุนายน
- จองวันธรรมดา ลดคืนละ 200 บาท

### 2. Code Required Promotion

Promotion ที่ต้องกรอก code ก่อนถึงจะใช้ได้

ตัวอย่าง:

- `VIP10` ลด 10%
- `SUMMER500` ลด 500 บาท
- `LONGSTAY` สำหรับลูกค้าที่พักหลายคืน

แนวทางนี้ทำให้ระบบยังรองรับ code ส่วนลดเดิม แต่ไม่จำกัดอยู่แค่ coupon code อย่างเดียว

## ขอบเขตเงื่อนไขที่ควรรองรับ

### เงื่อนไขด้านเวลา

- วันที่เริ่มใช้ promotion
- วันที่หมดอายุ promotion
- วันที่ check-in อยู่ในช่วงที่กำหนด
- วันที่ check-out อยู่ในช่วงที่กำหนด
- คืนที่เข้าพักมีบางส่วนอยู่ในช่วง promotion
- ใช้ได้เฉพาะบางวันในสัปดาห์ เช่น ศุกร์ เสาร์ อาทิตย์

### เงื่อนไขด้านห้องพัก

- ใช้ได้กับทุก room type
- ใช้ได้เฉพาะบาง room type
- ใช้ได้เฉพาะจำนวนห้องขั้นต่ำ เช่น จอง 2 ห้องขึ้นไป
- ใช้ได้เฉพาะราคาห้องบางช่วง ถ้าระบบมี rate plan ในอนาคต

### เงื่อนไขด้านจำนวนคืน

- จำนวนคืนขั้นต่ำ
- จำนวนคืนสูงสุด
- ลดแบบขั้นบันไดตามจำนวนคืน

ตัวอย่าง:

```txt
พัก 2 คืน ลด 5%
พัก 3 คืน ลด 10%
พัก 5 คืนขึ้นไป ลด 15%
```

### เงื่อนไขด้านยอดเงิน

- subtotal ขั้นต่ำก่อนลด
- subtotal สูงสุด
- จำกัดส่วนลดสูงสุด เช่น ลด 10% แต่ไม่เกิน 500 บาท

### เงื่อนไขด้านช่องทางการจอง

- Website
- Admin
- Walk-in
- Partner

หมายเหตุ: ใน UI ห้ามใช้ emoji ใน label, button, badge หรือ option ถ้าต้องการ icon ให้ใช้ SVG icon ตามกฎของโปรเจกต์

### เงื่อนไขด้านลูกค้า

รองรับเป็น optional สำหรับอนาคต

- ลูกค้าใหม่
- ลูกค้าเก่า
- เบอร์โทรหรือ email เคยใช้ promotion นี้แล้วหรือไม่
- จำนวนครั้งที่ใช้ได้ต่อลูกค้า

## รูปแบบส่วนลดที่ควรรองรับ

### 1. Percent Discount

ลดเป็นเปอร์เซ็นต์จาก subtotal

ตัวอย่าง:

```txt
ลด 10%
```

### 2. Fixed Amount Discount

ลดเป็นจำนวนเงินจาก subtotal

ตัวอย่าง:

```txt
ลด 500 บาท
```

### 3. Per Night Discount

ลดตามจำนวนคืน

ตัวอย่าง:

```txt
ลดคืนละ 200 บาท เป็นเวลา 3 คืน รวมลด 600 บาท
```

### 4. Free Night หรือ Stay X Pay Y

ลดราคาบางคืนให้ฟรีหรือคิดเฉพาะบางคืน

ตัวอย่าง:

```txt
พัก 3 คืน จ่าย 2 คืน
```

### 5. Fixed Price

กำหนดราคาพิเศษแทนราคาปกติ

ตัวอย่าง:

```txt
ห้อง Deluxe เหลือคืนละ 1,200 บาท ในช่วงวันที่กำหนด
```

### 6. Tiered Discount

ลดแบบขั้นบันได

ตัวอย่าง:

```txt
พัก 2 คืน ลด 5%
พัก 3 คืน ลด 10%
พัก 5 คืนขึ้นไป ลด 15%
```

## Database Design ที่แนะนำ

### ตาราง `promotions`

เก็บข้อมูลหลักของ promotion

```txt
id
hotel_id
name
description
status
promotion_type
starts_at
ends_at
stay_start_date
stay_end_date
priority
stackable
exclusive
max_uses
used_count
max_uses_per_customer
created_at
updated_at
```

คำอธิบาย field สำคัญ:

- `hotel_id`: ใช้แยก promotion รายโรงแรม
- `status`: `draft`, `active`, `paused`, `expired`
- `promotion_type`: `automatic`, `code_required`, `private`
- `starts_at`: วันเวลาเริ่มเปิดใช้งาน promotion
- `ends_at`: วันเวลาสิ้นสุด promotion
- `stay_start_date`: วันที่เข้าพักเริ่มต้นที่ promotion มีผล
- `stay_end_date`: วันที่เข้าพักสิ้นสุดที่ promotion มีผล
- `priority`: ใช้เรียงลำดับกรณีมีหลาย promotion
- `stackable`: ใช้ร่วมกับ promotion อื่นได้หรือไม่
- `exclusive`: ถ้าเข้าเงื่อนไข promotion นี้ จะกัน promotion อื่นออก
- `max_uses`: จำนวนครั้งสูงสุดที่ใช้ promotion นี้ได้
- `used_count`: จำนวนครั้งที่ถูกใช้แล้ว
- `max_uses_per_customer`: จำกัดจำนวนครั้งต่อลูกค้า

### ตาราง `promotion_codes`

เก็บ code สำหรับ promotion ที่ต้องกรอก code

```txt
id
promotion_id
code
max_uses
used_count
is_active
created_at
updated_at
```

หมายเหตุ:

- ควรเก็บ `code` เป็น uppercase เพื่อกันปัญหา case-sensitive
- ควรมี unique constraint ตาม `hotel_id` หรือผ่าน relation จาก `promotion_id`
- promotion แบบ automatic ไม่จำเป็นต้องมี record ในตารางนี้

### ตาราง `promotion_room_types`

ใช้ผูก promotion กับ room type เพื่อให้ query ได้ง่ายและเร็ว

```txt
id
promotion_id
room_type_id
created_at
```

ถ้า promotion ไม่มี record ในตารางนี้ อาจตีความว่าใช้ได้กับทุก room type หรือกำหนด flag เพิ่มใน `promotions` เช่น `applies_to_all_room_types`

### ตาราง `promotion_rules`

เก็บเงื่อนไขและผลลัพธ์แบบยืดหยุ่นด้วย JSONB

```txt
id
promotion_id
conditions_json
benefits_json
created_at
updated_at
```

ตัวอย่าง `conditions_json`:

```json
{
  "min_nights": 3,
  "max_nights": null,
  "min_subtotal": 3000,
  "days_of_week": ["fri", "sat"],
  "booking_channels": ["website", "admin"],
  "guest_count": {
    "min": 1,
    "max": null
  }
}
```

ตัวอย่าง `benefits_json`:

```json
{
  "type": "tiered_percent",
  "tiers": [
    { "min_nights": 2, "discount_percent": 5 },
    { "min_nights": 3, "discount_percent": 10 },
    { "min_nights": 5, "discount_percent": 15 }
  ],
  "max_discount_amount": 1000
}
```

### ตาราง `promotion_usages`

เก็บประวัติการใช้ promotion

```txt
id
promotion_id
promotion_code_id
booking_id
customer_phone
customer_email
discount_amount
used_at
```

ใช้สำหรับ:

- ตรวจสอบจำนวนครั้งที่ใช้ทั้งหมด
- ตรวจสอบจำนวนครั้งต่อลูกค้า
- ทำ report ภายหลัง

### ตาราง `booking_promotions`

เก็บ snapshot promotion ที่ใช้กับ booking

```txt
id
booking_id
promotion_id
promotion_name
promotion_code
discount_type
discount_value
discount_amount
conditions_snapshot
benefits_snapshot
created_at
```

เหตุผลที่ต้องมี snapshot:

- ถ้า admin แก้ promotion ภายหลัง booking เก่าต้องไม่เปลี่ยนราคา
- ใช้ตรวจสอบย้อนหลังได้ว่าตอนนั้นลดเพราะ rule อะไร
- ใช้แสดงใน booking detail และใบยืนยันการจองได้

## Promotion Engine

ควรมี service กลางสำหรับคำนวณ promotion แยกจาก UI และ page component

ตัวอย่าง path ที่เหมาะสม:

```txt
src/lib/promotions/promotion-engine.ts
src/lib/promotions/types.ts
src/app/actions/promotions.ts
```

### Input ของ Promotion Engine

```ts
{
  hotelId: string
  roomTypeId: string
  checkInDate: string
  checkOutDate: string
  nights: number
  quantity: number
  guests: number
  subtotal: number
  bookingChannel: 'website' | 'admin' | 'walk_in' | 'partner'
  promotionCode?: string
  customer?: {
    phone?: string
    email?: string
  }
}
```

### Output ของ Promotion Engine

```ts
{
  eligiblePromotions: PromotionResult[]
  selectedPromotion: PromotionResult | null
  discountAmount: number
  finalTotal: number
  breakdown: PromotionBreakdown[]
}
```

## Flow การคำนวณราคา

### 1. คำนวณราคาห้องพื้นฐาน

ระบบคำนวณจาก:

- room type
- check-in date
- check-out date
- จำนวนคืน
- จำนวนห้อง
- ราคาต่อคืน

ผลลัพธ์คือ `subtotal`

### 2. หา promotion ที่มีโอกาสใช้ได้

ควร filter จาก database ก่อนเพื่อลดจำนวนข้อมูล

เงื่อนไข filter ขั้นต้น:

```txt
hotel_id = current hotel
status = active
starts_at <= now
ends_at >= now
promotion_type ตรงกับ automatic หรือ code_required
room_type ตรง หรือใช้ได้ทุก room type
stay date overlap กับช่วงที่กำหนด
```

### 3. ประเมิน condition ใน Promotion Engine

ตรวจสอบ rule เช่น:

- จำนวนคืนเข้าเงื่อนไขหรือไม่
- subtotal ถึงขั้นต่ำหรือไม่
- room type ใช้ได้หรือไม่
- วันที่เข้าพักอยู่ในช่วงหรือไม่
- วันในสัปดาห์ตรงหรือไม่
- code ถูกต้องหรือไม่
- ใช้เกิน limit หรือยัง

### 4. คำนวณ discount

คำนวณตาม `benefits_json`

ตัวอย่าง:

- percent discount
- fixed amount
- per night discount
- free night
- tiered discount
- fixed price

### 5. เลือก promotion ที่ดีที่สุด

กรณีไม่ให้ stack:

- ถ้ามี code ให้ใช้ promotion จาก code ก่อน
- ถ้าเป็น automatic ให้เลือก promotion ที่ลดได้มากที่สุด
- ถ้ามี priority สูงกว่า อาจใช้ priority เป็นตัวตัดสินก่อน แล้วค่อยดูจำนวนเงินลด

กรณี stack ได้:

- เรียงตาม priority
- คำนวณทีละ promotion
- จำกัด max discount ถ้ามี
- ห้ามรวมกับ promotion ที่ `exclusive = true`

### 6. บันทึก booking พร้อม snapshot

เมื่อสร้าง booking:

- คำนวณ promotion ซ้ำฝั่ง server
- สร้าง booking ด้วย final total ที่ server คำนวณ
- บันทึก `booking_promotions`
- บันทึก `promotion_usages`
- เพิ่ม `used_count` อย่างปลอดภัย

## Rule การเลือก Promotion ที่แนะนำ

ระบบควรมีกฎชัดเจนเพื่อลดความสับสน

แนะนำใช้แนวทางนี้:

```txt
1. ถ้าลูกค้ากรอก code และ code valid ให้ใช้ promotion จาก code
2. ถ้าไม่ได้กรอก code ให้หา automatic promotion
3. ถ้ามี automatic หลายตัว ให้เลือกตัวที่ลดมากที่สุด
4. ถ้ามี exclusive promotion ให้กัน promotion อื่นออก
5. ถ้า stackable = false ให้ใช้ได้แค่ตัวเดียว
6. ถ้า stackable = true ให้เรียงตาม priority แล้วคำนวณตามลำดับ
```

## Admin UI Design

ควรทำเป็น wizard หรือ form แบ่ง section เพื่อไม่ให้หน้าเดียวซับซ้อนเกินไป

### Section 1: ข้อมูลพื้นฐาน

- ชื่อ promotion
- รายละเอียด
- สถานะ
- ประเภท promotion
- วันที่เริ่มใช้งาน
- วันที่หมดอายุ

### Section 2: เงื่อนไขการเข้าพัก

- ใช้กับทุก room type หรือเลือกเฉพาะบาง room type
- วันที่เข้าพักที่มีผล
- จำนวนคืนขั้นต่ำ
- จำนวนคืนสูงสุด
- วันในสัปดาห์ที่ใช้ได้
- ช่องทางการจอง

### Section 3: รูปแบบส่วนลด

- ลดเป็นเปอร์เซ็นต์
- ลดเป็นจำนวนเงิน
- ลดต่อคืน
- พัก X จ่าย Y
- ราคาพิเศษต่อคืน
- ลดแบบขั้นบันได

### Section 4: ข้อจำกัด

- จำนวนครั้งที่ใช้ได้ทั้งหมด
- จำนวนครั้งต่อลูกค้า
- ใช้ร่วมกับ promotion อื่นได้หรือไม่
- exclusive หรือไม่
- priority

### Section 5: Preview

ควรมีตัวอย่างคำนวณก่อนบันทึก

ตัวอย่าง:

```txt
Room type: Deluxe
Check-in: 2026-06-10
Check-out: 2026-06-13
Nights: 3
Subtotal: 3,600 บาท
Promotion: พัก 3 คืน ลด 10%
Discount: 360 บาท
Final total: 3,240 บาท
```

## ตัวอย่าง Promotion Use Cases

### Use Case 1: พัก 3 คืน ลด 10%

Condition:

```json
{
  "min_nights": 3
}
```

Benefit:

```json
{
  "type": "percent",
  "discount_percent": 10
}
```

### Use Case 2: ห้อง Deluxe ลด 500 บาท เฉพาะเดือนมิถุนายน

Condition:

```json
{
  "room_type_ids": ["deluxe-room-type-id"],
  "stay_date_range": {
    "from": "2026-06-01",
    "to": "2026-06-30"
  }
}
```

Benefit:

```json
{
  "type": "fixed_amount",
  "discount_amount": 500
}
```

### Use Case 3: พัก 3 จ่าย 2

Condition:

```json
{
  "min_nights": 3
}
```

Benefit:

```json
{
  "type": "stay_x_pay_y",
  "stay_nights": 3,
  "pay_nights": 2
}
```

### Use Case 4: Code VIP ลด 10% เมื่อยอดถึง 2,000 บาท

Condition:

```json
{
  "min_subtotal": 2000
}
```

Benefit:

```json
{
  "type": "percent",
  "discount_percent": 10
}
```

Code:

```txt
VIP10
```

### Use Case 5: ลดแบบขั้นบันไดตามจำนวนคืน

Condition:

```json
{
  "min_nights": 2
}
```

Benefit:

```json
{
  "type": "tiered_percent",
  "tiers": [
    { "min_nights": 2, "discount_percent": 5 },
    { "min_nights": 3, "discount_percent": 10 },
    { "min_nights": 5, "discount_percent": 15 }
  ]
}
```

## Security และ Data Integrity

### คำนวณราคาบน server เท่านั้น

Client สามารถแสดง preview ได้ แต่ตอนสร้าง booking ต้องส่งข้อมูลพื้นฐาน เช่น room type, date, quantity, promotion code แล้วให้ server คำนวณราคาใหม่ทั้งหมด

ห้ามเชื่อค่าเหล่านี้จาก client:

- subtotal
- discount amount
- final total
- selected promotion id

### ป้องกัน race condition

กรณี promotion หรือ code มีจำนวนจำกัด ต้องป้องกันปัญหาใช้เกินจำนวน เช่น code เหลือ 1 ครั้ง แต่มี booking เข้ามาพร้อมกัน 2 รายการ

แนวทาง:

- ใช้ database transaction หรือ Supabase RPC
- update `used_count` แบบมีเงื่อนไข เช่น `used_count < max_uses`
- สร้าง `promotion_usages` ใน transaction เดียวกับ booking

### Snapshot ทุกครั้ง

เมื่อ booking สำเร็จ ต้องบันทึก snapshot ของ promotion ที่ใช้ เพื่อให้ข้อมูลย้อนหลังไม่เปลี่ยนตามการแก้ promotion ในอนาคต

## Performance Considerations

### Filter จาก database ก่อน

ไม่ควรดึง promotion ทั้งหมดมา evaluate ใน app

ควร filter ขั้นต้นด้วย:

- `hotel_id`
- `status`
- `starts_at`
- `ends_at`
- `promotion_type`
- `room_type_id`
- `stay_start_date`
- `stay_end_date`

### Index ที่ควรมี

```txt
promotions(hotel_id, status)
promotions(starts_at, ends_at)
promotions(stay_start_date, stay_end_date)
promotion_codes(code)
promotion_codes(promotion_id)
promotion_room_types(promotion_id, room_type_id)
promotion_usages(promotion_id)
promotion_usages(customer_phone)
promotion_usages(customer_email)
booking_promotions(booking_id)
```

### หลีกเลี่ยง realtime ที่ไม่จำเป็น

Promotion ไม่จำเป็นต้อง realtime ทุกหน้า อาจใช้การ refresh ตอนเปิดหน้า booking หรือ admin แก้ไขเสร็จแทน เพื่อลดภาระ production

## Timezone Rules

ควรกำหนด timezone ให้ชัดเจน

แนะนำ:

- `starts_at` และ `ends_at` เก็บเป็น timestamp with timezone
- `stay_start_date` และ `stay_end_date` เก็บเป็น date
- การเปรียบเทียบวันที่เข้าพักควรใช้ hotel timezone เดียวกันทั้งระบบ

## Implementation Map สำหรับ Agent

Section นี้ระบุ path และส่วนของระบบที่เกี่ยวข้อง เพื่อให้ agent ที่จะเริ่ม implementation อ่านก่อนแล้วทำงานได้ถูกจุด ไม่ค้นหาซ้ำเกินจำเป็น และไม่แก้ผิด feature

### ภาพรวมสำคัญก่อนเริ่ม

โปรเจกต์นี้มี table และ UI ชื่อ `promotions` อยู่แล้ว แต่ปัจจุบันทำหน้าที่เป็น CMS promotion และ code ส่วนลดแบบพื้นฐาน ไม่ใช่ promotion engine เต็มรูปแบบ

ดังนั้นก่อนเริ่มทำจริงต้องตัดสินใจให้ชัดว่า:

- จะ migrate table `promotions` เดิมให้เป็น promotion engine หลัก
- หรือจะแยก table ใหม่ เช่น `booking_promotions_master` / `promotion_campaigns` เพื่อไม่ชนกับ CMS promotion บนหน้า landing

คำแนะนำ: ถ้าต้องลด risk ให้แยก concept เป็น 2 ชั้น

- `promotions` เดิม = CMS content + code ส่วนลดเดิม
- promotion engine ใหม่ = ตาราง rule/usage/snapshot เพิ่มเติม แล้วค่อย migrate เข้าหากันภายหลัง

### เอกสารและ database ที่ต้องดู

- `PROMOTION_SYSTEM_DESIGN.md`
  - เอกสาร design หลักของระบบนี้
  - ต้องอ่านก่อนเริ่ม implementation

- `schema.sql`
  - schema หลักของระบบ
  - มีตารางสำคัญ เช่น `hotels`, `room_types`, `rooms`, `bookings`, `booking_guests`, `payments`, `pricing_rules`
  - มีตาราง `promotions` เดิมอยู่ช่วงท้ายไฟล์

- `migrations/add_promotion_discount_fields.sql`
  - migration เดิมที่เพิ่มระบบ discount code ลง table `promotions`
  - มี index `idx_promotions_discount_code`
  - ต้องระวังไม่สร้าง field ซ้ำหรือเปลี่ยนความหมาย field เดิมโดยไม่ migrate

- `migrations/add_room_type_fields.sql`
  - migration ที่เกี่ยวกับ field เพิ่มเติมของ room type
  - ต้องดูถ้าจะใช้ room type metadata ใน condition หรือ admin form

- `migrations/optimize_live_query_indexes.sql`
  - migration index/performance เดิม
  - ควรตรวจสอบก่อนเพิ่ม index promotion ใหม่ เพื่อไม่ซ้ำหรือขัดกับ pattern เดิม

### Booking flow ฝั่งลูกค้า

- `src/app/booking/page.tsx`
  - entry page ของหน้า booking
  - ใช้เชื่อม query params เช่น selected room และ initial data
  - ถ้าจะเพิ่ม promotion preview ตั้งแต่ก่อนชำระเงิน ให้เริ่มตรวจจากไฟล์นี้และ component ที่เรียกต่อ

- `src/components/booking/BookingFlow.tsx`
  - orchestrator หลักของ booking steps
  - ส่ง `promotionCode` จาก payment step เข้า `createWebsiteBooking`
  - จุดที่ควรเพิ่ม state/result ของ promotion engine ถ้าจะรองรับ automatic promotion หรือ breakdown

- `src/components/booking/StepSelectRoom.tsx`
  - step เลือกห้อง
  - ถ้าจะโชว์ราคาโปรตั้งแต่เลือกห้องหรือ badge promotion ต่อ room type ให้แก้ที่นี่

- `src/components/booking/StepGuestInfo.tsx`
  - step ข้อมูลลูกค้า
  - ถ้าจะมี rule ตามลูกค้าใหม่/ลูกค้าเก่า/เบอร์/email ต้องส่งข้อมูลนี้เข้า promotion engine ภายหลัง

- `src/components/booking/StepPayment.tsx`
  - จุดปัจจุบันที่กรอก code ส่วนลด
  - เรียก `validatePromotionCode` จาก `src/app/actions/booking.ts`
  - คำนวณ `subtotalAmount`, `discountAmount`, `totalAmount` ใน client เพื่อแสดงผลและสร้าง QR
  - ต้องปรับให้รองรับ promotion engine output เช่น automatic discount, code discount, breakdown, final total
  - ต้องจำไว้ว่า client เป็นแค่ preview ราคาจริงต้องคำนวณซ้ำที่ server

- `src/components/booking/StepConfirmation.tsx`
  - step แสดงผลสำเร็จหลังจอง
  - ถ้าจะโชว์ promotion ที่ใช้หรือส่วนลดใน confirmation ให้เพิ่มจาก booking result หรือ lookup

- `src/app/api/booking/upload-slip/route.ts`
  - API อัปโหลดสลิป
  - ไม่ใช่จุดคำนวณ promotion แต่เกี่ยวกับ payment step โดยตรง

### Booking action และ server-side pricing

- `src/app/actions/booking.ts`
  - ไฟล์สำคัญที่สุดสำหรับ booking และ server-side price calculation ปัจจุบัน
  - มี logic หา available room, คำนวณราคาห้อง, สร้าง booking, สร้าง customer, สร้าง payment

จุดสำคัญใน `src/app/actions/booking.ts`:

- `createWebsiteBooking`
  - สร้าง booking จากหน้า website
  - ปัจจุบันคำนวณ `totalAmount`, validate code, คำนวณ `discountAmount`, `netAmount`
  - ต้องแทน logic code ส่วนลดเดิมด้วย promotion engine ฝั่ง server
  - ต้องบันทึก snapshot ลง `booking_promotions`
  - ต้องบันทึก usage ลง `promotion_usages`
  - ต้องไม่เชื่อ subtotal, discount, final total จาก client

- `validatePromotionCode`
  - function ตรวจ code ส่วนลดเดิม
  - ปัจจุบัน query table `promotions` โดย `discount_code`
  - ควร refactor ให้เรียก promotion engine หรือค่อย ๆ deprecate หลังมี engine ใหม่

- pricing helper ในไฟล์เดียวกัน
  - มี logic เช่น `getStayTotal`, `getPricingContext`, `getRoomTypeForPricing`, `findAvailableRoomId`
  - promotion engine ควรรับ subtotal และ context จาก helper เหล่านี้ ไม่ควรคำนวณราคาห้องซ้ำแบบกระจายหลายที่

### Landing page และ CMS promotion เดิม

- `src/app/page.tsx`
  - หน้า landing หลัก
  - ปัจจุบัน query table `promotions` เพื่อแสดง CMS promotion บนหน้าเว็บ
  - ต้องระวังมากถ้าเปลี่ยน schema ของ `promotions` เพราะจะกระทบหน้าแรกทันที

- `src/types/landing.types.ts`
  - มี interface `Promotion` เดิมสำหรับ landing CMS
  - ถ้าเพิ่ม promotion engine type ไม่ควรยัดทุกอย่างใน type นี้
  - แนะนำแยก type ใหม่ เช่น `src/lib/promotions/types.ts`

- `src/components/sections/RoomTypesSection.tsx`
  - แสดง room type cards หน้า landing
  - ใช้ `RoomTypeDisplay`
  - ถ้าจะโชว์ badge โปรใน card เช่น ราคาเริ่มต้นหลังลด ต้องคำนึง performance และไม่ใช้ realtime กว้างเกินจำเป็น

### Admin CMS promotion เดิม

- `src/app/(admin)/admin/cms/promotions/page.tsx`
  - หน้า admin สำหรับจัดการ CMS promotion เดิม
  - query `promotions` ทั้งหมดของ hotel แล้วส่งเข้า editor
  - ปัจจุบันใช้เพื่อแสดง promotion บนหน้า landing และ code ส่วนลดพื้นฐาน

- `src/components/admin/cms/PromotionEditor.tsx`
  - UI editor เดิมของ promotion
  - มี field เช่น title, discount text, discount type, discount code, valid until, image
  - ถ้าจะต่อยอดเป็น promotion engine เต็มรูปแบบ หน้าอาจซับซ้อนมาก
  - แนะนำแยกหน้าใหม่สำหรับ promotion engine แทนการยัดทุกอย่างลง editor เดิม

- `src/app/actions/promotions.ts`
  - server action สำหรับ create/update/delete CMS promotion เดิม
  - ปัจจุบันเขียนลง table `promotions`
  - ถ้าแยกระบบใหม่ ควรสร้าง action ใหม่ เช่น `src/app/actions/promotion-rules.ts` หรือ `src/app/actions/promotion-engine.ts`

- `src/components/admin/cms/CmsSidebar.tsx`
  - menu ย่อยของ CMS
  - มี link `/admin/cms/promotions`
  - ถ้าระบบ promotion engine แยกจาก CMS ไม่ควรเพิ่มไว้ใน CMS sidebar เว้นแต่ต้องการให้เป็น content management

### Admin navigation และหน้าใหม่ที่ควรเพิ่ม

- `src/components/admin/Sidebar.tsx`
  - main admin sidebar
  - ถ้าทำ promotion engine เป็นระบบจริง ควรเพิ่ม menu ใหม่ระดับเดียวกับ `การจอง`, `ห้องพัก`, `ราคา & ฤดูกาล`
  - ตัวอย่าง route ที่แนะนำ: `/admin/promotions`
  - ต้องใช้ icon จาก `lucide-react` หรือ inline SVG ตามกฎ UI ห้ามใช้ emoji

- `src/app/(admin)/admin/promotions/page.tsx`
  - path ที่แนะนำสำหรับหน้า list/manage promotion engine ใหม่
  - ยังไม่มีในระบบปัจจุบัน

- `src/components/admin/promotions/PromotionManager.tsx`
  - path ที่แนะนำสำหรับ component จัดการ list/create/edit
  - ยังไม่มีในระบบปัจจุบัน

- `src/components/admin/promotions/PromotionForm.tsx`
  - path ที่แนะนำสำหรับ form แบบ wizard/section
  - ยังไม่มีในระบบปัจจุบัน

- `src/components/admin/promotions/PromotionPreview.tsx`
  - path ที่แนะนำสำหรับ preview การคำนวณ promotion
  - ยังไม่มีในระบบปัจจุบัน

### Room type และ availability ที่เกี่ยวข้องกับ rule

- `src/app/(admin)/admin/rooms/page.tsx`
  - หน้า admin จัดการห้อง/room types
  - ใช้ดู pattern การ query `room_types`, `rooms` และ session hotel

- `src/components/admin/rooms/RoomManagement.tsx`
  - admin UI สำหรับจัดการห้องพัก
  - ใช้ดู component pattern ของ admin ปัจจุบัน

- `src/components/admin/rooms/RoomTypeSection.tsx`
  - admin section สำหรับ room type
  - ถ้า promotion condition เลือก room type ควรใช้ข้อมูลจาก `room_types` แบบเดียวกับหน้านี้

- `src/components/admin/cms/RoomTypesEditor.tsx`
  - editor room type ใน CMS/admin
  - ใช้ดู field ที่มีของ room type เช่น name, base price, guests, amenities

- `src/app/actions/rooms.ts`
  - server actions สำหรับ create/update/delete room type และ room images
  - ไม่ใช่จุดคำนวณ promotion แต่เป็น source ที่บอกว่า room type fields ปัจจุบันมีอะไรบ้าง

- `src/app/actions/landing.ts`
  - มี action ที่ใช้กับ landing/availability เช่น `getRoomAvailabilityCounts`
  - ถ้าแสดง promotion preview บนหน้า landing ต้องระวังไม่เพิ่ม query หนักหรือ realtime ที่กว้าง

### Pricing และฤดูกาล

- `src/app/(admin)/admin/pricing/page.tsx`
  - หน้า admin ราคาและฤดูกาล
  - ต้องดูถ้า promotion จะทำงานร่วมกับ seasonal pricing

- `src/components/admin/pricing/PricingManager.tsx`
  - UI จัดการ pricing
  - ใช้ดู pattern การเลือก room type, season, weekday/weekend

- `src/app/actions/pricing.ts`
  - server actions ของ pricing rules
  - promotion engine ควรคำนวณหลังจาก base price และ seasonal price ได้ subtotal แล้ว

- `schema.sql`
  - ตาราง `pricing_rules` อยู่ใน schema หลัก
  - promotion ไม่ควรแทนที่ pricing rules แต่ควรเป็น discount layer หลัง pricing

### Supabase client และ auth/session ที่ต้องใช้

- `src/lib/supabase/service.ts`
  - ใช้ใน server actions ที่ต้องเขียน/อ่านข้อมูลแบบ service role
  - promotion admin actions และ booking create flow ควรใช้ pattern นี้

- `src/lib/supabase/server.ts`
  - ใช้กับ server component หรือ server-side Supabase client ตาม pattern เดิม

- `src/lib/supabase/client.ts`
  - ใช้ใน client component เฉพาะที่จำเป็น
  - ไม่ควรเอา secret หรือ logic validate promotion สำคัญมาไว้ client

- `src/lib/session.ts`
  - ใช้ `getSession()` สำหรับ admin action/page
  - admin promotion management ต้องตรวจ `session.hotelId` เสมอ

- `src/middleware.ts`
  - middleware auth
  - โดยทั่วไปไม่ต้องแก้สำหรับ promotion ยกเว้นเพิ่ม route admin ใหม่แล้วต้องแน่ใจว่าอยู่ใต้ `/admin`

### Types ที่ควรเพิ่มหรือแก้

- `src/types/database.types.ts`
  - type database เดิม
  - ถ้ามี generated types หรือ manual types ต้องอัปเดตหลังเพิ่ม migration

- `src/types/landing.types.ts`
  - type สำหรับ landing page เดิม
  - ไม่ควรใช้เป็น type หลักของ promotion engine เพราะปะปนกับ CMS content

- `src/lib/promotions/types.ts`
  - path ที่แนะนำสำหรับ type ใหม่ของ promotion engine
  - ยังไม่มีในระบบปัจจุบัน

type ที่ควรมีใน path ใหม่:

- `PromotionCondition`
- `PromotionBenefit`
- `PromotionEvaluationInput`
- `PromotionEvaluationResult`
- `PromotionBreakdown`
- `PromotionSnapshot`

### Promotion engine files ที่ควรเพิ่ม

- `src/lib/promotions/promotion-engine.ts`
  - engine กลางสำหรับ validate condition, calculate discount, select promotion
  - ไม่ควรผูกกับ React component

- `src/lib/promotions/promotion-repository.ts`
  - optional
  - แยก query Supabase ออกจาก calculation logic เพื่อ test ง่าย

- `src/lib/promotions/types.ts`
  - type กลางของ engine

- `src/app/actions/promotion-evaluation.ts`
  - optional
  - server action สำหรับ preview promotion ใน booking/admin
  - ต้องคำนวณซ้ำตอน create booking อยู่ดี

### ตารางใหม่ที่ agent ควรเพิ่มผ่าน migration

ให้เพิ่มเป็น migration ใหม่ใน `migrations/` ห้ามแก้ production database โดยตรงโดยไม่มี migration

ตารางที่แนะนำ:

- `promotion_codes`
- `promotion_room_types`
- `promotion_rules`
- `promotion_usages`
- `booking_promotions`

ถ้าจะขยาย table `promotions` เดิม ต้องทำแบบ backward-compatible เพราะตอนนี้ `src/app/page.tsx`, `src/app/actions/promotions.ts`, `src/app/actions/booking.ts`, และ `src/components/admin/cms/PromotionEditor.tsx` ใช้อยู่แล้ว

### จุดที่ต้องเชื่อมเมื่อเริ่ม implementation จริง

ลำดับการเชื่อมที่ควรทำ:

1. เพิ่ม migration ตาราง promotion engine และ index
2. เพิ่ม `src/lib/promotions/types.ts`
3. เพิ่ม `src/lib/promotions/promotion-engine.ts`
4. เพิ่ม server action สำหรับ preview หรือ validate promotion
5. refactor `validatePromotionCode` ใน `src/app/actions/booking.ts` ให้เรียก engine
6. ปรับ `createWebsiteBooking` ให้คำนวณ promotion ซ้ำฝั่ง server และบันทึก snapshot/usage
7. ปรับ `StepPayment.tsx` ให้แสดง automatic/code promotion result จาก server action
8. เพิ่มหน้า `/admin/promotions` และ component ใน `src/components/admin/promotions/`
9. เพิ่ม menu ใน `src/components/admin/Sidebar.tsx`
10. อัปเดต type database และทดสอบ booking end-to-end

### จุดที่ต้องระวังเป็นพิเศษ

- ห้ามเชื่อ `discountAmount`, `totalAmount`, `netAmount` จาก client
- อย่าเปลี่ยนความหมาย table `promotions` เดิมโดยไม่ดูผลกระทบกับ landing page
- ห้ามทำ promotion realtime กว้าง ๆ บน landing ถ้าไม่จำเป็น
- ต้อง filter ทุก query ด้วย `hotel_id`
- ต้อง snapshot rule ที่ใช้กับ booking เสมอ
- ถ้ามี `max_uses` หรือ quota ต้องใช้ transaction/RPC เพื่อกันใช้เกินพร้อมกัน
- ถ้าเพิ่ม UI ต้อง mobile-first และห้ามใช้ emoji ใน label, button, badge, option
- ถ้าต้องใช้ icon ให้ใช้ `lucide-react` หรือ inline SVG ตาม pattern เดิม

## Migration Strategy

ถ้าระบบเดิมมี code ส่วนลดอยู่แล้ว ควร migrate แบบไม่ทำให้ของเดิมพัง

### Phase 1: เพิ่มตารางใหม่

เพิ่มตาราง:

- `promotions`
- `promotion_codes`
- `promotion_room_types`
- `promotion_rules`
- `promotion_usages`
- `booking_promotions`

### Phase 2: ย้าย code ส่วนลดเดิม

สร้าง promotion type `code_required` สำหรับ code เดิม

### Phase 3: เพิ่ม Promotion Engine

เพิ่ม service กลางสำหรับคำนวณ promotion และให้ booking flow เรียกใช้

### Phase 4: เพิ่ม Admin UI

เพิ่มหน้าจัดการ promotion แบบ wizard หรือ section form

### Phase 5: เปิด automatic promotion

หลังจาก code promotion ทำงานเสถียรแล้ว ค่อยเปิด automatic promotion

## Recommended Implementation Order

ลำดับที่แนะนำเมื่อต้องเริ่มทำจริง

1. สร้าง migration สำหรับตาราง promotion
2. สร้าง type และ Promotion Engine
3. เชื่อม booking calculation ให้คำนวณ promotion ฝั่ง server
4. เพิ่ม snapshot ใน booking
5. เพิ่มหน้า admin สำหรับ list/create/edit promotion
6. เพิ่ม preview promotion ใน admin
7. เพิ่ม promotion preview ในหน้าลูกค้า
8. เพิ่ม report การใช้ promotion

## Open Decisions

ก่อนเริ่ม implementation ควรตัดสินใจเรื่องเหล่านี้

- ถ้ามี automatic promotion หลายตัว จะเลือกจาก discount สูงสุดหรือ priority ก่อน
- จะอนุญาตให้ stack promotion หรือไม่
- Code promotion ใช้ร่วมกับ automatic promotion ได้หรือไม่
- Stay date promotion จะคิดแบบคืนใดคืนหนึ่งอยู่ในช่วง หรือทุกคืนต้องอยู่ในช่วง
- จำกัด promotion ตาม customer จาก phone, email หรือ user id
- ระบบต้องรองรับหลายห้องหลาย room type ใน booking เดียวหรือไม่
- ถ้า booking ถูกยกเลิก ต้องคืน quota promotion หรือไม่

## สรุป

ระบบที่แนะนำคือ promotion architecture แบบ hybrid:

- ใช้ตาราง relational สำหรับข้อมูลที่ query บ่อย เช่น hotel, room type, code, status, date
- ใช้ JSONB สำหรับ rule ที่ยืดหยุ่น เช่น min nights, tiered discount, booking channels
- ใช้ Promotion Engine กลางสำหรับ validate และ calculate discount
- บันทึก snapshot ลง booking ทุกครั้ง
- คำนวณราคาฝั่ง server เสมอ

แนวทางนี้จะรองรับทั้ง code ส่วนลดเดิมและ promotion อัตโนมัติในอนาคต โดยไม่ต้องรื้อโครงสร้างระบบบ่อย
