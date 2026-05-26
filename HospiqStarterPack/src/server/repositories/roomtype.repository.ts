import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateAvailableRoomsByRoomtype } from "@/lib/availability";
import type { CreateRoomtypeInput, UpdateRoomtypeInput } from "../validators/roomtype.schema";

interface ListRoomtypesOptions {
  checkinDate?: string;
  checkoutDate?: string;
}

interface RoomtypeRow {
  id: string;
  total_rooms: number | null;
}

interface RoomInventoryRow {
  roomtype_id: string;
}

interface BookingAvailabilityRow {
  roomtype_id: string | null;
  checkin_date: string | null;
  checkout_date: string | null;
  room_count: number | null;
  status: string;
}

export const roomtypeRepository = {
  async listByHotel(hotelId: string, options: ListRoomtypesOptions = {}) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("base_price", { ascending: true });

    if (error) throw new Error(error.message);
    const roomtypes = data ?? [];
    if (!options.checkinDate || !options.checkoutDate || !roomtypes.length) return roomtypes;

    const [rooms, bookings] = await Promise.all([
      fetchRoomInventory(hotelId),
      fetchAvailabilityBookings(hotelId, options.checkinDate, options.checkoutDate),
    ]);
    const activeRoomsByRoomtype = countRowsByRoomtype(rooms);
    const availableByRoomtype = calculateAvailableRoomsByRoomtype({
      checkinDate: options.checkinDate,
      checkoutDate: options.checkoutDate,
      roomtypes: (roomtypes as RoomtypeRow[]).map((roomtype) => ({
        id: roomtype.id,
        totalRooms: roomtype.total_rooms ?? 0,
        activeRooms: activeRoomsByRoomtype.get(roomtype.id) ?? roomtype.total_rooms ?? 0,
      })),
      bookings: bookings.map((booking) => ({
        roomtypeId: booking.roomtype_id,
        checkinDate: booking.checkin_date,
        checkoutDate: booking.checkout_date,
        roomCount: booking.room_count,
        status: booking.status,
      })),
    });

    return roomtypes.map((roomtype) => ({
      ...roomtype,
      available_rooms: availableByRoomtype.get((roomtype as RoomtypeRow).id) ?? null,
    }));
  },

  async create(hotelId: string, input: CreateRoomtypeInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .insert({
        hotel_id: hotelId,
        name: input.name,
        description: input.description,
        mood_description: input.moodDescription,
        base_price: input.basePrice,
        bed_type: input.bedType,
        bed_size: input.bedSize,
        standard_capacity: input.standardCapacity,
        max_capacity: input.maxCapacity,
        max_extra_beds: input.maxExtraBeds,
        extra_bed_price: input.extraBedPrice,
        pet_policy: input.petPolicy,
        total_rooms: input.totalRooms,
        room_size: input.roomSize,
        sort_order: input.sortOrder,
        is_featured: input.isFeatured,
        price_note: input.priceNote,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(hotelId: string, id: string, input: UpdateRoomtypeInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .update({
        name: input.name,
        description: input.description,
        mood_description: input.moodDescription,
        base_price: input.basePrice,
        total_rooms: input.totalRooms,
        room_size: input.roomSize,
        sort_order: input.sortOrder,
        is_featured: input.isFeatured,
        price_note: input.priceNote,
      })
      .eq("hotel_id", hotelId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};

async function fetchRoomInventory(hotelId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("roomtype_id")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .in("status", ["available", "occupied"])
    .returns<RoomInventoryRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchAvailabilityBookings(hotelId: string, checkinDate: string, checkoutDate: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("roomtype_id, checkin_date, checkout_date, room_count, status")
    .eq("hotel_id", hotelId)
    .in("status", ["pending", "confirmed"])
    .lt("checkin_date", checkoutDate)
    .gt("checkout_date", checkinDate)
    .returns<BookingAvailabilityRow[]>();

  if (error) throw new Error(error.message);
  return data ?? [];
}

function countRowsByRoomtype(rows: RoomInventoryRow[]) {
  return rows.reduce((counts, row) => {
    counts.set(row.roomtype_id, (counts.get(row.roomtype_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}
