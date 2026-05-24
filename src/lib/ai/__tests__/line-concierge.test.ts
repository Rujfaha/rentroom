import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelContext } from "@/types/line-ai.types";

const providerState = vi.hoisted(() => ({
  generate: vi.fn(),
}));

const hotelContext: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: null,
  address: "hello",
  phone: "0993822802",
  email: null,
  contacts: [
    { type: "facebook", label: "facebook", value: "RUJITECH เว็บไซต์และระบบหลังบ้าน" },
    { type: "instagram", label: "instagram", value: "rujitech@gmail.com" },
  ],
  payment: { promptPayConfigured: true, accountName: "arkkarawin" },
  roomTypes: [
    { id: "rt-1", name: "Warmly House", basePrice: 2500, maxGuests: 2, availableRooms: 2 },
    { id: "rt-2", name: "Honeymoon House", basePrice: 3500, maxGuests: 2, availableRooms: 2 },
  ],
  promotions: [],
};

vi.mock("../hotel-context", () => ({
  buildHotelContext: vi.fn(async () => hotelContext),
  formatHotelContextPrompt: vi.fn(() => "hotel context"),
  summarizeAvailability: vi.fn(() => "availability summary"),
}));

vi.mock("../provider", () => ({
  getAiProvider: vi.fn(() => ({
    generate: providerState.generate,
  })),
}));

import { buildBookingUrl, extractAvailabilityRequest, generateLineConciergeReply, normalizeLineReply } from "../line-concierge";

beforeEach(() => {
  providerState.generate.mockReset();
  providerState.generate.mockResolvedValue({
    provider: "gemini",
    model: "test-model",
    text: "Hello from Hospiq",
  });
});

describe("extractAvailabilityRequest", () => {
  it("extracts ISO date ranges and guest count from Thai availability questions", () => {
    expect(extractAvailabilityRequest("มีห้องว่าง 2026-06-01 ถึง 2026-06-03 สำหรับ 2 คนไหม")).toEqual({
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
    });
  });

  it("understands natural Thai relative dates", () => {
    const result = extractAvailabilityRequest("มีห้องว่างพรุ่งนี้ไหม");

    expect(result?.checkIn).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
    expect(result?.checkOut).toMatch(/^20\d{2}-\d{2}-\d{2}$/);
  });
});

describe("normalizeLineReply", () => {
  it("trims long AI output to a LINE-safe text length", () => {
    const reply = normalizeLineReply(" ก ".repeat(3000));

    expect(reply.length).toBeLessThanOrEqual(1900);
    expect(reply.endsWith("...")).toBe(true);
  });

  it("uses fallback text when AI output is blank", () => {
    expect(normalizeLineReply("   ")).toContain("ขออภัย");
  });
});

describe("buildBookingUrl", () => {
  it("builds booking URLs with prefilled query params", () => {
    expect(
      buildBookingUrl("https://example.com", {
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        guests: 2,
      })
    ).toBe("https://example.com/booking?checkIn=2026-06-01&checkOut=2026-06-03&guests=2");
  });
});

describe("generateLineConciergeReply handoff flow", () => {
  it("introduces Hospiq on the first deterministic reply when history is empty", async () => {
    const result = await generateLineConciergeReply("What are the room prices?", { history: [] });

    expect(result.model).toBe("deterministic");
    expect(result.reply).toContain("Hospiq");
    expect(result.reply).toContain("Arkkarawin");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toContain("\n\n");
  });

  it("introduces Hospiq when history only contains inbound customer messages", async () => {
    const result = await generateLineConciergeReply("What are the room prices?", {
      history: [{ direction: "inbound", text: "What are the room prices?", createdAt: "2026-05-24T08:00:00.000Z" }],
    });

    expect(result.model).toBe("deterministic");
    expect(result.reply).toContain("Hospiq");
    expect(result.reply).toContain("Arkkarawin");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toContain("\n\n");
  });

  it("does not introduce Hospiq when memory has a pending handoff", async () => {
    const result = await generateLineConciergeReply("0817963289", {
      memory: {
        handoffPending: {
          reason: "payment_issue",
          priority: "high",
          requestedAt: "2026-05-24T08:00:00.000Z",
        },
      },
    });

    expect(result.model).toBe("deterministic");
    expect(result.reply).not.toContain("Hospiq");
  });

  it("does not introduce Hospiq when history contains an outbound assistant message", async () => {
    const result = await generateLineConciergeReply("What are the room prices?", {
      history: [
        { direction: "inbound", text: "Hello", createdAt: "2026-05-24T08:00:00.000Z" },
        { direction: "outbound", text: "Sure", createdAt: "2026-05-24T08:00:01.000Z" },
        { direction: "inbound", text: "What are the room prices?", createdAt: "2026-05-24T08:01:00.000Z" },
      ],
    });

    expect(result.model).toBe("deterministic");
    expect(result.reply).not.toContain("Hospiq");
    expect(result.reply).toContain("Warmly House");
  });

  it("instructs the fallback provider to introduce Hospiq on first general contact", async () => {
    const result = await generateLineConciergeReply("Hello there", { history: [] });
    const providerInput = providerState.generate.mock.calls[0]?.[0];

    expect(result.model).toBe("test-model");
    expect(providerInput?.prompt).toContain("First customer interaction");
    expect(providerInput?.prompt).toContain("Hospiq");
    expect(providerInput?.prompt).toContain("Arkkarawin");
  });

  it("keeps explicit admin requests focused on human handoff", async () => {
    const result = await generateLineConciergeReply("ติดต่อแอดมินให้หน่อย จองแล้วลืมแนบสลิป");

    expect(result.handoff?.reason).toBe("payment_issue");
    expect(result.intent).toContain("handoff");
    expect(result.memory.handoffPending?.reason).toBe("payment_issue");
    expect(result.reply).toContain("ทีมงาน");
    expect(result.reply).toContain("ชื่อ/เบอร์");
    expect(result.reply).not.toContain("PromptPay");
    expect(result.reply).not.toContain("ที่อยู่");
    expect(result.reply).not.toContain("จองต่อได้ที่");
  });

  it("treats name and phone after handoff as handoff details, not availability", async () => {
    const result = await generateLineConciergeReply("มีนา คนะยก 0817963289", {
      memory: {
        bookingLead: { checkIn: "2026-05-25", checkOut: "2026-05-26", guests: 2 },
        handoffPending: {
          reason: "payment_issue",
          priority: "high",
          requestedAt: "2026-05-24T08:00:00.000Z",
        },
      },
    });

    expect(result.intent).toBe("handoff");
    expect(result.reply).toContain("รับข้อมูลแล้ว");
    expect(result.reply).toContain("ทีมงาน");
    expect(result.reply).not.toContain("Warmly House");
    expect(result.reply).not.toContain("จองต่อได้ที่");
  });
});
