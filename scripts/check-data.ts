/**
 * สคริปต์ตรวจสอบข้อมูลในฐานข้อมูล
 * รัน: npx tsx scripts/check-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

interface HotelRow {
  id: string;
  name: string;
  slug: string;
}

interface RoomTypeRow {
  id: string;
  name: string;
  base_price: number | string | null;
  max_guests: number | null;
  bed_type: string | null;
  room_size: number | string | null;
  is_active: boolean;
}

interface RoomTypeImageRow {
  id: string;
  room_type_id: string;
  image_url: string;
  is_cover: boolean;
}

interface HeroSlideRow {
  id: string;
  headline: string | null;
  is_active: boolean;
}

interface PromotionRow {
  id: string;
  title: string;
  is_active: boolean;
}

async function checkData() {
  console.log("🔍 กำลังตรวจสอบข้อมูลในฐานข้อมูล...\n");

  // 1. ตรวจสอบ hotels
  const { data: hotels, error: hotelsError } = await supabase
    .from("hotels")
    .select("id, name, slug")
    .limit(5);

  if (hotelsError) {
    console.error("❌ Error fetching hotels:", hotelsError);
  } else {
    console.log(`✅ Hotels: ${hotels?.length || 0} รายการ`);
    const hotelRows = (hotels ?? []) as unknown as HotelRow[];
    hotelRows.forEach((h) => {
      console.log(`   - ${h.name} (${h.slug})`);
    });
  }

  const hotelRows = (hotels ?? []) as unknown as HotelRow[];
  if (hotelRows.length === 0) {
    console.log("\n⚠️  ไม่มีข้อมูล hotel ในระบบ");
    return;
  }

  const hotelId = hotelRows[0].id;
  console.log(`\n📍 ใช้ hotel_id: ${hotelId}\n`);

  // 2. ตรวจสอบ room_types
  const { data: roomTypes, error: roomTypesError } = await supabase
    .from("room_types")
    .select("id, name, base_price, max_guests, bed_type, room_size, is_active")
    .eq("hotel_id", hotelId);

  if (roomTypesError) {
    console.error("❌ Error fetching room_types:", roomTypesError);
  } else {
    console.log(`✅ Room Types: ${roomTypes?.length || 0} รายการ`);
    const roomTypeRows = (roomTypes ?? []) as unknown as RoomTypeRow[];
    roomTypeRows.forEach((rt) => {
      console.log(`   - ${rt.name} (${rt.base_price} บาท/คืน)`);
      console.log(`     Max: ${rt.max_guests} คน | Bed: ${rt.bed_type || "N/A"} | Size: ${rt.room_size || "N/A"} ตร.ม.`);
      console.log(`     Active: ${rt.is_active ? "✓" : "✗"}`);
    });
  }

  // 3. ตรวจสอบ room_type_images
  if (roomTypes && roomTypes.length > 0) {
    const roomTypeRows = (roomTypes ?? []) as unknown as RoomTypeRow[];
    const roomTypeIds = roomTypeRows.map((rt) => rt.id);
    const { data: images, error: imagesError } = await supabase
      .from("room_type_images")
      .select("id, room_type_id, image_url, is_cover")
      .in("room_type_id", roomTypeIds);

    if (imagesError) {
      console.error("\n❌ Error fetching room_type_images:", imagesError);
    } else {
      console.log(`\n✅ Room Type Images: ${images?.length || 0} รายการ`);
      
      // นับรูปภาพแต่ละ room type
      const imageCount = new Map<string, number>();
      const coverCount = new Map<string, number>();
      
      const imageRows = (images ?? []) as unknown as RoomTypeImageRow[];
      imageRows.forEach((img) => {
        imageCount.set(img.room_type_id, (imageCount.get(img.room_type_id) || 0) + 1);
        if (img.is_cover) {
          coverCount.set(img.room_type_id, (coverCount.get(img.room_type_id) || 0) + 1);
        }
      });

      roomTypeRows.forEach((rt) => {
        const count = imageCount.get(rt.id) || 0;
        const covers = coverCount.get(rt.id) || 0;
        console.log(`   - ${rt.name}: ${count} รูป (${covers} cover)`);
      });
    }
  }

  // 4. ตรวจสอบ hero_slides
  const { data: heroSlides, error: heroError } = await supabase
    .from("hero_slides")
    .select("id, headline, is_active")
    .eq("hotel_id", hotelId);

  if (heroError) {
    console.error("\n❌ Error fetching hero_slides:", heroError);
  } else {
    console.log(`\n✅ Hero Slides: ${heroSlides?.length || 0} รายการ`);
    const heroSlideRows = (heroSlides ?? []) as unknown as HeroSlideRow[];
    heroSlideRows.forEach((hs) => {
      console.log(`   - ${hs.headline} (${hs.is_active ? "Active" : "Inactive"})`);
    });
  }

  // 5. ตรวจสอบ promotions
  const { data: promotions, error: promoError } = await supabase
    .from("promotions")
    .select("id, title, is_active")
    .eq("hotel_id", hotelId);

  if (promoError) {
    console.error("\n❌ Error fetching promotions:", promoError);
  } else {
    console.log(`\n✅ Promotions: ${promotions?.length || 0} รายการ`);
    const promotionRows = (promotions ?? []) as unknown as PromotionRow[];
    promotionRows.forEach((p) => {
      console.log(`   - ${p.title} (${p.is_active ? "Active" : "Inactive"})`);
    });
  }

  console.log("\n✨ เสร็จสิ้น!");
}

checkData().catch(console.error);
