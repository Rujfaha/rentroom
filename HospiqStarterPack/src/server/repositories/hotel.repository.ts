import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UpdateHotelInput } from "../validators/hotel.schema";

export const hotelRepository = {
  async getById(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("id", hotelId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async update(hotelId: string, input: UpdateHotelInput) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hotels")
      .update({
        name: input.name,
        address: input.address,
        description: input.description,
        contact_phone: input.contactPhone,
        contact_email: input.contactEmail,
        facebook_url: input.facebookUrl,
        website_url: input.websiteUrl,
        map_url: input.mapUrl,
        has_webbooking: input.hasWebbooking,
        webbooking_url: input.webbookingUrl,
      })
      .eq("id", hotelId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async markOnboardingCompleted(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hotels")
      .update({
        onboarding_completed: true,
        status: "active",
      })
      .eq("id", hotelId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
