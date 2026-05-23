-- ============================================================
-- Multi-room Booking Group
-- เพิ่มคอลัมน์ booking_group_id เพื่อจัดกลุ่ม booking ที่มาจาก
-- การจองหลายห้องในรายการเดียวกัน (one cart = one group)
-- ============================================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_group_id UUID;

COMMENT ON COLUMN bookings.booking_group_id IS
  'รหัสกลุ่มของการจองหลายห้องในตะกร้าเดียวกัน (NULL = single-room booking)';

CREATE INDEX IF NOT EXISTS idx_bookings_booking_group_id
  ON bookings (booking_group_id)
  WHERE booking_group_id IS NOT NULL;
