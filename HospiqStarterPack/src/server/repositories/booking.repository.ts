import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import type { CreateBookingLeadInput, UpdateBookingLeadInput } from "../validators/booking.schema";

export interface UpsertLineAiBookingLeadInput {
  lineSessionId: string;
  lineUserId: string;
  guestName?: string;
  guestPhone?: string;
  checkinDate?: string;
  checkoutDate?: string;
  guestCount?: number;
  conversationSummary?: string;
  aiSummary?: string;
}

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
        line_session_id: input.lineSessionId,
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        guest_line_user_id: input.guestLineUserId,
        checkin_date: input.checkinDate,
        checkout_date: input.checkoutDate,
        guest_count: input.guestCount,
        room_count: input.roomCount,
        preferred_contact_channel: input.preferredContactChannel,
        conversation_summary: input.conversationSummary,
        note: input.note,
        admin_note: input.adminNote,
        ai_summary: input.aiSummary,
        status: "lead",
        source: "line_ai",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateLead(hotelId: string, id: string, input: UpdateBookingLeadInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .update({
        roomtype_id: input.roomtypeId,
        line_session_id: input.lineSessionId,
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        guest_line_user_id: input.guestLineUserId,
        checkin_date: input.checkinDate,
        checkout_date: input.checkoutDate,
        guest_count: input.guestCount,
        room_count: input.roomCount,
        preferred_contact_channel: input.preferredContactChannel,
        conversation_summary: input.conversationSummary,
        note: input.note,
        admin_note: input.adminNote,
        ai_summary: input.aiSummary,
        lead_status: input.leadStatus,
        webbooking_redirected_at: input.webbookingRedirectedAt,
      })
      .eq("hotel_id", hotelId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async upsertLineAiLead(hotelId: string, input: UpsertLineAiBookingLeadInput) {
    const supabase = createSupabaseAdminClient();
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("line_session_id", input.lineSessionId)
      .eq("status", "lead")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .returns<{ id: string } | null>();

    if (existingError) throw new Error(existingError.message);

    const values = {
      line_session_id: input.lineSessionId,
      guest_line_user_id: input.lineUserId,
      guest_name: input.guestName,
      guest_phone: input.guestPhone,
      checkin_date: input.checkinDate,
      checkout_date: input.checkoutDate,
      guest_count: input.guestCount,
      preferred_contact_channel: "line",
      conversation_summary: input.conversationSummary,
      ai_summary: input.aiSummary,
      status: "lead",
      source: "line_ai",
    };

    if (existing?.id) {
      const { data, error } = await supabase
        .from("bookings")
        .update(values)
        .eq("hotel_id", hotelId)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        hotel_id: hotelId,
        room_count: 1,
        ...values,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
