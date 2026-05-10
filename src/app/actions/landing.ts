"use server";

import type { RoomStatus } from "@/types/database.types";
import type { RoomAmenity, RoomTypeDisplay } from "@/types/landing.types";

interface RoomTypeImageRow {
  image_url: string;
  is_cover: boolean;
  sort_order: number | null;
}

interface RoomTypeRow {
  id: string;
  name: string;
  description: string | null;
  base_price: number | string | null;
  max_guests: number | null;
  bed_type?: string | null;
  room_size?: number | string | null;
  amenities: unknown[] | null;
  is_active: boolean;
  room_type_images: RoomTypeImageRow[] | null;
}

interface RoomAvailabilityRow {
  room_type_id: string;
  status: RoomStatus | null;
  is_active: boolean;
}

interface SeasonPricingRow {
  id: string;
  start_date: string;
  end_date: string;
}

interface PricingRuleRow {
  room_type_id: string;
  season_id: string | null;
  day_type: "weekday" | "weekend" | "holiday" | "special";
  price: number | string;
}

/**
 * ดึงข้อมูล Room Types สำหรับแสดงในหน้า Landing Page
 * รวมรูปภาพ cover และ gallery จาก room_type_images
 */
export async function getRoomTypesForLanding(hotelId: string): Promise<RoomTypeDisplay[]> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  const { data: roomTypesData, error: roomTypesError } = await (supabase
    .from("room_types"))
    .select(`
      *,
      room_type_images (*)
    `)
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .returns<RoomTypeRow[]>();

  const roomTypes = (roomTypesData ?? []) as RoomTypeRow[];

  if (roomTypesError || roomTypes.length === 0) {
    console.error("Error fetching room types for landing:", roomTypesError);
    return [];
  }

  const { data: allRoomsData } = await (supabase
    .from("rooms"))
    .select("room_type_id, status, is_active")
    .eq("hotel_id", hotelId)
    .returns<RoomAvailabilityRow[]>();

  const availableCounts = countAvailableRooms(allRoomsData ?? []);
  const pricing = await getPricingContext(hotelId);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const checkIn = today.toISOString().split("T")[0];
  const checkOut = tomorrow.toISOString().split("T")[0];

  const amenityIconMap: Record<string, string> = {
    WiFi: "wifi",
    "Wi-Fi": "wifi",
    "แอร์": "ac",
    "เครื่องปรับอากาศ": "ac",
    TV: "tv",
    "ตู้เย็น": "minibar",
    "ระเบียง": "balcony",
    "อ่างอาบน้ำ": "bath",
    "เครื่องทำน้ำอุ่น": "bath",
    "ไดร์เป่าผม": "ac",
    "ตู้นิรภัย": "minibar",
    "โต๊ะทำงาน": "minibar",
    "กาแฟ": "coffee",
    "จากุซซี่": "jacuzzi",
    "สระส่วนตัว": "jacuzzi",
  };

  return roomTypes.map((roomType) => {
    const roomImages = roomType.room_type_images || [];
    const coverImage = roomImages.find((image) => image.is_cover);
    const coverImageUrl = coverImage?.image_url || roomImages[0]?.image_url || "/placeholder-room.jpg";
    const galleryUrls = [...roomImages]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((image) => image.image_url);

    let amenities: RoomAmenity[] = [];
    if (Array.isArray(roomType.amenities)) {
      amenities = roomType.amenities
        .filter((amenity): amenity is string => typeof amenity === "string")
        .map((amenity) => ({
          icon: amenityIconMap[amenity] || "minibar",
          label: amenity,
        }));
    }

    return {
      id: roomType.id,
      name: roomType.name,
      description: roomType.description || "",
      shortDescription: roomType.description
        ? roomType.description.length > 100
          ? roomType.description.substring(0, 100) + "..."
          : roomType.description
        : "",
      coverImageUrl,
      galleryUrls,
      basePrice: getAverageNightlyPrice(roomType, checkIn, checkOut, pricing),
      maxGuests: roomType.max_guests || 2,
      bedType: roomType.bed_type || "King Size",
      roomSize: Number(roomType.room_size) || 45,
      amenities,
      isActive: roomType.is_active,
      availableRoomsCount: availableCounts[roomType.id] || 0,
    };
  });
}

async function getPricingContext(hotelId: string): Promise<{
  seasons: SeasonPricingRow[];
  rules: PricingRuleRow[];
}> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();
  const [{ data: seasons, error: seasonsError }, { data: rules, error: rulesError }] = await Promise.all([
    supabase
      .from("seasons")
      .select("id, start_date, end_date")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .returns<SeasonPricingRow[]>(),
    supabase
      .from("pricing_rules")
      .select("room_type_id, season_id, day_type, price")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .returns<PricingRuleRow[]>(),
  ]);

  if (seasonsError) console.error("getPricingContext seasons error:", seasonsError);
  if (rulesError) console.error("getPricingContext pricing_rules error:", rulesError);

  return {
    seasons: seasons ?? [],
    rules: rules ?? [],
  };
}

function getAverageNightlyPrice(
  roomType: RoomTypeRow,
  checkIn: string,
  checkOut: string,
  pricing: { seasons: SeasonPricingRow[]; rules: PricingRuleRow[] }
): number {
  const dates = getStayDates(checkIn, checkOut);
  if (!dates.length) return Number(roomType.base_price) || 0;
  const total = dates.reduce((sum, date) => sum + getNightlyPrice(roomType, date, pricing), 0);
  return Math.round(total / dates.length);
}

function getNightlyPrice(
  roomType: RoomTypeRow,
  date: string,
  pricing: { seasons: SeasonPricingRow[]; rules: PricingRuleRow[] }
): number {
  const dayType = getAutomaticDayType(date);
  const season = pricing.seasons.find((item) => item.start_date <= date && item.end_date >= date);
  const basePrice = Number(roomType.base_price) || 0;
  const sameRoomRules = pricing.rules.filter((rule) => rule.room_type_id === roomType.id);
  const matchedRule =
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "special") ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "holiday") ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === dayType) ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "weekday") ||
    sameRoomRules.find((rule) => rule.season_id === null && rule.day_type === dayType) ||
    sameRoomRules.find((rule) => rule.season_id === null && rule.day_type === "weekday");

  return Number(matchedRule?.price) || basePrice;
}

function getAutomaticDayType(date: string): "weekday" | "weekend" {
  const day = new Date(date + "T00:00:00").getDay();
  return day === 0 || day === 5 || day === 6 ? "weekend" : "weekday";
}

function getStayDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");

  while (cursor.getTime() < end.getTime()) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export async function getRoomAvailabilityCounts(hotelId: string): Promise<Record<string, number>> {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  const { data, error } = await (supabase
    .from("rooms"))
    .select("room_type_id, status, is_active")
    .eq("hotel_id", hotelId)
    .returns<RoomAvailabilityRow[]>();

  if (error) {
    console.error("Error fetching room availability counts:", error);
    return {};
  }

  return countAvailableRooms(data ?? []);
}

function countAvailableRooms(rooms: RoomAvailabilityRow[]): Record<string, number> {
  return rooms.reduce<Record<string, number>>((counts, room) => {
    if (room.status === "available" && room.is_active) {
      counts[room.room_type_id] = (counts[room.room_type_id] || 0) + 1;
    }

    return counts;
  }, {});
}
