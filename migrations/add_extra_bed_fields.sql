-- เพิ่ม fields สำหรับ room_types เพื่อรองรับระบบเตียงเสริม/คนเข้าพักเกินจำนวน max
ALTER TABLE room_types 
ADD COLUMN IF NOT EXISTS extra_bed_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS max_extra_beds INT NOT NULL DEFAULT 0;

-- เพิ่ม comment อธิบายฟิลด์
COMMENT ON COLUMN room_types.extra_bed_price IS 'ราคาคิดเพิ่มเตียงเสริมต่อคน/คืน';
COMMENT ON COLUMN room_types.max_extra_beds IS 'จำนวนเตียงเสริมที่เพิ่มได้สูงสุด';
