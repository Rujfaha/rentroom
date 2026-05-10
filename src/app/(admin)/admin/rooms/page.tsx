import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { RoomManagement } from "@/components/admin/rooms/RoomManagement";

export const metadata = {
  title: "ห้องพัก | Arkkarawin",
};

export default async function AdminRoomsPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/login");

  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = await createServiceClient();
  const hotelId = session.hotelId;

  // DEBUG: log hotelId
  console.log("[DEBUG admin/rooms] session.hotelId:", hotelId);

  // Fetch room types with images
  const { data: roomTypes, error: roomTypesError } = await (supabase.from("room_types") as any)
    .select(`
      *,
      room_type_images (*)
    `)
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: false });

  if (roomTypesError) console.error("[DEBUG admin/rooms] room_types error:", roomTypesError);

  // Fetch all rooms for this hotel with their current active booking
  const { data: rooms, error: roomsError } = await (supabase.from("rooms") as any)
    .select(`
      *,
      bookings (
        id,
        check_in_date,
        check_out_date,
        status,
        customers (
          full_name
        )
      )
    `)
    .eq("hotel_id", hotelId)
    .order("room_number", { ascending: true });

  if (roomsError) console.error("[DEBUG admin/rooms] rooms error:", JSON.stringify(roomsError));

  console.log("[DEBUG admin/rooms] rooms raw result:", JSON.stringify(rooms, null, 2));

  // DEBUG: fallback query without hotel_id filter to verify data exists
  const { data: allRoomsDebug, error: allRoomsError } = await (supabase.from("rooms") as any).select("id, room_number, hotel_id, status").limit(10);
  if (allRoomsError) console.error("[DEBUG admin/rooms] all rooms error:", JSON.stringify(allRoomsError));
  console.log("[DEBUG admin/rooms] all rooms (no filter):", allRoomsDebug?.length ?? 0, allRoomsDebug);

  // DEBUG: query rooms without bookings join to isolate issue
  const { data: roomsSimple, error: roomsSimpleError } = await (supabase.from("rooms") as any)
    .select("id, room_number, hotel_id, status, is_active")
    .eq("hotel_id", hotelId)
    .order("room_number", { ascending: true });
  if (roomsSimpleError) console.error("[DEBUG admin/rooms] simple rooms error:", JSON.stringify(roomsSimpleError));
  console.log("[DEBUG admin/rooms] simple rooms filtered:", roomsSimple?.length ?? 0, roomsSimple);

  console.log("[DEBUG admin/rooms] filtered rooms count:", (rooms || []).length);
  console.log("[DEBUG admin/rooms] filtered roomTypes count:", (roomTypes || []).length);

  // Transform room_types data to include images array
  const roomTypesWithImages = (roomTypes || []).map((rt: any) => ({
    ...rt,
    images: rt.room_type_images || [],
  }));

  // Process rooms to find the "current" booking (checked_in or confirmed for today)
  const roomsWithBookings = (rooms || []).map((room: any) => {
    const processedBookings = (room.bookings || []).map((b: any) => ({
      ...b,
      guest_name: b.customers?.full_name || "ไม่ระบุชื่อ",
      check_in: b.check_in_date,
      check_out: b.check_out_date,
    }));

    // Find active booking (prefer checked_in)
    const activeBooking = processedBookings.find((b: any) => b.status === "checked_in") || 
                         processedBookings.find((b: any) => b.status === "confirmed");
    
    return {
      ...room,
      bookings: processedBookings,
      currentBooking: activeBooking || null
    };
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-serif text-[#1a3c2a]">จัดการห้องพัก</h1>
        <p className="text-[#8b7355] text-sm mt-1">
          จัดการประเภทห้องพักและห้องพักจริงในโรงแรม
        </p>
      </div>

      <RoomManagement
        hotelId={hotelId}
        initialRoomTypes={roomTypesWithImages}
        initialRooms={roomsWithBookings}
      />
    </div>
  );
}
