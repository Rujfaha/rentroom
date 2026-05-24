import { describe, expect, it } from "vitest";
import { parseThaiDateRange } from "../thai-date-parser";

const baseDate = new Date("2026-05-24T00:00:00+07:00");

describe("parseThaiDateRange", () => {
  it("extracts ISO date ranges and guest count", () => {
    expect(parseThaiDateRange("มีห้องว่าง 2026-06-01 ถึง 2026-06-03 สำหรับ 2 คนไหม", baseDate)).toEqual({
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
    });
  });

  it("understands tomorrow as a one-night stay", () => {
    expect(parseThaiDateRange("พรุ่งนี้ว่างไหม 2 คน", baseDate)).toEqual({
      checkIn: "2026-05-25",
      checkOut: "2026-05-26",
      guests: 2,
    });
  });

  it("understands Thai short month date ranges", () => {
    expect(parseThaiDateRange("วันที่ 1-3 มิ.ย. 2 คน", baseDate)).toEqual({
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
    });
  });

  it("understands this Saturday as a one-night stay", () => {
    expect(parseThaiDateRange("เสาร์นี้มีห้องไหม", baseDate)).toEqual({
      checkIn: "2026-05-30",
      checkOut: "2026-05-31",
    });
  });
});
