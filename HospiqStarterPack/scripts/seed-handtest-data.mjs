import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

loadEnv(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const targetHotelId = "12af7b54-d63d-4525-9c7a-429726241f49";
const hotelSlug = "huan-salor-nan";

const faqSeeds = [
  {
    question: "โรงแรมมีที่จอดรถไหม",
    answer: "มีที่จอดรถส่วนตัวฟรีในรีสอร์ทสำหรับผู้เข้าพักค่ะ รองรับรถยนต์ได้กว่า 15 คัน มีระบบกล้องวงจรปิดและผู้ดูแลความปลอดภัยตลอด 24 ชั่วโมง สามารถนำรถมาจอดได้อย่างสะดวกและปลอดภัยเลยนะเจ้า",
    category: "facility",
    language: "th",
    keywords: ["ที่จอดรถ", "จอดรถ", "parking", "จอดรถยนต์"],
  },
  {
    question: "เวลาเช็กอินและเช็กเอาต์คือกี่โมง",
    answer: "เวลาเช็กอินของเฮือนสะล้อเริ่มตั้งแต่ 14:00 น. เป็นต้นไป และเวลาเช็กเอาต์ก่อน 12:00 น. เจ้า หากคุณลูกค้าเดินทางมาถึงก่อนเวลาหรือต้องการเลทเช็กเอาต์ สามารถแจ้งแอดมินล่วงหน้าเพื่อตรวจสอบห้องว่างได้นะเจ้า",
    category: "policy",
    language: "th",
    keywords: ["เช็กอิน", "เช็คอิน", "เช็กเอาต์", "เช็คเอาท์", "เวลาเช็กอิน", "เวลาเช็คอิน", "checkout"],
  },
  {
    question: "ห้องไหนเหมาะสำหรับพักสองคน",
    answer: "สำหรับ 2 ท่าน แอดมินแนะนำห้อง Deluxe Lanna Garden ราคา 1,800 บาท/คืน (วิวสวนหย่อมสไตล์ล้านนา อบอุ่น ผ่อนคลาย) หรือถ้าต้องการความโรแมนติกเป็นส่วนตัวสูง แนะนำห้อง Grand Teak Suite ราคา 3,500 บาท/คืน (อ่างอาบน้ำไม้โอ๊คลอยตัวตกแต่งไม้สักทองทั้งห้อง) เจ้า",
    category: "room",
    language: "th",
    keywords: ["สองคน", "2 ท่าน", "2 คน", "แนะนำห้อง", "พักสองคน"],
  },
  {
    question: "มีห้องพักสำหรับครอบครัวหรือพักหลายคนไหม",
    answer: "มีห้องพัก Nan Riverfront Family Villa เป็นบ้านพักวิลล่าริมแม่น้ำน่านส่วนตัวสำหรับครอบครัวหรือกลุ่มเพื่อนค่ะ ราคาเริ่มต้น 5,500 บาท/คืน พักได้ 4 ท่าน (มี 2 ห้องนอน 2 ห้องน้ำ) และสามารถเสริมเตียงได้สูงสุดอีก 2 ท่าน (ท่านละ 1,000 บาท/คืน) รองรับได้สูงสุด 6 ท่านเลยเจ้า",
    category: "room",
    language: "th",
    keywords: ["ครอบครัว", "family", "หลายคน", "พักหลายคน", "บ้านพัก", "วิลล่า"],
  },
  {
    question: "จองผ่านเว็บไซต์ได้ไหม มีระบบเว็บไหม",
    answer: "ต้องขออภัยด้วยนะเจ้า ปัจจุบันเฮือนสะล้อไม่มีระบบจองผ่านเว็บไซต์ค่ะ คุณลูกค้าสามารถทำการจองโดยตรงผ่าน Line OA: @huansalornan หรือโทรติดต่อเบอร์ 054-710123 / 081-2345678 ได้เลยนะเจ้า แอดมินและพนักงานยินดีอำนวยความสะดวกให้ตลอดเวลาค่ะ",
    category: "booking",
    language: "th",
    keywords: ["จอง", "booking", "เว็บ", "เว็บไซต์", "จองออนไลน์", "จองผ่านเว็บ"],
  },
  {
    question: "มีสระว่ายน้ำหรือห้องฟิตเนสให้ใช้บริการไหม",
    answer: "ต้องขออภัยด้วยนะเจ้า ทางเฮือนสะล้อเน้นบรรยากาศธรรมชาติและการพักผ่อนที่เงียบสงบเป็นส่วนตัว จึงไม่มีสระว่ายน้ำหรือห้องออกกำลังกาย (ฟิตเนส) บริการค่ะ แต่เรามีระเบียงริมแม่น้ำสำหรับเล่นโยคะรับลมอุ่นๆ และพื้นที่สวนสมุนไพรให้เดินเล่นพักผ่อนจิตใจแทนนะเจ้า",
    category: "facility",
    language: "th",
    keywords: ["สระว่ายน้ำ", "ฟิตเนส", "gym", "pool", "ออกกำลังกาย", "สระว่ายน้ำไหม"],
  },
];

console.log("Cleaning up old mock data...");
await cleanupOldMockData();

console.log("Seeding new Lanna Resort mock data...");
const hotel = await insertHotel();
const roomtypes = await seedRoomtypes(hotel.id);
await seedRoomtypeAmenities(hotel.id);
await seedRooms(hotel.id);
await seedBookings(hotel.id);
await seedAiSettings(hotel.id);
await seedPromotions(hotel.id);
await seedFaqs(hotel.id);

console.log(JSON.stringify({
  hotelId: hotel.id,
  hotelSlug,
  roomtypes: roomtypes.map((roomtype) => roomtype.name),
  faqCount: faqSeeds.length,
}, null, 2));

function loadEnv(path) {
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function cleanupOldMockData() {
  const deleteFromTable = async (tableName, column = "hotel_id", value = targetHotelId) => {
    const { error } = await supabase.from(tableName).delete().eq(column, value);
    if (error) console.warn(`Warning cleaning ${tableName}: ${error.message}`);
  };

  // Delete all dependents of the target hotel ID
  await deleteFromTable("line_chat_history");
  await deleteFromTable("line_handoff_events");
  await deleteFromTable("line_sessions");
  await deleteFromTable("line_configs");
  await deleteFromTable("bookings");
  await deleteFromTable("rooms");
  await deleteFromTable("roomtype_amenities");
  await deleteFromTable("roomtype_images");
  await deleteFromTable("roomtypes");
  await deleteFromTable("ai_faqs");
  await deleteFromTable("ai_testcases");
  await deleteFromTable("ai_settings");
  await deleteFromTable("hotel_images");
  await deleteFromTable("promotions");
  await deleteFromTable("accounts");
  await deleteFromTable("hotels", "id", targetHotelId);

  // Also search and delete the old hotel IDs with matching slugs
  const oldSlugs = ["huan-salor-nan", "hospiq-handtest-hotel", "hospiq-demo"];
  for (const slug of oldSlugs) {
    const { data: existingHotels } = await supabase.from("hotels").select("id").eq("slug", slug);
    if (existingHotels && existingHotels.length > 0) {
      for (const h of existingHotels) {
        await deleteFromTable("line_chat_history", "hotel_id", h.id);
        await deleteFromTable("line_handoff_events", "hotel_id", h.id);
        await deleteFromTable("line_sessions", "hotel_id", h.id);
        await deleteFromTable("line_configs", "hotel_id", h.id);
        await deleteFromTable("bookings", "hotel_id", h.id);
        await deleteFromTable("rooms", "hotel_id", h.id);
        await deleteFromTable("roomtype_amenities", "hotel_id", h.id);
        await deleteFromTable("roomtype_images", "hotel_id", h.id);
        await deleteFromTable("roomtypes", "hotel_id", h.id);
        await deleteFromTable("ai_faqs", "hotel_id", h.id);
        await deleteFromTable("ai_testcases", "hotel_id", h.id);
        await deleteFromTable("ai_settings", "hotel_id", h.id);
        await deleteFromTable("hotel_images", "hotel_id", h.id);
        await deleteFromTable("promotions", "hotel_id", h.id);
        await deleteFromTable("accounts", "hotel_id", h.id);
        await deleteFromTable("hotels", "id", h.id);
      }
    }
  }
}

async function insertHotel() {
  const { data, error } = await supabase
    .from("hotels")
    .insert({
      id: targetHotelId,
      name: "เฮือนสะล้อ บูทีค รีสอร์ท น่าน",
      slug: hotelSlug,
      address: "123 ถนนสุริยพงษ์ ตำบลในเวียง อำเภอเมืองน่าน จังหวัดน่าน 55000",
      description: "รีสอร์ทไม้สักสไตล์ล้านนาประยุกต์ ตั้งอยู่ใจกลางเมืองน่าน ติดริมแม่น้ำน่าน ใกล้วัดภูมินทร์และถนนคนเดิน บรรยากาศเงียบสงบ ร่มรื่นด้วยสวนดอกไม้เมืองหนาวและเสียงดนตรีสะล้อซอซึงเบาๆ เหมาะสำหรับการพักผ่อนอย่างแท้จริง สัมผัสวิถีชีวิตสโลว์ไลฟ์ของเมืองน่านพร้อมบริการที่อบอุ่นเป็นกันเอง",
      contact_phone: "054-710123, 081-2345678",
      contact_email: "contact@huansalornan.mock",
      line_oa_id: "@huansalornan",
      facebook_url: "https://facebook.com/huansalornan",
      website_url: null,
      map_url: "https://maps.google.com/?q=Huan+Salor+Boutique+Resort+Nan",
      has_webbooking: false,
      onboarding_completed: true,
      status: "active",
      admin_verify_code: "HUAN-SALOR-NAN",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function seedRoomtypes(hotelId) {
  const seeds = [
    {
      id: "d1111111-1111-1111-1111-111111111111",
      name: "Deluxe Lanna Garden",
      description: "ห้องพักตกแต่งสไตล์ล้านนาประยุกต์ วิวสวนหย่อมดอกไม้เมืองหนาว พร้อมระเบียงส่วนตัวสำหรับรับลมเย็นยามเช้า",
      mood_description: "อบอุ่น ผ่อนคลาย ใกล้ชิดธรรมชาติ ด้วยงานไม้สักแท้และโทนแสงวอร์มไวท์ที่ให้ความรู้สึกปลอดภัยเหมือนบ้านพักส่วนตัว",
      base_price: 1800,
      bed_type: "King Bed",
      bed_size: "6 Feet",
      standard_capacity: 2,
      max_capacity: 3,
      max_extra_beds: 1,
      extra_bed_price: 600,
      total_rooms: 6,
      room_size: "32 sq.m.",
      sort_order: 1,
      is_featured: true,
      price_note: "ราคาเริ่มต้น รวมอาหารเช้าแบบล้านนาพื้นเมือง",
    },
    {
      id: "d2222222-2222-2222-2222-222222222222",
      name: "Grand Teak Suite",
      description: "ห้องสวีทขนาดใหญ่พิเศษ ตกแต่งด้วยไม้สักทองทั้งห้อง โดดเด่นด้วยเฟอร์นิเจอร์สั่งทำพิเศษ อ่างอาบน้ำไม้โอ๊คแบบลอยตัว และมุมนั่งเล่นแยกเป็นสัดส่วน",
      mood_description: "หรูหราอย่างมีระดับ เงียบสงบ เป็นส่วนตัวสูง กลิ่นอายไม้สักและน้ำมันหอมระเหยธรรมชาติช่วยให้จิตใจสงบและฟื้นฟูพลังชีวิต",
      base_price: 3500,
      bed_type: "California King",
      bed_size: "7 Feet",
      standard_capacity: 2,
      max_capacity: 4,
      max_extra_beds: 2,
      extra_bed_price: 800,
      total_rooms: 3,
      room_size: "55 sq.m.",
      sort_order: 2,
      is_featured: true,
      price_note: "ราคาเริ่มต้น รวมอาหารเช้าและบริการชุดน้ำชาต้อนรับ",
    },
    {
      id: "d3333333-3333-3333-3333-333333333333",
      name: "Nan Riverfront Family Villa",
      description: "บ้านพักเป็นหลังแบบวิลล่าตั้งอยู่ริมแม่น้ำน่าน สำหรับครอบครัวหรือกลุ่มเพื่อน มี 2 ห้องนอน 2 ห้องน้ำ ห้องนั่งเล่นส่วนตัว และระเบียงรับลมริมแม่น้ำขนาดใหญ่",
      mood_description: "อบอุ่น มีชีวิตชีวา รื่นรมย์ด้วยวิวแม่น้ำไหลเอื่อยพาดผ่านทิวเขา สวรรค์แห่งการพักผ่อนของครอบครัวที่ผสานธรรมชาติเข้ากับความสะดวกสบายครบครัน",
      base_price: 5500,
      bed_type: "1 King Bed + 2 Twin Beds",
      bed_size: "6 Feet + 3.5 Feet",
      standard_capacity: 4,
      max_capacity: 6,
      max_extra_beds: 2,
      extra_bed_price: 1000,
      total_rooms: 2,
      room_size: "85 sq.m.",
      sort_order: 3,
      is_featured: true,
      price_note: "ราคาเริ่มต้นสำหรับ 4 ท่าน รวมอาหารเช้าและผลไม้ต้อนรับตามฤดูกาล",
    },
  ];

  const results = [];
  for (const seed of seeds) {
    const { data, error } = await supabase
      .from("roomtypes")
      .insert({ hotel_id: hotelId, ...seed })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    results.push(data);
  }
  return results;
}

async function seedRoomtypeAmenities(hotelId) {
  const amenities = [
    // Deluxe Lanna Garden
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "เครื่องปรับอากาศ" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ฟรี Wi-Fi ความเร็วสูง" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ทีวีจอแบน Smart TV" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "มินิบาร์และน้ำดื่มฟรี" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ตู้เซฟนิรภัย" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ชุดชาและกาแฟสมุนไพรพื้นบ้าน" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ฝักบัว Rain Shower" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ไดร์เป่าผม" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "เสื้อคลุมอาบน้ำและรองเท้าสลิปเปอร์" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", name: "ระเบียงส่วนตัวชมวิวสวน" },

    // Grand Teak Suite
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "เครื่องปรับอากาศ" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "ฟรี Wi-Fi ความเร็วสูง" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "ทีวีจอแบน Smart TV" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "มินิบาร์และน้ำดื่มฟรี" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "ตู้เซฟนิรภัย" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "อ่างอาบน้ำไม้โอ๊คแบบลอยตัว" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "เครื่องชงกาแฟแคปซูล Premium" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "ลำโพงบลูทูธ" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "ผลไม้ต้อนรับ (Welcome Fruit)" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "เครื่องประทินผิวออร์แกนิกเกรดพรีเมียม" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", name: "เตารีดและโต๊ะรีดผ้า" },

    // Nan Riverfront Family Villa
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "เครื่องปรับอากาศ" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "ฟรี Wi-Fi ความเร็วสูง" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "ห้องครัวขนาดเล็กพร้อมไมโครเวฟและตู้เย็นขนาดใหญ่" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "โต๊ะรับประทานอาหารสำหรับครอบครัว" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "ระเบียงรับลมริมแม่น้ำขนาดใหญ่พร้อมเก้าอี้พักผ่อน" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "เกมกระดานสำหรับครอบครัว (Board Games Selection)" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "ระบบเสียงบลูทูธรอบทิศทาง" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", name: "อ่างอาบน้ำจากุซซี่ริมระเบียง" }
  ];

  const { error } = await supabase.from("roomtype_amenities").insert(amenities);
  if (error) throw new Error(error.message);
}

async function seedRooms(hotelId) {
  const rooms = [
    // Deluxe Lanna Garden (6 rooms)
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "101", floor: "1", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "102", floor: "1", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "103", floor: "1", status: "occupied", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "201", floor: "2", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "202", floor: "2", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", room_number: "203", floor: "2", status: "available", is_active: true },

    // Grand Teak Suite (3 rooms)
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", room_number: "301", floor: "3", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", room_number: "302", floor: "3", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", room_number: "303", floor: "3", status: "available", is_active: true },

    // Nan Riverfront Family Villa (2 rooms)
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", room_number: "V1", floor: "1", status: "available", is_active: true },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", room_number: "V2", floor: "1", status: "available", is_active: true }
  ];

  const { error } = await supabase.from("rooms").insert(rooms);
  if (error) throw new Error(error.message);
}

async function seedBookings(hotelId) {
  const bookings = [
    // Deluxe Lanna Garden: fully booked on June 1 to June 3, 2026 (all 6 rooms booked)
    // and partially booked on May 28 to May 30, 2026 (2 rooms booked, 4 available)
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", guest_name: "คุณสมพงษ์ รักดี", guest_phone: "089-111-2222", checkin_date: "2026-06-01", checkout_date: "2026-06-03", guest_count: 6, room_count: 3, status: "confirmed", source: "manual_admin" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", guest_name: "คุณอารีย์ ใจดี", guest_phone: "089-333-4444", checkin_date: "2026-06-01", checkout_date: "2026-06-03", guest_count: 6, room_count: 3, status: "confirmed", source: "manual_admin" },
    { hotel_id: hotelId, roomtype_id: "d1111111-1111-1111-1111-111111111111", guest_name: "คุณวรวิทย์ มุ่งมั่น", guest_phone: "089-555-6666", checkin_date: "2026-05-28", checkout_date: "2026-05-30", guest_count: 4, room_count: 2, status: "confirmed", source: "line_ai" },

    // Grand Teak Suite: fully booked on May 29 to May 31, 2026 (all 3 rooms booked)
    // and partially booked on May 26 to May 28, 2026 (2 rooms booked, 1 available)
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", guest_name: "คุณวิภาวรรณ สวยงาม", guest_phone: "089-777-8888", checkin_date: "2026-05-29", checkout_date: "2026-05-31", guest_count: 6, room_count: 3, status: "confirmed", source: "manual_admin" },
    { hotel_id: hotelId, roomtype_id: "d2222222-2222-2222-2222-222222222222", guest_name: "คุณมนัส ตั้งใจ", guest_phone: "089-999-0000", checkin_date: "2026-05-26", checkout_date: "2026-05-28", guest_count: 4, room_count: 2, status: "confirmed", source: "manual_admin" },

    // Nan Riverfront Family Villa: fully booked on June 5 to June 7, 2026 (all 2 rooms booked)
    // and partially booked on May 27 to May 29, 2026 (1 room booked, 1 available)
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", guest_name: "คุณธเนศ มีสุข", guest_phone: "088-111-2222", checkin_date: "2026-06-05", checkout_date: "2026-06-07", guest_count: 8, room_count: 2, status: "confirmed", source: "manual_admin" },
    { hotel_id: hotelId, roomtype_id: "d3333333-3333-3333-3333-333333333333", guest_name: "คุณณัฐชนนท์ ก้าวไกล", guest_phone: "088-333-4444", checkin_date: "2026-05-27", checkout_date: "2026-05-29", guest_count: 4, room_count: 1, status: "confirmed", source: "line_ai" }
  ];

  const { error } = await supabase.from("bookings").insert(bookings);
  if (error) throw new Error(error.message);
}

async function seedAiSettings(hotelId) {
  const { error } = await supabase
    .from("ai_settings")
    .insert({
      hotel_id: hotelId,
      assistant_name: "น้องสะล้อ",
      assistant_gender_tone: "female_polite",
      language: "th",
      supported_languages: ["th", "en"],
      sale_mode_enabled: true,
      fallback_to_admin_enabled: true,
      admin_contact_message: "หากต้องการสอบถามเพิ่มเติมหรือติดต่อเจ้าหน้าที่โดยตรง สามารถโทร 054-710123 หรือ 081-2345678 ได้เลยนะเจ้า แอดมินน้องสะล้อยินดีบริการค่ะ",
      booking_cta_policy: JSON.stringify({ mode: "suggest_contact_when_ready" }),
      handoff_policy: JSON.stringify({ handoffWhen: ["payment_issue", "complaint", "booking_ready"] }),
      fallback_policy: JSON.stringify({ useHotelDataOnly: true }),
      max_reply_length: 900,
      system_prompt: `คุณคือ "แอดมินน้องสะล้อ" พนักงานต้อนรับ AI ผู้สุภาพ อบอุ่น และใส่ใจบริการของ "เฮือนสะล้อ บูทีค รีสอร์ท น่าน" 
สไตล์การตอบกลับ:
- ใช้ภาษาไทยที่สุภาพ มีหางเสียงลงท้ายด้วยคำเมืองเหนือ/ล้านนาอย่างเป็นธรรมชาติ เช่น "เจ้า", "นะเจ้า", "ยินดีต้อนรับเจ้า"
- พูดจาด้วยน้ำเสียงนุ่มนวล เป็นกันเอง สื่อถึงความเงียบสงบผ่อนคลาย (Slow Life) ของจังหวัดน่าน
- แทนตัวเองว่า "แอดมินน้องสะล้อ" หรือ "แอดมิน" เสมอ และเรียกคู่สนทนาว่า "คุณลูกค้า" หรือตามชื่อของลูกค้าหากทราบ
- *สำคัญมาก*: ที่พักของเราไม่มีเว็บไซต์สำหรับจองห้องพัก หากลูกค้าสนใจจอง ให้แนะนำให้จองโดยตรงผ่าน Line OA: @huansalornan หรือโทร 054-710123, 081-2345678 เท่านั้นเจ้า

ข้อมูลห้องพักของเรา:
1. Deluxe Lanna Garden: ห้องเริ่มต้นวิวสวนสวย ราคา 1,800 บาท/คืน เตียงเดี่ยว King Size 6 ฟุต พักได้ 2 ท่าน เสริมเตียงได้สูงสุด 1 ท่าน (600 บาท/คืน)
2. Grand Teak Suite: ห้องสูทไม้สักทองสุดหรู พร้อมอ่างอาบน้ำไม้โอ๊ค ราคา 3,500 บาท/คืน เตียง California King 7 ฟุต พักได้ 2 ท่าน เสริมเตียงได้สูงสุด 2 ท่าน (800 บาท/คืน/ท่าน)
3. Nan Riverfront Family Villa: บ้านพักวิลล่าริมแม่น้ำน่านสำหรับครอบครัว ราคา 5,500 บาท/คืน มี 2 ห้องนอน พักได้ 4 ท่าน เสริมเตียงได้สูงสุด 2 ท่าน (1,000 บาท/คืน/ท่าน)`
    });

  if (error) throw new Error(error.message);
}

async function seedPromotions(hotelId) {
  const { error } = await supabase
    .from("promotions")
    .insert({
      hotel_id: hotelId,
      title: "เปิดเฮือนรับขวัญ แอ่วเมืองน่าน",
      description: "ส่วนลดพิเศษ 10% สำหรับผู้เข้าพัก 2 คืนขึ้นไปในห้อง Grand Teak Suite หรือ Nan Riverfront Family Villa ฟรีชุดน้ำชาตอนบ่ายริมแม่น้ำน่าน 1 เซ็ตเจ้า",
      start_date: "2026-05-01",
      end_date: "2026-08-31",
      is_active: true
    });

  if (error) throw new Error(error.message);
}

async function seedFaqs(hotelId) {
  const rows = [];
  for (const [index, faq] of faqSeeds.entries()) {
    const embedding = await embedFaq(faq);
    rows.push({
      hotel_id: hotelId,
      ...faq,
      sort_order: index,
      embedding,
    });
  }

  const { error } = await supabase.from("ai_faqs").insert(rows);
  if (error) throw new Error(error.message);
}

async function embedFaq(faq) {
  const text = [
    `Question: ${faq.question}`,
    `Answer: ${faq.answer}`,
    `Language: ${faq.language}`,
    `Category: ${faq.category}`,
    `Keywords: ${faq.keywords.join(", ")}`,
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(embeddingModel)}:embedContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${embeddingModel}`,
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini embedding failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  const values = payload.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding response did not include values");
  }

  return values;
}
