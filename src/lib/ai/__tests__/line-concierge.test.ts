import { describe, expect, it } from "vitest";
import { buildBookingUrl, extractAvailabilityRequest, normalizeLineReply } from "../line-concierge";

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
