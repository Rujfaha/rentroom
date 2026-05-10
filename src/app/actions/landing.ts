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
      basePrice: Number(roomType.base_price) || 0,
      maxGuests: roomType.max_guests || 2,
      bedType: roomType.bed_type || "King Size",
      roomSize: Number(roomType.room_size) || 45,
      amenities,
      isActive: roomType.is_active,
      availableRoomsCount: availableCounts[roomType.id] || 0,
    };
  });
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
