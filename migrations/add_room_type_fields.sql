-- เพิ่ม fields สำหรับ room_types เพื่อรองรับการแสดงผลใน Landing Page

ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS bed_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS room_size DECIMAL(6, 2);

-- อัปเดตค่าเริ่มต้นสำหรับข้อมูลที่มีอยู่แล้ว
UPDATE room_types 
SET bed_type = 'King Size', 
    room_size = 45.00 
WHERE bed_type IS NULL;

-- เพิ่ม comment
COMMENT ON COLUMN room_types.bed_type IS 'ประเภทเตียง เช่น King Size, Queen Size, Twin';
COMMENT ON COLUMN room_types.room_size IS 'ขนาดห้อง (ตารางเมตร)';
