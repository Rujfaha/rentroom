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

const hotelSlug = "hospiq-handtest-hotel";
const faqSeeds = [
  {
    question: "โรงแรมมีที่จอดรถไหม",
    answer: "มีที่จอดรถรองรับสำหรับผู้เข้าพัก ลูกค้าสามารถนำรถมาได้ค่ะ",
    category: "facility",
    language: "th",
    keywords: ["ที่จอดรถ", "จอดรถ", "parking"],
  },
  {
    question: "เวลาเช็กอินและเช็กเอาต์คือกี่โมง",
    answer: "เช็กอินได้ตั้งแต่ 14:00 น. และเช็กเอาต์ก่อน 12:00 น.",
    category: "policy",
    language: "th",
    keywords: ["เช็กอิน", "เช็คอิน", "เช็กเอาต์", "checkout"],
  },
  {
    question: "ห้องไหนเหมาะสำหรับพักสองคน",
    answer: "สำหรับ 2 ท่าน แนะนำ Standard Queen ราคาเริ่มต้น 1,200 บาท เหมาะกับการพักระยะสั้นและเดินทางสะดวก",
    category: "room",
    language: "th",
    keywords: ["สองคน", "2 คน", "แนะนำห้อง"],
  },
  {
    question: "มีห้องสำหรับครอบครัวไหม",
    answer: "มี Family Twin สำหรับ 3-4 ท่าน ราคาเริ่มต้น 1,900 บาท และสามารถเสริมเตียงได้ตามเงื่อนไขห้อง",
    category: "room",
    language: "th",
    keywords: ["ครอบครัว", "family", "หลายคน"],
  },
  {
    question: "จองผ่านเว็บได้ไหม",
    answer: "โรงแรมมีระบบ web booking สามารถส่งลูกค้าไปยังลิงก์จองออนไลน์เมื่อลูกค้าพร้อมจอง",
    category: "booking",
    language: "th",
    keywords: ["จอง", "booking", "เว็บ"],
  },
];

const hotel = await upsertHotel();
const roomtypes = await seedRoomtypes(hotel.id);
await seedRooms(hotel.id, roomtypes);
await seedAiSettings(hotel.id);
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

async function upsertHotel() {
  const { data: existing, error: selectError } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", hotelSlug)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("hotels")
    .insert({
      name: "Hospiq Handtest Hotel",
      slug: hotelSlug,
      address: "Bangkok, Thailand",
      description: "โรงแรมตัวอย่างสำหรับทดสอบ Hospiq AI จากข้อมูลจริงในฐานข้อมูล",
      contact_phone: "020000000",
      contact_email: "handtest@hospiq.local",
      has_webbooking: true,
      webbooking_url: "https://example.com/booking",
      onboarding_completed: true,
      status: "active",
      admin_verify_code: "HANDTEST-001",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function seedRoomtypes(hotelId) {
  const seeds = [
    {
      name: "Standard Queen",
      description: "ห้องมาตรฐานสำหรับ 1-2 ท่าน เหมาะกับพักระยะสั้น",
      mood_description: "เรียบง่าย สะอาด เดินทางสะดวก",
      base_price: 1200,
      bed_type: "Queen bed",
      bed_size: "5 ft",
      standard_capacity: 2,
      max_capacity: 2,
      total_rooms: 2,
      room_size: "24 sqm",
      sort_order: 1,
      is_featured: true,
      price_note: "ราคาเริ่มต้น อาจเปลี่ยนตามวันเข้าพัก",
    },
    {
      name: "Family Twin",
      description: "ห้องสำหรับครอบครัวหรือเพื่อน 3-4 ท่าน",
      mood_description: "พื้นที่กว้างขึ้น มีเตียงแยก นอนสบาย",
      base_price: 1900,
      bed_type: "Twin beds",
      bed_size: "3.5 ft x 2",
      standard_capacity: 3,
      max_capacity: 4,
      max_extra_beds: 1,
      extra_bed_price: 400,
      total_rooms: 2,
      room_size: "32 sqm",
      sort_order: 2,
      is_featured: true,
      price_note: "ราคาเริ่มต้น อาจเปลี่ยนตามจำนวนผู้เข้าพัก",
    },
  ];

  const results = [];
  for (const seed of seeds) {
    const { data, error } = await supabase
      .from("roomtypes")
      .upsert({ hotel_id: hotelId, ...seed }, { onConflict: "hotel_id,name" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    results.push(data);
  }
  return results;
}

async function seedRooms(hotelId, roomtypes) {
  const rooms = roomtypes.flatMap((roomtype, index) => [
    {
      hotel_id: hotelId,
      roomtype_id: roomtype.id,
      room_number: `${index + 2}01`,
      floor: `${index + 2}`,
      status: "available",
      is_active: true,
    },
    {
      hotel_id: hotelId,
      roomtype_id: roomtype.id,
      room_number: `${index + 2}02`,
      floor: `${index + 2}`,
      status: index === 0 ? "available" : "maintenance",
      is_active: true,
    },
  ]);

  const { error } = await supabase
    .from("rooms")
    .upsert(rooms, { onConflict: "hotel_id,room_number" });

  if (error) throw new Error(error.message);
}

async function seedAiSettings(hotelId) {
  const { error } = await supabase
    .from("ai_settings")
    .upsert({
      hotel_id: hotelId,
      assistant_name: "Hospiq",
      assistant_gender_tone: "polite_professional",
      language: "th",
      supported_languages: ["th", "en"],
      sale_mode_enabled: true,
      fallback_to_admin_enabled: true,
      admin_contact_message: "หากต้องตรวจสอบรายละเอียดเพิ่มเติม ทีมโรงแรมจะรับช่วงต่อ",
      booking_cta_policy: JSON.stringify({ mode: "suggest_webbooking_when_ready" }),
      handoff_policy: JSON.stringify({ handoffWhen: ["payment_issue", "complaint", "booking_ready"] }),
      fallback_policy: JSON.stringify({ useHotelDataOnly: true }),
      max_reply_length: 900,
    }, { onConflict: "hotel_id" });

  if (error) throw new Error(error.message);
}

async function seedFaqs(hotelId) {
  const { error: deleteError } = await supabase
    .from("ai_faqs")
    .delete()
    .eq("hotel_id", hotelId);

  if (deleteError) throw new Error(deleteError.message);

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
