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
  phone: "0812345678",
  email: "stay@example.com",
  contacts: [{ type: "line", label: "LINE", value: "@arkkarawin" }],
  payment: { promptPayConfigured: true, accountName: "Arkkarawin Resort" },
  roomTypes: [
    { id: "rt-1", name: "Warmly House", basePrice: 2500, maxGuests: 2, availableRooms: 2 },
    { id: "rt-2", name: "Honeymoon House", basePrice: 3500, maxGuests: 2, availableRooms: 2 },
    { id: "rt-3", name: "Forest Hill", basePrice: 4000, maxGuests: 4, availableRooms: 2 },
  ],
  promotions: [],
  aiKnowledge: { settings: null, faqs: [], testcases: [] },
};

vi.mock("../hotel-context", async (importOriginal) => {
  const original = await importOriginal<typeof import("../hotel-context")>();
  return {
    ...original,
    buildHotelContext: vi.fn(async () => hotelContext),
  };
});

vi.mock("../provider", () => ({
  getAiProvider: vi.fn(() => ({
    generate: providerState.generate,
  })),
}));

import { sanitizeResponse } from "../assistant-profile";
import { generateLineConciergeReply } from "../line-concierge";

beforeEach(() => {
  providerState.generate.mockReset();
});

describe("HOSPIQ AI Flow Refactor - LLM core", () => {
  it("sanitizes final LLM persona when the model uses male Thai particles", async () => {
    mockConversation({ primaryIntent: "general", intents: ["general"], language: "th" }, "สวัสดีครับ ยินดีให้บริการครับ");
    const result = await generateLineConciergeReply("สวัสดีครับ");

    expect(result.reply).toContain("ค่ะ");
    expect(result.reply).not.toContain("ครับ");
  });

  it("does not invent style facts in code; style guidance must come from DB prompt facts", async () => {
    mockConversation({
      primaryIntent: "room_recommendation",
      intents: ["room_recommendation"],
      entities: { roomPreference: ["beautiful"] },
      language: "th",
    }, "ยังไม่มีข้อมูลจุดเด่นในระบบค่ะ");

    await generateLineConciergeReply("ที่ไหนสวยสุด");
    const finalPrompt = providerState.generate.mock.calls[1]?.[0]?.prompt ?? "";
    expect(finalPrompt).not.toContain("wooden-house");
    expect(finalPrompt).not.toContain("photo-friendly");
    expect(finalPrompt).toContain("If a requested fact is missing");
  });

  it("keeps extracted group booking entities in memory and delegates wording to LLM", async () => {
    mockConversation({
      primaryIntent: "group_booking",
      intents: ["group_booking", "booking"],
      entities: { guests: 20, isGroupBooking: true, leadScore: "high" },
      handoff: { required: true, reason: "group_booking", priority: "normal" },
      language: "th",
    }, "ทีมงานจะช่วยดูตัวเลือกสำหรับกรุ๊ปค่ะ");

    const result = await generateLineConciergeReply("ไปกัน 20 คน");
    expect(result.memory.bookingLead?.guests).toBe(20);
    expect(result.memory.bookingLead?.isGroupBooking).toBe(true);
    expect(result.handoff?.reason).toBe("group_booking");
  });

  it("overrides previous dates using LLM-extracted ISO entities", async () => {
    mockConversation({
      primaryIntent: "booking_ready",
      intents: ["booking_ready", "booking"],
      entities: {
        roomTypeName: "Warmly House",
        checkIn: "2026-05-25",
        checkOut: "2026-06-30",
      },
      language: "th",
    }, "ขอจำนวนผู้เข้าพักค่ะ");

    const result = await generateLineConciergeReply("เข้าพักพรุ่งนี้ ออกวันที่ 30 เดือนหน้า", {
      memory: {
        bookingLead: {
          checkIn: "2026-09-01",
          checkOut: "2026-09-02",
          roomTypeName: "Warmly House",
          source: { checkIn: "customer", checkOut: "customer", roomId: "customer" },
        },
      },
    });

    expect(result.memory.bookingLead?.checkIn).toBe("2026-05-25");
    expect(result.memory.bookingLead?.checkOut).toBe("2026-06-30");
    expect(result.memory.bookingLead?.roomTypeName).toBe("Warmly House");
  });

  it("preserves quoted customer text while sanitizing unquoted assistant wording", () => {
    const rawText = 'ลูกค้าพิมพ์ว่า "สวัสดีครับผมอยากจองห้อง" แอดมินช่วยจองให้ได้ครับ';
    const sanitized = sanitizeResponse(rawText);
    expect(sanitized).toContain('"สวัสดีครับผมอยากจองห้อง"');
    expect(sanitized).toContain("ค่ะ");
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
    language: input.language ?? "th",
    primaryIntent: input.primaryIntent,
    intents: input.intents,
    entities: input.entities ?? {},
    handoff: input.handoff ?? null,
  });
}
