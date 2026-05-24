import { describe, expect, it } from "vitest";
import { composeLineReply } from "../reply-composer";
import type { HotelContext } from "@/types/line-ai.types";

const context: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: null,
  address: "Chiang Mai",
  phone: "0812345678",
  email: "stay@example.com",
  contacts: [{ type: "line", label: "LINE", value: "@arkkarawin" }],
  payment: { promptPayConfigured: true, accountName: "Arkkarawin Resort" },
  roomTypes: [
    { id: "rt-1", name: "Standard", basePrice: 800, maxGuests: 2, availableRooms: 2 },
    { id: "rt-2", name: "Deluxe", basePrice: 1200, maxGuests: 2, availableRooms: 1 },
  ],
  promotions: [{ title: "Stay longer", description: null, discountText: "10%", validUntil: null }],
  availability: {
    request: { checkIn: "2026-05-26", checkOut: "2026-05-27", guests: 2 },
    roomTypes: [
      { id: "rt-1", name: "Standard", basePrice: 800, maxGuests: 2, availableRooms: 2 },
      { id: "rt-2", name: "Deluxe", basePrice: 1200, maxGuests: 2, availableRooms: 1 },
    ],
  },
};

describe("composeLineReply", () => {
  it("answers multiple Thai intents in one friendly reply", () => {
    const reply = composeLineReply({
      language: "th",
      intents: ["availability", "price", "promotion", "payment"],
      context,
      bookingUrl: "https://example.com/booking?checkIn=2026-05-26&checkOut=2026-05-27&guests=2",
      memory: {},
    });

    expect(reply).toContain("Standard");
    expect(reply).toContain("800");
    expect(reply).toContain("Stay longer");
    expect(reply).toContain("PromptPay");
    expect(reply).toContain("😊");
  });

  it("answers English customers in English", () => {
    const reply = composeLineReply({
      language: "en",
      intents: ["availability", "payment"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: {},
    });

    expect(reply).toContain("Available options");
    expect(reply).toContain("PromptPay");
    expect(reply).toContain("booking");
    expect(reply).not.toContain("ครับ");
  });
});
