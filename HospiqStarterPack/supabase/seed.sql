-- Clean up existing mock data from tables in dependency order
DELETE FROM line_chat_history;
DELETE FROM line_handoff_events;
DELETE FROM line_sessions;
DELETE FROM line_configs;
DELETE FROM bookings;
DELETE FROM rooms;
DELETE FROM roomtype_amenities;
DELETE FROM roomtype_images;
DELETE FROM roomtypes;
DELETE FROM ai_faqs;
DELETE FROM ai_testcases;
DELETE FROM ai_settings;
DELETE FROM hotel_images;
DELETE FROM promotions;
DELETE FROM accounts;
DELETE FROM hotels;

-- Insert Hotel: เฮือนสะล้อ บูทีค รีสอร์ท น่าน (Huan Salor Boutique Resort Nan)
-- We use ID '12af7b54-d63d-4525-9c7a-429726241f49' to match the test runner hotel ID.
INSERT INTO hotels (
  id,
  name,
  slug,
  address,
  description,
  contact_phone,
  contact_email,
  line_oa_id,
  facebook_url,
  website_url,
  map_url,
  has_webbooking,
  webbooking_url,
  onboarding_completed,
  status,
  admin_verify_code
) VALUES (
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'เฮือนสะล้อ บูทีค รีสอร์ท น่าน',
  'huan-salor-nan',
  '123 ถนนสุริยพงษ์ ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000',
  'รีสอร์ทไม้สักสไตล์ล้านนาประยุกต์ ตั้งอยู่ใจกลางเมืองน่าน ติดริมแม่น้ำน่าน ใกล้วัดภูมินทร์และถนนคนเดิน บรรยากาศเงียบสงบ ร่มรื่นด้วยสวนดอกไม้เมืองหนาวและเสียงดนตรีสะล้อซอซึงเบาๆ เหมาะสำหรับการพักผ่อนอย่างแท้จริง สัมผัสวิถีชีวิตสโลว์ไลฟ์ของเมืองน่านพร้อมบริการที่อบอุ่นเป็นกันเอง',
  '054-710123, 081-2345678',
  'contact@huansalornan.mock',
  '@huansalornan',
  'https://facebook.com/huansalornan',
  NULL, -- ที่พักนี้ไม่มีเว็บไซต์
  'https://maps.google.com/?q=Huan+Salor+Boutique+Resort+Nan',
  false, -- ไม่มีระบบ Web Booking จองตรงเท่านั้น
  NULL,
  true,
  'active',
  'HUAN-SALOR-NAN'
);

-- Insert AI Settings
INSERT INTO ai_settings (
  hotel_id,
  assistant_name,
  assistant_gender_tone,
  language,
  supported_languages,
  sale_mode_enabled,
  fallback_to_admin_enabled,
  admin_contact_message,
  booking_cta_policy,
  handoff_policy,
  fallback_policy,
  max_reply_length,
  system_prompt
) VALUES (
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'น้องสะล้อ',
  'female_polite',
  'th',
  '["th", "en"]'::jsonb,
  true,
  true,
  'หากต้องการสอบถามเพิ่มเติมหรือติดต่อเจ้าหน้าที่โดยตรง สามารถโทร 054-710123 หรือ 081-2345678 ได้เลยนะเจ้า แอดมินน้องสะล้อยินดีบริการค่ะ',
  '{"mode": "suggest_contact_when_ready"}'::jsonb, -- แนะนำให้ติดต่อจองทางแชท/โทรศัพท์ เนื่องจากไม่มีเว็บจอง
  '{"handoffWhen": ["payment_issue", "complaint", "booking_ready"]}'::jsonb,
  '{"useHotelDataOnly": true}'::jsonb,
  900,
  'คุณคือ "แอดมินน้องสะล้อ" พนักงานต้อนรับ AI ผู้สุภาพ อบอุ่น และใส่ใจบริการของ "เฮือนสะล้อ บูทีค รีสอร์ท น่าน" 
สไตล์การตอบกลับ:
- ใช้ภาษาไทยที่สุภาพ มีหางเสียงลงท้ายด้วยคำเมืองเหนือ/ล้านนาอย่างเป็นธรรมชาติ เช่น "เจ้า", "นะเจ้า", "ยินดีต้อนรับเจ้า"
- พูดจาด้วยน้ำเสียงนุ่มนวล เป็นกันเอง สื่อถึงความเงียบสงบผ่อนคลาย (Slow Life) ของจังหวัดน่าน
- แทนตัวเองว่า "แอดมินน้องสะล้อ" หรือ "แอดมิน" เสมอ และเรียกคู่สนทนาว่า "คุณลูกค้า" หรือตามชื่อของลูกค้าหากทราบ
- *สำคัญมาก*: ที่พักของเราไม่มีเว็บไซต์สำหรับจองห้องพัก หากลูกค้าสนใจจอง ให้แนะนำให้จองโดยตรงผ่าน Line OA: @huansalornan หรือโทร 054-710123, 081-2345678 เท่านั้นเจ้า

ข้อมูลห้องพักของเรา:
1. Deluxe Lanna Garden: ห้องเริ่มต้นวิวสวนสวย ราคา 1,800 บาท/คืน เตียงเดี่ยว King Size 6 ฟุต พักได้ 2 ท่าน เสริมเตียงได้สูงสุด 1 ท่าน (600 บาท/คืน)
2. Grand Teak Suite: ห้องสูทไม้สักทองสุดหรู พร้อมอ่างอาบน้ำไม้โอ๊ค ราคา 3,500 บาท/คืน เตียง California King 7 ฟุต พักได้ 2 ท่าน เสริมเตียงได้สูงสุด 2 ท่าน (800 บาท/คืน/ท่าน)
3. Nan Riverfront Family Villa: บ้านพักวิลล่าริมแม่น้ำน่านสำหรับครอบครัว ราคา 5,500 บาท/คืน มี 2 ห้องนอน พักได้ 4 ท่าน เสริมเตียงได้สูงสุด 2 ท่าน (1,000 บาท/คืน/ท่าน)'
);

-- Insert Room Types
-- Deluxe Lanna Garden
INSERT INTO roomtypes (
  id,
  hotel_id,
  name,
  description,
  mood_description,
  base_price,
  bed_type,
  bed_size,
  standard_capacity,
  max_capacity,
  max_extra_beds,
  extra_bed_price,
  pet_policy,
  total_rooms,
  is_active,
  room_size,
  sort_order,
  is_featured,
  price_note
) VALUES (
  'd1111111-1111-1111-1111-111111111111',
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'Deluxe Lanna Garden',
  'ห้องพักตกแต่งสไตล์ล้านนาประยุกต์ วิวสวนหย่อมดอกไม้เมืองหนาว พร้อมระเบียงส่วนตัวสำหรับรับลมเย็นยามเช้า',
  'อบอุ่น ผ่อนคลาย ใกล้ชิดธรรมชาติ ด้วยงานไม้สักแท้และโทนแสงวอร์มไวท์ที่ให้ความรู้สึกปลอดภัยเหมือนบ้านพักส่วนตัว',
  1800.00,
  'King Bed',
  '6 Feet',
  2,
  3,
  1,
  600.00,
  'ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพักเจ้า',
  6,
  true,
  '32 sq.m.',
  1,
  true,
  'ราคาเริ่มต้น รวมอาหารเช้าแบบล้านนาพื้นเมือง'
);

-- Grand Teak Suite
INSERT INTO roomtypes (
  id,
  hotel_id,
  name,
  description,
  mood_description,
  base_price,
  bed_type,
  bed_size,
  standard_capacity,
  max_capacity,
  max_extra_beds,
  extra_bed_price,
  pet_policy,
  total_rooms,
  is_active,
  room_size,
  sort_order,
  is_featured,
  price_note
) VALUES (
  'd2222222-2222-2222-2222-222222222222',
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'Grand Teak Suite',
  'ห้องสวีทขนาดใหญ่พิเศษ ตกแต่งด้วยไม้สักทองทั้งห้อง โดดเด่นด้วยเฟอร์นิเจอร์สั่งทำพิเศษ อ่างอาบน้ำไม้โอ๊คแบบลอยตัว และมุมนั่งเล่นแยกเป็นสัดส่วน',
  'หรูหราอย่างมีระดับ เงียบสงบ เป็นส่วนตัวสูง กลิ่นอายไม้สักและน้ำมันหอมระเหยธรรมชาติช่วยให้จิตใจสงบและฟื้นฟูพลังชีวิต',
  3500.00,
  'California King',
  '7 Feet',
  2,
  4,
  2,
  800.00,
  'ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพักเจ้า',
  3,
  true,
  '55 sq.m.',
  2,
  true,
  'ราคาเริ่มต้น รวมอาหารเช้าและบริการชุดน้ำชาต้อนรับ'
);

-- Nan Riverfront Family Villa
INSERT INTO roomtypes (
  id,
  hotel_id,
  name,
  description,
  mood_description,
  base_price,
  bed_type,
  bed_size,
  standard_capacity,
  max_capacity,
  max_extra_beds,
  extra_bed_price,
  pet_policy,
  total_rooms,
  is_active,
  room_size,
  sort_order,
  is_featured,
  price_note
) VALUES (
  'd3333333-3333-3333-3333-333333333333',
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'Nan Riverfront Family Villa',
  'บ้านพักเป็นหลังแบบวิลล่าตั้งอยู่ริมแม่น้ำน่าน สำหรับครอบครัวหรือกลุ่มเพื่อน มี 2 ห้องนอน 2 ห้องน้ำ ห้องนั่งเล่นส่วนตัว และระเบียงรับลมริมแม่น้ำขนาดใหญ่',
  'อบอุ่น มีชีวิตชีวา รื่นรมย์ด้วยวิวแม่น้ำไหลเอื่อยพาดผ่านทิวเขา สวรรค์แห่งการพักผ่อนของครอบครัวที่ผสานธรรมชาติเข้ากับความสะดวกสบายครบครัน',
  5500.00,
  '1 King Bed + 2 Twin Beds',
  '6 Feet + 3.5 Feet',
  4,
  6,
  2,
  1000.00,
  'ไม่อนุญาตให้นำสัตว์เลี้ยงเข้าพักเจ้า',
  2,
  true,
  '85 sq.m.',
  3,
  true,
  'ราคาเริ่มต้นสำหรับ 4 ท่าน รวมอาหารเช้าและผลไม้ต้อนรับตามฤดูกาล'
);

-- Insert Amenities for Room Types
-- Deluxe Lanna Garden Amenities
INSERT INTO roomtype_amenities (hotel_id, roomtype_id, name) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'เครื่องปรับอากาศ'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ฟรี Wi-Fi ความเร็วสูง'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ทีวีจอแบน Smart TV'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'มินิบาร์และน้ำดื่มฟรี'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ตู้เซฟนิรภัย'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ชุดชาและกาแฟสมุนไพรพื้นบ้าน'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ฝักบัว Rain Shower'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ไดร์เป่าผม'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'เสื้อคลุมอาบน้ำและรองเท้าสลิปเปอร์'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'ระเบียงส่วนตัวชมวิวสวน');

-- Grand Teak Suite Amenities
INSERT INTO roomtype_amenities (hotel_id, roomtype_id, name) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'เครื่องปรับอากาศ'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'ฟรี Wi-Fi ความเร็วสูง'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'ทีวีจอแบน Smart TV'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'มินิบาร์และน้ำดื่มฟรี'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'ตู้เซฟนิรภัย'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'อ่างอาบน้ำไม้โอ๊คแบบลอยตัว'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'เครื่องชงกาแฟแคปซูล Premium'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'ลำโพงบลูทูธ'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'ผลไม้ต้อนรับ (Welcome Fruit)'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'เครื่องประทินผิวออร์แกนิกเกรดพรีเมียม'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'เตารีดและโต๊ะรีดผ้า');

-- Nan Riverfront Family Villa Amenities
INSERT INTO roomtype_amenities (hotel_id, roomtype_id, name) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'เครื่องปรับอากาศ'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'ฟรี Wi-Fi ความเร็วสูง'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'ห้องครัวขนาดเล็กพร้อมไมโครเวฟและตู้เย็นขนาดใหญ่'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'โต๊ะรับประทานอาหารสำหรับครอบครัว'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'ระเบียงรับลมริมแม่น้ำขนาดใหญ่พร้อมเก้าอี้พักผ่อน'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'เกมกระดานสำหรับครอบครัว (Board Games Selection)'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'ระบบเสียงบลูทูธรอบทิศทาง'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'อ่างอาบน้ำจากุซซี่ริมระเบียง');

-- Insert Rooms (Physical inventory)
-- Deluxe Lanna Garden (6 rooms)
INSERT INTO rooms (hotel_id, roomtype_id, room_number, floor, status, is_active) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '101', '1', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '102', '1', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '103', '1', 'occupied', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '201', '2', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '202', '2', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', '203', '2', 'available', true);

-- Grand Teak Suite (3 rooms)
INSERT INTO rooms (hotel_id, roomtype_id, room_number, floor, status, is_active) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', '301', '3', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', '302', '3', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', '303', '3', 'available', true);

-- Nan Riverfront Family Villa (2 rooms)
INSERT INTO rooms (hotel_id, roomtype_id, room_number, floor, status, is_active) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'V1', '1', 'available', true),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'V2', '1', 'available', true);

-- Insert Bookings (Varying availability by date)
-- 1. Deluxe Lanna Garden: fully booked on June 1 to June 3, 2026 (all 6 rooms booked)
-- and partially booked on May 28 to May 30, 2026 (2 rooms booked, 4 available)
INSERT INTO bookings (hotel_id, roomtype_id, guest_name, guest_phone, checkin_date, checkout_date, guest_count, room_count, status, source) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'คุณสมพงษ์ รักดี', '089-111-2222', '2026-06-01', '2026-06-03', 6, 3, 'confirmed', 'manual_admin'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'คุณอารีย์ ใจดี', '089-333-4444', '2026-06-01', '2026-06-03', 6, 3, 'confirmed', 'manual_admin'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd1111111-1111-1111-1111-111111111111', 'คุณวรวิทย์ มุ่งมั่น', '089-555-6666', '2026-05-28', '2026-05-30', 4, 2, 'confirmed', 'line_ai');

-- 2. Grand Teak Suite: fully booked on May 29 to May 31, 2026 (all 3 rooms booked)
-- and partially booked on May 26 to May 28, 2026 (2 rooms booked, 1 available)
INSERT INTO bookings (hotel_id, roomtype_id, guest_name, guest_phone, checkin_date, checkout_date, guest_count, room_count, status, source) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'คุณวิภาวรรณ สวยงาม', '089-777-8888', '2026-05-29', '2026-05-31', 6, 3, 'confirmed', 'manual_admin'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd2222222-2222-2222-2222-222222222222', 'คุณมนัส ตั้งใจ', '089-999-0000', '2026-05-26', '2026-05-28', 4, 2, 'confirmed', 'manual_admin');

-- 3. Nan Riverfront Family Villa: fully booked on June 5 to June 7, 2026 (all 2 rooms booked)
-- and partially booked on May 27 to May 29, 2026 (1 room booked, 1 available)
INSERT INTO bookings (hotel_id, roomtype_id, guest_name, guest_phone, checkin_date, checkout_date, guest_count, room_count, status, source) VALUES
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'คุณธเนศ มีสุข', '088-111-2222', '2026-06-05', '2026-06-07', 8, 2, 'confirmed', 'manual_admin'),
('12af7b54-d63d-4525-9c7a-429726241f49', 'd3333333-3333-3333-3333-333333333333', 'คุณณัฐชนนท์ ก้าวไกล', '088-333-4444', '2026-05-27', '2026-05-29', 4, 1, 'confirmed', 'line_ai');

-- Insert Promotions
INSERT INTO promotions (
  hotel_id,
  title,
  description,
  start_date,
  end_date,
  is_active
) VALUES (
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'เปิดเฮือนรับขวัญ แอ่วเมืองน่าน',
  'ส่วนลดพิเศษ 10% สำหรับผู้เข้าพัก 2 คืนขึ้นไปในห้อง Grand Teak Suite หรือ Nan Riverfront Family Villa ฟรีชุดน้ำชาตอนบ่ายริมแม่น้ำน่าน 1 เซ็ตเจ้า',
  '2026-05-01',
  '2026-08-31',
  true
);

-- Insert AI FAQs (for local dev fallback, without embeddings)
INSERT INTO ai_faqs (
  hotel_id,
  question,
  answer,
  category,
  language,
  keywords,
  sort_order
) VALUES
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'โรงแรมมีที่จอดรถไหม',
  'มีที่จอดรถส่วนตัวฟรีในรีสอร์ทสำหรับผู้เข้าพักค่ะ รองรับรถยนต์ได้กว่า 15 คัน มีระบบกล้องวงจรปิดและผู้ดูแลความปลอดภัยตลอด 24 ชั่วโมง สามารถนำรถมาจอดได้อย่างสะดวกและปลอดภัยเลยนะเจ้า',
  'facility',
  'th',
  '["ที่จอดรถ", "จอดรถ", "parking", "จอดรถยนต์"]'::jsonb,
  0
),
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'เวลาเช็กอินและเช็กเอาต์คือกี่โมง',
  'เวลาเช็กอินของเฮือนสะล้อเริ่มตั้งแต่ 14:00 น. เป็นต้นไป และเวลาเช็กเอาต์ก่อน 12:00 น. เจ้า หากคุณลูกค้าเดินทางมาถึงก่อนเวลาหรือต้องการเลทเช็กเอาต์ สามารถแจ้งแอดมินล่วงหน้าเพื่อตรวจสอบห้องว่างได้นะเจ้า',
  'policy',
  'th',
  '["เช็กอิน", "เช็คอิน", "เช็กเอาต์", "เช็คเอาท์", "เวลาเช็กอิน", "เวลาเช็คอิน", "checkout"]'::jsonb,
  1
),
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'ห้องไหนเหมาะสำหรับพักสองคน',
  'สำหรับ 2 ท่าน แอดมินแนะนำห้อง Deluxe Lanna Garden ราคา 1,800 บาท/คืน (วิวสวนหย่อมสไตล์ล้านนา อบอุ่น ผ่อนคลาย) หรือถ้าต้องการความโรแมนติกเป็นส่วนตัวสูง แนะนำห้อง Grand Teak Suite ราคา 3,500 บาท/คืน (อ่างอาบน้ำไม้โอ๊คลอยตัวตกแต่งไม้สักทองทั้งห้อง) เจ้า',
  'room',
  'th',
  '["สองคน", "2 ท่าน", "2 คน", "แนะนำห้อง", "พักสองคน"]'::jsonb,
  2
),
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'มีห้องพักสำหรับครอบครัวหรือพักหลายคนไหม',
  'มีห้องพัก Nan Riverfront Family Villa เป็นบ้านพักวิลล่าริมแม่น้ำน่านส่วนตัวสำหรับครอบครัวหรือกลุ่มเพื่อนค่ะ ราคาเริ่มต้น 5,500 บาท/คืน พักได้ 4 ท่าน (มี 2 ห้องนอน 2 ห้องน้ำ) และสามารถเสริมเตียงได้สูงสุดอีก 2 ท่าน (ท่านละ 1,000 บาท/คืน) รองรับได้สูงสุด 6 ท่านเลยเจ้า',
  'room',
  'th',
  '["ครอบครัว", "family", "หลายคน", "พักหลายคน", "บ้านพัก", "วิลล่า"]'::jsonb,
  3
),
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'จองผ่านเว็บไซต์ได้ไหม มีระบบเว็บไหม',
  'ต้องขออภัยด้วยนะเจ้า ปัจจุบันเฮือนสะล้อไม่มีระบบจองผ่านเว็บไซต์ค่ะ คุณลูกค้าสามารถทำการจองโดยตรงผ่าน Line OA: @huansalornan หรือโทรติดต่อเบอร์ 054-710123 / 081-2345678 ได้เลยนะเจ้า แอดมินและพนักงานยินดีอำนวยความสะดวกให้ตลอดเวลาค่ะ',
  'booking',
  'th',
  '["จอง", "booking", "เว็บ", "เว็บไซต์", "จองออนไลน์", "จองผ่านเว็บ"]'::jsonb,
  4
),
(
  '12af7b54-d63d-4525-9c7a-429726241f49',
  'มีสระว่ายน้ำหรือห้องฟิตเนสให้ใช้บริการไหม',
  'ต้องขออภัยด้วยนะเจ้า ทางเฮือนสะล้อเน้นบรรยากาศธรรมชาติและการพักผ่อนที่เงียบสงบเป็นส่วนตัว จึงไม่มีสระว่ายน้ำหรือห้องออกกำลังกาย (ฟิตเนส) บริการค่ะ แต่เรามีระเบียงริมแม่น้ำสำหรับเล่นโยคะรับลมอุ่นๆ และพื้นที่สวนสมุนไพรให้เดินเล่นพักผ่อนจิตใจแทนนะเจ้า',
  'facility',
  'th',
  '["สระว่ายน้ำ", "ฟิตเนส", "gym", "pool", "ออกกำลังกาย", "สระว่ายน้ำไหม"]'::jsonb,
  5
);
