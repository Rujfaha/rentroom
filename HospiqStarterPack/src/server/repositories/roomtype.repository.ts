import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateRoomtypeInput, UpdateRoomtypeInput } from "../validators/roomtype.schema";

export const roomtypeRepository = {
  async listByHotel(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("roomtypes")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("base_price", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
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
      })
      .eq("hotel_id", hotelId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
