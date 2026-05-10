# Room Types - การเชื่อมต่อกับระบบหลังบ้าน

## สรุปการเปลี่ยนแปลง

ปรับปรุงส่วน Room Types Section ในหน้า Landing Page ให้ดึงข้อมูลจากฐานข้อมูลจริงแทนการใช้ mock data

## ไฟล์ที่เปลี่ยนแปลง

### 1. Database Schema
- **migrations/add_room_type_fields.sql** (ใหม่)
  - เพิ่ม field `bed_type` (VARCHAR) - ประเภทเตียง เช่น King Size, Queen Size
  - เพิ่ม field `room_size` (DECIMAL) - ขนาดห้อง (ตารางเมตร)

### 2. Server Actions
- **src/app/actions/landing.ts** (ใหม่)
  - `getRoomTypesForLanding()` - ดึงข้อมูล room types พร้อมรูปภาพจากฐานข้อมูล
  - แปลง amenities จาก string array เป็น RoomAmenity[] (มี icon และ label)
  - จัดการรูปภาพ cover และ gallery

- **src/app/actions/rooms.ts** (แก้ไข)
  - `createRoomType()` - รองรับ bed_type และ room_size
  - `updateRoomType()` - รองรับ bed_type และ room_size

### 3. Components

#### Admin CMS
- **src/components/admin/cms/RoomTypeForm.tsx** (แก้ไข)
  - เพิ่ม dropdown สำหรับเลือก bed_type
  - เพิ่ม input สำหรับกรอก room_size
  - Validation สำหรับ fields ใหม่

- **src/components/admin/cms/RoomTypeCard.tsx** (แก้ไข)
  - แสดง bed_type และ room_size ในการ์ด

#### Landing Page
- **src/components/sections/RoomTypesSection.tsx** (แก้ไข)
  - เพิ่มการจัดการกรณีไม่มีข้อมูล (empty state)
  - แสดงข้อความ "ยังไม่มีข้อมูลประเภทห้องพัก" เมื่อไม่มีข้อมูล

- **src/app/page.tsx** (แก้ไข)
  - เรียกใช้ `getRoomTypesForLanding()` แทน mock data
  - Fallback ไปใช้ mock data ถ้าไม่มี hotel_id

## วิธีใช้งาน

### 1. รัน Migration
```bash
# เชื่อมต่อกับ Supabase และรัน SQL
psql -h <your-host> -U <user> -d <database> -f migrations/add_room_type_fields.sql
```

หรือรันใน Supabase SQL Editor:
```sql
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS bed_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS room_size DECIMAL(6, 2);

UPDATE room_types 
SET bed_type = 'King Size', 
    room_size = 45.00 
WHERE bed_type IS NULL;
```

### 2. จัดการข้อมูลผ่าน Admin CMS
1. เข้าสู่ระบบ Admin
2. ไปที่ CMS > Rooms
3. สร้างหรือแก้ไข Room Type
4. กรอกข้อมูล:
   - ชื่อประเภทห้อง
   - คำอธิบาย
   - ราคาต่อคืน
   - จำนวนผู้เข้าพัก
   - **ประเภทเตียง** (ใหม่)
   - **ขนาดห้อง** (ใหม่)
   - สิ่งอำนวยความสะดวก
5. อัปโหลดรูปภาพ
6. ตั้งรูปหน้าปก
7. เปิดใช้งาน (Active)

### 3. ตรวจสอบผลลัพธ์
- เปิดหน้า Landing Page
- เลื่อนไปที่ส่วน "Room Types"
- ข้อมูลจะแสดงจากฐานข้อมูลจริง

## Amenities Icon Mapping

ระบบจะแปลง amenities จาก string เป็น icon อัตโนมัติ:

| Amenity | Icon |
|---------|------|
| WiFi | wifi |
| แอร์ | ac |
| TV | tv |
| ตู้เย็น | minibar |
| ระเบียง | balcony |
| อ่างอาบน้ำ | bath |
| อื่นๆ | minibar (default) |

## Bed Type Options

- King Size
- Queen Size
- Twin
- King + Twin
- Double
- Single

## หมายเหตุ

1. **Fallback**: ถ้าไม่มีข้อมูลในฐานข้อมูล ระบบจะใช้ mock data
2. **Empty State**: ถ้าไม่มี room types ที่ active จะแสดงข้อความ "ยังไม่มีข้อมูลประเภทห้องพัก"
3. **Responsive**: รองรับทุกขนาดหน้าจอ (mobile-first design)
4. **Performance**: ดึงข้อมูลและรูปภาพในครั้งเดียว (optimized query)
