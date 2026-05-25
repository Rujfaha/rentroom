import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateBookingLeadInput } from "../validators/booking.schema";

export const bookingRepository = {
  async listByHotel(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createLead(hotelId: string, input: CreateBookingLeadInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        hotel_id: hotelId,
        roomtype_id: input.roomtypeId,
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        guest_line_user_id: input.guestLineUserId,
        checkin_date: input.checkinDate,
        checkout_date: input.checkoutDate,
        guest_count: input.guestCount,
        room_count: input.roomCount,
        note: input.note,
        ai_summary: input.aiSummary,
        status: "lead",
        source: "line_ai",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
