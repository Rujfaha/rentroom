import { describe, expect, it } from "vitest";
import { buildLineResponsePlan } from "../reply-composer";
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
    { id: "rt-1", name: "Warmly House", basePrice: 2500, maxGuests: 2, availableRooms: 2 },
    { id: "rt-2", name: "Honeymoon House", basePrice: 3500, maxGuests: 2, availableRooms: 1 },
  ],
  promotions: [{ title: "Stay longer", description: null, discountText: "10%", validUntil: null }],
  aiKnowledge: { settings: null, faqs: [], testcases: [] },
};

describe("buildLineResponsePlan", () => {
  it("classifies overview questions as information stage and does not allow early booking links", () => {
    const plan = buildLineResponsePlan({
      intents: ["room_overview"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: { bookingLead: { guests: 1 } },
    });

    expect(plan.salesStage).toBe("information");
    expect(plan.requestedFacts).toContain("room_types");
    expect(plan.canIncludeBookingUrl).toBe(false);
  });

  it("keeps multi-intent fact requests instead of collapsing to one branch", () => {
    const plan = buildLineResponsePlan({
      intents: ["price", "promotion", "payment"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: {},
    });

    expect(plan.requestedFacts).toEqual(expect.arrayContaining(["room_prices", "promotions", "payment"]));
  });

  it("allows a booking link only when booking readiness has complete lead data", () => {
    const plan = buildLineResponsePlan({
      intents: ["booking_ready"],
      context,
      bookingUrl: "https://example.com/booking?checkIn=2026-05-26&checkOut=2026-05-27&guests=2",
      memory: {
        bookingLead: {
          checkIn: "2026-05-26",
          checkOut: "2026-05-27",
          guests: 2,
        },
      },
    });

    expect(plan.salesStage).toBe("booking_ready");
    expect(plan.missingBookingFields).toEqual([]);
    expect(plan.canIncludeBookingUrl).toBe(true);
  });

  it("allows booking links even with missing fields when booking is requested", () => {
    const plan = buildLineResponsePlan({
      intents: ["booking_ready"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: { bookingLead: { guests: 2 } },
    });

    expect(plan.canIncludeBookingUrl).toBe(true);
    expect(plan.missingBookingFields[0]).toBe("checkIn");
  });

  it("marks handoff as handoff stage and blocks booking links", () => {
    const plan = buildLineResponsePlan({
      intents: ["handoff", "payment"],
      context,
      bookingUrl: "https://example.com/booking",
      memory: {
        bookingLead: {
          checkIn: "2026-05-26",
          checkOut: "2026-05-27",
          guests: 2,
        },
      },
      handoff: { required: true, reason: "payment_issue", priority: "high" },
    });

    expect(plan.salesStage).toBe("handoff");
    expect(plan.handoff?.reason).toBe("payment_issue");
    expect(plan.canIncludeBookingUrl).toBe(false);
  });
});
