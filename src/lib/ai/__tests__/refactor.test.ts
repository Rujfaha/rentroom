import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelContext, AvailableRoomTypeSummary } from "@/types/line-ai.types";

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
    { id: "rt-3", name: "Slowly House", basePrice: 3000, maxGuests: 2, availableRooms: 2 },
    { id: "rt-4", name: "Forest Hill", basePrice: 4000, maxGuests: 4, availableRooms: 2 },
  ],
  promotions: [],
};

// Mock hotel context and AI provider
vi.mock("../hotel-context", async (importOriginal) => {
  const original = await importOriginal<typeof import("../hotel-context")>();
  return {
    ...original,
    buildHotelContext: vi.fn(async () => original.enrichRoomTypes(hotelContext.roomTypes).reduce((ctx, room) => {
      ctx.roomTypes.push(room);
      return ctx;
    }, { ...hotelContext, roomTypes: [] as AvailableRoomTypeSummary[] })),
  };
});

vi.mock("../provider", () => ({
  getAiProvider: vi.fn(() => ({
    generate: providerState.generate,
  })),
}));

import { generateLineConciergeReply } from "../line-concierge";
import { sanitizeResponse } from "../assistant-profile";

beforeEach(() => {
  providerState.generate.mockReset();
  providerState.generate.mockResolvedValue({
    provider: "gemini",
    model: "test-model",
    text: "สวัสดีครับ ยินดีให้บริการครับ",
  });
});

describe("HOSPIQ AI Flow Refactor - Persona & Sanitization", () => {
  it("enforces female persona in final reply even if LLM uses male particles", async () => {
    const result = await generateLineConciergeReply("สวัสดีครับ");
    expect(result.reply).toContain("ค่ะ");
    expect(result.reply).not.toContain("ครับ");
    expect(result.reply).not.toContain("ผม");
  });

  it("does not sanitize content inside quotes", () => {
    const rawText = 'ลูกค้าพิมพ์มาว่า "สวัสดีครับผมอยากจองห้อง" แอดมินช่วยจองให้ได้ครับ';
    const sanitized = sanitizeResponse(rawText);
    expect(sanitized).toContain('"สวัสดีครับผมอยากจองห้อง"'); // Quoted content is preserved
    expect(sanitized).toContain("แอดมินช่วยจองให้ได้ค่ะ");     // Unquoted content is sanitized
  });
});

describe("HOSPIQ AI Flow Refactor - Room Recommendation", () => {
  it("recommends a scenic room (Forest Hill) and asks check-in dates/guest count when asking for best room", async () => {
    const result = await generateLineConciergeReply("ที่ไหนสวยสุดอ่ะ");
    expect(result.reply).toContain("Forest Hill");
    expect(result.reply).toContain("เข้าพักกี่ท่าน");
    expect(result.reply).toContain("เข้าพักวันไหน");
    expect(result.reply).not.toContain("https://"); // No link sent immediately
  });

  it("filters out wooden-style rooms when client dislikes wooden houses", async () => {
    const result = await generateLineConciergeReply("ไม่ชอบแบบบ้านไม้อ่ะ");
    expect(result.memory.bookingLead?.dislikedFeatures).toContain("wooden-house");
    expect(result.reply).toContain("Forest Hill");
    expect(result.reply).not.toContain("Warmly House");
  });
});

describe("HOSPIQ AI Flow Refactor - Group Booking", () => {
  it("detects group bookings of 10+ guests and advises multi-room arrangement", async () => {
    const result = await generateLineConciergeReply("ไปกัน 20 คนแนะนำห้องไหน");
    expect(result.memory.bookingLead?.isGroupBooking).toBe(true);
    expect(result.memory.bookingLead?.leadScore).toBe("high");
    expect(result.reply).toContain("แนะนำเป็นการจองหลายห้อง");
    expect(result.reply).toContain("ประสานทีมงาน");
  });

  it("retains group booking details in memory when date follow-up is received", async () => {
    const result = await generateLineConciergeReply("25-27 เดือนนี้", {
      memory: {
        bookingLead: {
          guests: 20,
          isGroupBooking: true,
          leadScore: "high",
          source: { guests: "customer" }
        }
      }
    });
    expect(result.memory.bookingLead?.guests).toBe(20);
    expect(result.reply).toContain("20 ท่าน");
    expect(result.reply).toContain("ประสานทีมงาน");
  });

  it("shows unconfident warning instead of repeating static request when group booking provides unconfident dates", async () => {
    const result = await generateLineConciergeReply("วันที่เข้าพักพรุ่งนี้เลยครับ ออกอีกทีวันที่ 30 สนใจห้องที่แพงสุดครับ", {
      memory: {
        bookingLead: {
          guests: 20,
          isGroupBooking: true,
          leadScore: "high",
          source: { guests: "customer" }
        }
      }
    });
    expect(result.reply).toContain("30 เดือนหน้า"); // Unconfident checkout confirmation warning
    expect(result.reply).toContain("ยืนยันวันที่เข้าพัก"); // Requesting confirmation
    expect(result.reply).not.toContain("รบกวนแจ้งวันที่เข้าพัก"); // Doesn't repeat static request
  });
});

describe("HOSPIQ AI Flow Refactor - Direct Answers & Multi-Intent", () => {
  it("answers cheapest room queries by highlighting Warmly House first", async () => {
    const result = await generateLineConciergeReply("ขอข้อมูลเพิ่มเติมของห้องที่ถูกที่สุดหน่อยครับ");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toContain("2,500");
    expect(result.reply).toContain("คุ้มค่าที่สุด");
    expect(result.reply).not.toContain("Honeymoon House"); // Focuses only on the cheapest room
  });

  it("handles room detail request with empty dates politely", async () => {
    const result = await generateLineConciergeReply("สนใจ Warmly house");
    expect(result.memory.bookingLead?.roomTypeName).toBe("Warmly House");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toContain("คุ้มค่า");
    expect(result.reply).toContain("รบกวนแจ้งวันที่เข้าพัก");
  });

  it("handles amenities and availability query without hallucinating availability", async () => {
    const result = await generateLineConciergeReply("มีสิ่งอำนวยความสะดวกอะไรบ้าง Warmly house แล้วว่างวันไหนบ้าง");
    expect(result.reply).toContain("Warmly House");
    expect(result.reply).toContain("WiFi");
    expect(result.reply).toContain("เครื่องทำน้ำอุ่น");
    expect(result.reply).toContain("รบกวนแจ้งวันที่ต้องการเข้าพัก");
    expect(result.reply).not.toContain("ว่าง 2 ห้อง"); // Doesn't say it is available without dates
  });
});

describe("HOSPIQ AI Flow Refactor - Date Override Safety", () => {
  it("overrides previous dates when a new check-in date is given", async () => {
    const result = await generateLineConciergeReply("เข้าพักพรุ่งนี้ออกวันที่30เดือนหน้าครับ ขอเป็นห้อง warmly house", {
      memory: {
        bookingLead: {
          checkIn: "2026-09-01",
          checkOut: "2026-09-02",
          roomTypeName: "Warmly House",
          source: { checkIn: "customer", checkOut: "customer", roomId: "customer" }
        }
      }
    });
    // Check that dates are updated (not using 2026-09-01)
    expect(result.memory.bookingLead?.checkIn).not.toBe("2026-09-01");
    expect(result.memory.bookingLead?.roomTypeName).toBe("Warmly House");
    // Verify that the unconfident checkout date triggers a warning reply
    expect(result.reply).toContain("เช็กเอาต์วันที่ 30 เดือนหน้า");
    expect(result.reply).toContain("ยืนยันวันที่เข้าพัก");
  });
});
