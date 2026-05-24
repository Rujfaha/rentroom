import { describe, expect, it } from "vitest";
import { buildDeterministicReply, detectLineIntent, mergeBookingLead } from "../intent-router";
import type { HotelContext, LineConversationMemory } from "@/types/line-ai.types";

const context: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: null,
  address: "เชียงใหม่",
  phone: "0812345678",
  email: "stay@example.com",
  contacts: [{ type: "line", label: "LINE", value: "@arkkarawin" }],
  payment: {
    promptPayConfigured: true,
    accountName: "Arkkarawin Resort",
  },
  roomTypes: [
    { id: "rt-1", name: "Deluxe", basePrice: 1200, maxGuests: 2, availableRooms: 3 },
    { id: "rt-2", name: "Family", basePrice: 2200, maxGuests: 4, availableRooms: 1 },
  ],
  promotions: [{ title: "พักยาวลดเพิ่ม", description: "พัก 2 คืนขึ้นไป", discountText: "10%", validUntil: null }],
};

describe("detectLineIntent", () => {
  it("detects common hotel intents", () => {
    expect(detectLineIntent("ชำระเงินทางไหนได้บ้าง")).toBe("payment");
    expect(detectLineIntent("มีห้องว่างพรุ่งนี้ไหม")).toBe("availability");
    expect(detectLineIntent("ราคาเท่าไหร่")).toBe("price");
    expect(detectLineIntent("มีโปรอะไรบ้าง")).toBe("promotion");
    expect(detectLineIntent("ติดต่อยังไง")).toBe("contact");
    expect(detectLineIntent("อยากจอง")).toBe("booking");
  });
});

describe("buildDeterministicReply", () => {
  it("answers payment questions directly from system data", () => {
    const reply = buildDeterministicReply({
      intent: "payment",
      context,
      bookingUrl: "https://example.com/booking",
      memory: {},
    });

    expect(reply).toContain("PromptPay");
    expect(reply).toContain("อัปโหลดสลิป");
    expect(reply).toContain("https://example.com/booking");
  });

  it("answers price questions with room type starting prices", () => {
    const reply = buildDeterministicReply({
      intent: "price",
      context,
      bookingUrl: "https://example.com/booking",
      memory: {},
    });

    expect(reply).toContain("Deluxe");
    expect(reply).toContain("1,200");
    expect(reply).toContain("Family");
  });
});

describe("mergeBookingLead", () => {
  it("keeps previous booking lead values and fills new values", () => {
    const memory: LineConversationMemory = {
      bookingLead: { checkIn: "2026-06-01", checkOut: "2026-06-03" },
    };

    expect(mergeBookingLead(memory, { guests: 2 })).toEqual({
      bookingLead: { checkIn: "2026-06-01", checkOut: "2026-06-03", guests: 2 },
    });
  });
});
