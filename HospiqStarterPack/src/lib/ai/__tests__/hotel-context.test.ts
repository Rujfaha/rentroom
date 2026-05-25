import { describe, expect, it } from "vitest";
import { createHotelAiContextFromRows } from "../hotel-context";

describe("createHotelAiContextFromRows", () => {
  it("maps Starter Pack rows into AI context", () => {
    const context = createHotelAiContextFromRows({
      hotel: {
        id: "hotel-1",
        name: "Demo Hotel",
        description: "Quiet hotel",
        address: "Bangkok",
        contact_phone: "000",
        contact_email: "demo@example.com",
        has_webbooking: true,
        webbooking_url: "https://example.com/book",
      },
      roomtypes: [
        {
          id: "roomtype-1",
          name: "Standard",
          description: "Simple room",
          mood_description: "Quiet",
          base_price: "900",
          standard_capacity: 2,
          max_capacity: 2,
          total_rooms: 5,
          room_size: "24 sqm",
          is_featured: true,
          price_note: "from rate",
        },
      ],
      amenities: [{ roomtype_id: "roomtype-1", name: "wifi" }],
      rooms: [
        { roomtype_id: "roomtype-1", status: "available" },
        { roomtype_id: "roomtype-1", status: "occupied" },
      ],
      aiSetting: {
        assistant_name: "Nara",
        assistant_gender_tone: "female_polite",
        supported_languages: ["th", "en"],
        booking_cta_policy: "{\"enabled\":true}",
        handoff_policy: { always_handoff: false },
        fallback_policy: null,
        max_reply_length: 600,
        fallback_to_admin_enabled: true,
        admin_contact_message: null,
      },
      faqs: [
        {
          id: "faq-1",
          question: "parking",
          answer: "yes",
          category: "facility",
          language: "en",
          keywords: ["parking"],
        },
      ],
      memory: {
        bookingLead: { guests: 2 },
        language: "en",
      },
    });

    expect(context.hotelName).toBe("Demo Hotel");
    expect(context.roomtypes[0]?.basePrice).toBe(900);
    expect(context.roomtypes[0]?.availableRooms).toBe(2);
    expect(context.roomtypes[0]?.amenities).toEqual(["wifi"]);
    expect(context.aiSetting.assistantName).toBe("Nara");
    expect(context.aiSetting.bookingCtaPolicy).toEqual({ enabled: true });
    expect(context.faqs[0]?.keywords).toEqual(["parking"]);
    expect(context.memory.bookingLead.guests).toBe(2);
  });
});
