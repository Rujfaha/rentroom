import { describe, expect, it } from "vitest";
import { enrichRoomInfo, formatHotelContextPrompt, summarizeAvailability } from "../hotel-context";
import type { HotelContext } from "@/types/line-ai.types";

const context: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: "ที่พักในหุบเขา",
  address: "เชียงใหม่",
  phone: "0812345678",
  email: "stay@example.com",
  contacts: [{ type: "line", label: "LINE", value: "@arkkarawin" }],
  payment: { promptPayConfigured: true, accountName: "Arkkarawin Resort" },
  roomTypes: [
    { id: "rt-1", name: "Deluxe", basePrice: 1200, maxGuests: 2, availableRooms: 3 },
    { id: "rt-2", name: "Family", basePrice: 2200, maxGuests: 4, availableRooms: 1 },
  ],
  promotions: [{ title: "Stay Longer", description: "พัก 2 คืนลดเพิ่ม", discountText: "10%", validUntil: "2026-06-30" }],
  aiKnowledge: { settings: null, faqs: [], testcases: [] },
};

describe("formatHotelContextPrompt", () => {
  it("formats concise hotel context for AI prompts", () => {
    const prompt = formatHotelContextPrompt(context);

    expect(prompt).toContain("โรงแรม: Arkkarawin");
    expect(prompt).toContain("Deluxe: ราคาเริ่มต้น 1,200 บาท");
    expect(prompt).toContain("LINE: @arkkarawin");
    expect(prompt).toContain("Stay Longer");
  });
});

describe("enrichRoomInfo", () => {
  it("uses only DB room facts and does not add hardcoded room descriptions or amenities", () => {
    const room = enrichRoomInfo({
      id: "rt-1",
      name: "Warmly House",
      basePrice: 2500,
      maxGuests: 2,
      availableRooms: 2,
      description: null,
      amenities: null,
    });

    expect(room.description).toBeNull();
    expect(room.amenities).toEqual(null);
    expect(room.style).toEqual([]);
    expect(room.suitableFor).toEqual([]);
    expect(room.notSuitableFor).toEqual([]);
  });

  it("keeps DB-provided room descriptions and amenities", () => {
    const room = enrichRoomInfo({
      id: "rt-2",
      name: "Any Hotel Room",
      basePrice: 3200,
      maxGuests: 3,
      availableRooms: 1,
      description: "วิวสวน ใกล้สระว่ายน้ำ",
      amenities: ["WiFi", "เครื่องทำน้ำอุ่น"],
    });

    expect(room.description).toBe("วิวสวน ใกล้สระว่ายน้ำ");
    expect(room.amenities).toEqual(["WiFi", "เครื่องทำน้ำอุ่น"]);
  });
});

describe("summarizeAvailability", () => {
  it("summarizes available rooms for a requested stay", () => {
    const summary = summarizeAvailability({
      ...context,
      availability: {
        request: { checkIn: "2026-06-01", checkOut: "2026-06-03", guests: 2 },
        roomTypes: [context.roomTypes[0]!],
      },
    });

    expect(summary).toContain("2026-06-01 ถึง 2026-06-03");
    expect(summary).toContain("Deluxe");
    expect(summary).toContain("ว่าง 3 ห้อง");
  });

  it("states clearly when no rooms are available", () => {
    const summary = summarizeAvailability({
      ...context,
      availability: {
        request: { checkIn: "2026-06-01", checkOut: "2026-06-03" },
        roomTypes: [],
      },
    });

    expect(summary).toContain("ยังไม่พบห้องว่าง");
  });
});
