import { describe, expect, it } from "vitest";
import { createEmptyMemory } from "../hotel-context";
import { resolveAiPolicy } from "../policy-resolver";
import type { HospiqAiContext } from "../types";

function createContext(overrides: Partial<HospiqAiContext> = {}): HospiqAiContext {
  return {
    hotelId: "hotel-1",
    hotelName: "Demo",
    hasWebbooking: true,
    webbookingUrl: "https://example.com/book",
    roomtypes: [],
    faqs: [],
    aiSetting: {
      assistantName: "Hospiq",
      assistantGenderTone: "female_polite",
      supportedLanguages: ["th"],
      bookingCtaPolicy: { enabled: true },
      handoffPolicy: {},
      fallbackPolicy: {},
      maxReplyLength: 700,
      fallbackToAdminEnabled: true,
      adminContactMessage: null,
    },
    memory: createEmptyMemory(),
    ...overrides,
  };
}

describe("resolveAiPolicy", () => {
  it("allows booking link only when webbooking is configured and policy is enabled", () => {
    expect(resolveAiPolicy(createContext(), "booking_intent").canOfferBookingLink).toBe(true);
    expect(resolveAiPolicy(createContext({ webbookingUrl: null }), "booking_intent").canOfferBookingLink).toBe(false);
  });

  it("marks handoff request intent for escalation", () => {
    expect(resolveAiPolicy(createContext(), "handoff_request").shouldHandoff).toBe(true);
  });
});
