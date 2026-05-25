import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelContext } from "@/types/line-ai.types";

const providerState = vi.hoisted(() => ({
  generate: vi.fn(),
}));

const hotelContext: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: null,
  address: "Chiang Mai",
  phone: "0993822802",
  email: null,
  contacts: [{ type: "line", label: "LINE", value: "@arkkarawin" }],
  payment: { promptPayConfigured: true, accountName: "arkkarawin" },
  roomTypes: [
    { id: "rt-1", name: "Warmly House", basePrice: 2500, maxGuests: 2, availableRooms: 2 },
    { id: "rt-2", name: "Honeymoon House", basePrice: 3500, maxGuests: 2, availableRooms: 2 },
  ],
  promotions: [],
  aiKnowledge: {
    settings: {
      assistantName: "Hospiq",
      tone: "short, warm, hotel admin",
      supportedLanguages: ["th"],
      bookingCtaPolicy: "send booking link only after clear booking readiness",
      handoffPolicy: "handoff payment issues to staff",
      fallbackPolicy: "do not invent missing facts",
      metadata: {},
    },
    faqs: [{ question: "How to pay?", answer: "Upload slip on booking page.", category: "payment", language: "en", keywords: ["payment"] }],
    testcases: [{ userMessage: "room price?", expectedIntent: "price", expectedEntities: {}, expectedBehavior: "show room prices from DB", goldenReply: null, language: "en", tags: [] }],
  },
};

vi.mock("../hotel-context", () => ({
  buildHotelContext: vi.fn(async () => hotelContext),
  formatHotelContextPrompt: vi.fn(() => "hotel facts from db: Warmly House, Honeymoon House"),
  summarizeAvailability: vi.fn(() => "availability summary from db"),
}));

vi.mock("../provider", () => ({
  getAiProvider: vi.fn(() => ({
    generate: providerState.generate,
  })),
}));

import { buildBookingUrl, generateLineConciergeReply, normalizeLineReply } from "../line-concierge";

beforeEach(() => {
  providerState.generate.mockReset();
  mockConversation({ primaryIntent: "general", intents: ["general"] }, "Final grounded reply");
});

describe("normalizeLineReply", () => {
  it("trims long AI output to a LINE-safe text length", () => {
    const reply = normalizeLineReply(" a ".repeat(3000));
    expect(reply.length).toBeLessThanOrEqual(1900);
    expect(reply.endsWith("...")).toBe(true);
  });

  it("uses fallback text when AI output is blank", () => {
    expect(normalizeLineReply("   ").length).toBeGreaterThan(0);
  });
});

describe("buildBookingUrl", () => {
  it("builds booking URLs with prefilled query params", () => {
    expect(
      buildBookingUrl("https://example.com", {
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        guests: 2,
      }),
    ).toBe("https://example.com/booking?checkIn=2026-06-01&checkOut=2026-06-03&guests=2");
  });
});

describe("generateLineConciergeReply", () => {
  it("uses LLM twice: extraction first, grounded response second", async () => {
    mockConversation({ primaryIntent: "room_overview", intents: ["room_overview"] }, "Hospiq final room overview");
    const result = await generateLineConciergeReply("What room types do you have?");

    expect(providerState.generate).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("response-test");
    expect(result.reply).toBe("Hospiq final room overview");
  });

  it("passes DB facts, FAQ, testcases, and response plan into final generation", async () => {
    mockConversation({ primaryIntent: "price", intents: ["price", "promotion"] }, "Final");
    await generateLineConciergeReply("price and promo?");

    const finalPrompt = providerState.generate.mock.calls[1]?.[0]?.prompt ?? "";
    expect(finalPrompt).toContain("Hotel facts from database");
    expect(finalPrompt).toContain("FAQ examples from database");
    expect(finalPrompt).toContain("Golden testcases from database");
    expect(finalPrompt).toContain("Response plan");
    expect(finalPrompt).toContain("room_prices");
    expect(finalPrompt).toContain("promotions");
  });

  it("keeps memory from extracted entities", async () => {
    mockConversation({
      primaryIntent: "booking_ready",
      intents: ["booking_ready", "booking"],
      entities: { roomTypeName: "Honeymoon House", guests: 2 },
    }, "Please provide check-in date.");

    const result = await generateLineConciergeReply("I want to book Honeymoon House for 2");
    expect(result.memory.bookingLead?.roomTypeName).toBe("Honeymoon House");
    expect(result.memory.bookingLead?.guests).toBe(2);
  });

  it("allows booking URL in the response plan when interest in booking is shown", async () => {
    mockConversation({
      primaryIntent: "booking_ready",
      intents: ["booking_ready", "booking"],
      entities: { roomTypeName: "Honeymoon House", guests: 2 },
    }, "Please provide check-in date.");

    await generateLineConciergeReply("I want to book Honeymoon House for 2");
    const finalPrompt = providerState.generate.mock.calls[1]?.[0]?.prompt ?? "";
    expect(finalPrompt).toContain('"canIncludeBookingUrl": true');
    expect(finalPrompt).toContain('"checkIn"');
  });

  it("allows booking URL only after clear readiness with complete booking details", async () => {
    mockConversation({
      primaryIntent: "booking_ready",
      intents: ["booking_ready", "booking"],
      entities: { checkIn: "2026-06-01", checkOut: "2026-06-03", guests: 2 },
    }, "Book here: https://example.com/booking?checkIn=2026-06-01&checkOut=2026-06-03&guests=2");

    await generateLineConciergeReply("book 1-3 June for 2");
    const finalPrompt = providerState.generate.mock.calls[1]?.[0]?.prompt ?? "";
    expect(finalPrompt).toContain('"canIncludeBookingUrl": true');
    expect(finalPrompt).toContain("http://localhost:3000/booking?checkIn=2026-06-01&checkOut=2026-06-03&guests=2");
  });

  it("keeps pending handoff focused in the response plan", async () => {
    mockConversation({ primaryIntent: "general", intents: ["general"] }, "Staff will follow up.");
    const result = await generateLineConciergeReply("Mina 0817963289", {
      memory: {
        handoffPending: {
          reason: "payment_issue",
          priority: "high",
          requestedAt: "2026-05-24T08:00:00.000Z",
        },
      },
    });

    const finalPrompt = providerState.generate.mock.calls[1]?.[0]?.prompt ?? "";
    expect(result.intent).toBe("handoff");
    expect(finalPrompt).toContain('"salesStage": "handoff"');
    expect(finalPrompt).toContain('"reason": "payment_issue"');
  });

  it("adds Hospiq persona, sales flow, and grounded fact rules to final prompts", async () => {
    mockConversation({ primaryIntent: "general", intents: ["general"] }, "Hello from Hospiq");
    await generateLineConciergeReply("Hello", { history: [] });

    const finalInput = providerState.generate.mock.calls[1]?.[0];
    expect(finalInput?.system).toContain("Hospiq");
    expect(finalInput?.prompt).toContain("First customer interaction");
    expect(finalInput?.prompt).toContain("Hospiq sales flow");
    expect(finalInput?.prompt).toContain("Do not use canned templates or invent hotel-specific facts");
  });
});

function mockConversation(
  input: {
    primaryIntent: string;
    intents: string[];
    language?: string;
    entities?: Record<string, unknown>;
    handoff?: Record<string, unknown> | null;
  },
  finalReply: string,
): void {
  providerState.generate.mockReset();
  providerState.generate
    .mockResolvedValueOnce({
      provider: "gemini",
      model: "extractor-test",
      text: extractionJson(input),
    })
    .mockResolvedValueOnce({
      provider: "gemini",
      model: "response-test",
      text: finalReply,
    });
}

function extractionJson(input: {
  primaryIntent: string;
  intents: string[];
  language?: string;
  entities?: Record<string, unknown>;
  handoff?: Record<string, unknown> | null;
}): string {
  return JSON.stringify({
    language: input.language ?? "en",
    primaryIntent: input.primaryIntent,
    intents: input.intents,
    entities: input.entities ?? {},
    handoff: input.handoff ?? null,
  });
}
