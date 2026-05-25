import { describe, expect, it } from "vitest";
import { enforceFemalePoliteThaiTone, preventCrossHotelLeak } from "../response-guard";

describe("response guard", () => {
  it("replaces masculine Thai polite particle", () => {
    expect(enforceFemalePoliteThaiTone("ได้ครับ")).toBe("ได้ค่ะ");
  });

  it("blocks cross hotel data leak marker", () => {
    expect(preventCrossHotelLeak("ข้อมูล hotel_id อื่น", "hotel-1").allowed).toBe(false);
  });
});
