import { describe, expect, it } from "vitest";
import {
  isValidBookingDateRange,
  isValidFormTiming,
  normalizeGuestInfo,
  validateWebsiteBookingInput,
} from "../validation";
import type { GuestInfo } from "@/types/landing.types";

const validGuest: GuestInfo = {
  fullName: " Somchai   Jai Dee ",
  phone: "081-234-5678",
  email: " SOMCHAI@example.COM ",
  specialRequests: " late check-in ",
};

const validInput = {
  hotelId: "hotel-1",
  roomTypeId: "room-type-1",
  checkIn: "2026-06-01",
  checkOut: "2026-06-03",
  slipUrl: "/uploads/slips/test.png",
};

describe("booking guest validation", () => {
  it("normalizes guest name, mobile number, email, and special requests", () => {
    expect(normalizeGuestInfo(validGuest)).toEqual({
      fullName: "Somchai Jai Dee",
      phone: "0812345678",
      email: "somchai@example.com",
      specialRequests: "late check-in",
    });
  });

  it("accepts valid Thai mobile numbers after removing spaces and hyphens", () => {
    const guest = normalizeGuestInfo({ ...validGuest, phone: " 081 234 5678 " });

    expect(validateWebsiteBookingInput(validInput, guest, new Date("2026-05-17T00:00:00Z"))).toBeNull();
  });

  it("accepts international phone numbers with a leading plus", () => {
    const guest = normalizeGuestInfo({ ...validGuest, phone: "+66812345678" });

    expect(validateWebsiteBookingInput(validInput, guest, new Date("2026-05-17T00:00:00Z"))).toBeNull();
  });

  it("rejects mobile numbers with letters or too few digits", () => {
    const invalidLetters = normalizeGuestInfo({ ...validGuest, phone: "08123abcde" });
    const tooShort = normalizeGuestInfo({ ...validGuest, phone: "1234567" });

    expect(validateWebsiteBookingInput(validInput, invalidLetters, new Date("2026-05-17T00:00:00Z"))).toBe(
      "กรุณากรอกเบอร์โทรให้ถูกต้อง"
    );
    expect(validateWebsiteBookingInput(validInput, tooShort, new Date("2026-05-17T00:00:00Z"))).toBe(
      "กรุณากรอกเบอร์โทรให้ถูกต้อง"
    );
  });

  it("accepts valid email after trimming and lowercasing", () => {
    const guest = normalizeGuestInfo({ ...validGuest, email: " USER.Name+promo@Example.co.th " });

    expect(guest.email).toBe("user.name+promo@example.co.th");
    expect(validateWebsiteBookingInput(validInput, guest, new Date("2026-05-17T00:00:00Z"))).toBeNull();
  });

  it("rejects malformed email addresses", () => {
    const guest = normalizeGuestInfo({ ...validGuest, email: "user@example" });

    expect(validateWebsiteBookingInput(validInput, guest, new Date("2026-05-17T00:00:00Z"))).toBe(
      "กรุณากรอกอีเมลให้ถูกต้อง"
    );
  });

  it("rejects missing slip, past check-in, and stays longer than 30 nights", () => {
    const guest = normalizeGuestInfo(validGuest);

    expect(validateWebsiteBookingInput({ ...validInput, slipUrl: "" }, guest, new Date("2026-05-17T00:00:00Z"))).toBe(
      "กรุณาแนบหลักฐานการชำระเงิน"
    );
    expect(
      validateWebsiteBookingInput({ ...validInput, checkIn: "2026-05-16" }, guest, new Date("2026-05-17T00:00:00Z"))
    ).toBe("กรุณาเลือกวันที่เข้าพักให้ถูกต้อง");
    expect(
      validateWebsiteBookingInput(
        { ...validInput, checkIn: "2026-06-01", checkOut: "2026-07-05" },
        guest,
        new Date("2026-05-17T00:00:00Z")
      )
    ).toBe("ระยะเวลาการเข้าพักยาวเกินไป กรุณาติดต่อที่พักโดยตรง");
  });
});

describe("booking anti-spam timing validation", () => {
  it("blocks submissions under the minimum form time", () => {
    expect(isValidFormTiming(10_000, 12_999)).toBe(false);
  });

  it("allows submissions at or above the minimum form time", () => {
    expect(isValidFormTiming(10_000, 13_000)).toBe(true);
  });

  it("rejects stale form timestamps", () => {
    expect(isValidFormTiming(10_000, 10_000 + 24 * 60 * 60 * 1000)).toBe(false);
  });
});

describe("booking date range validation", () => {
  it("accepts a checkout date after check-in", () => {
    expect(isValidBookingDateRange("2026-06-01", "2026-06-02")).toBe(true);
  });

  it("rejects missing, invalid, or same-day ranges", () => {
    expect(isValidBookingDateRange("", "2026-06-02")).toBe(false);
    expect(isValidBookingDateRange("invalid", "2026-06-02")).toBe(false);
    expect(isValidBookingDateRange("2026-06-02", "2026-06-02")).toBe(false);
  });
});
