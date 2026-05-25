import { describe, expect, it } from "vitest";
import { createRoomtypeSchema } from "../roomtype.schema";

describe("createRoomtypeSchema", () => {
  it("accepts a minimal valid roomtype", () => {
    const parsed = createRoomtypeSchema.parse({
      name: "Standard",
      basePrice: 900,
      totalRooms: 5,
    });

    expect(parsed.name).toBe("Standard");
    expect(parsed.basePrice).toBe(900);
    expect(parsed.totalRooms).toBe(5);
  });

  it("rejects negative price", () => {
    expect(() =>
      createRoomtypeSchema.parse({
        name: "Standard",
        basePrice: -1,
      }),
    ).toThrow();
  });
});
