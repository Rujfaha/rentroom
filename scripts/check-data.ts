/**
 * สคริปต์ตรวจสอบข้อมูลในฐานข้อมูล
 * รัน: npx tsx scripts/check-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

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
    hotels?.forEach((h: any) => {
      console.log(`   - ${h.name} (${h.slug})`);
    });
  }

  if (!hotels || hotels.length === 0) {
    console.log("\n⚠️  ไม่มีข้อมูล hotel ในระบบ");
    return;
  }

  const hotelId = hotels[0].id;
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
    roomTypes?.forEach((rt: any) => {
      console.log(`   - ${rt.name} (${rt.base_price} บาท/คืน)`);
      console.log(`     Max: ${rt.max_guests} คน | Bed: ${rt.bed_type || "N/A"} | Size: ${rt.room_size || "N/A"} ตร.ม.`);
      console.log(`     Active: ${rt.is_active ? "✓" : "✗"}`);
    });
  }

  // 3. ตรวจสอบ room_type_images
  if (roomTypes && roomTypes.length > 0) {
    const roomTypeIds = roomTypes.map((rt: any) => rt.id);
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
      
      images?.forEach((img: any) => {
        imageCount.set(img.room_type_id, (imageCount.get(img.room_type_id) || 0) + 1);
        if (img.is_cover) {
          coverCount.set(img.room_type_id, (coverCount.get(img.room_type_id) || 0) + 1);
        }
      });

      roomTypes.forEach((rt: any) => {
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
    heroSlides?.forEach((hs: any) => {
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
    promotions?.forEach((p: any) => {
      console.log(`   - ${p.title} (${p.is_active ? "Active" : "Inactive"})`);
    });
  }

  console.log("\n✨ เสร็จสิ้น!");
}

checkData().catch(console.error);
