import { describe, expect, it } from "vitest";
import { calculateAvailableRoomsByRoomtype, datesOverlap } from "../availability";

describe("availability", () => {
  it("subtracts overlapping pending and confirmed bookings by room count", () => {
    const result = calculateAvailableRoomsByRoomtype({
      checkinDate: "2026-06-01",
      checkoutDate: "2026-06-03",
      roomtypes: [
        { id: "standard", totalRooms: 3, activeRooms: 3 },
        { id: "family", totalRooms: 2, activeRooms: 2 },
      ],
      bookings: [
        {
          roomtypeId: "standard",
          checkinDate: "2026-06-01",
          checkoutDate: "2026-06-02",
          roomCount: 2,
          status: "confirmed",
        },
        {
          roomtypeId: "standard",
          checkinDate: "2026-06-02",
          checkoutDate: "2026-06-04",
          roomCount: 1,
          status: "pending",
        },
        {
          roomtypeId: "family",
          checkinDate: "2026-06-01",
          checkoutDate: "2026-06-03",
          roomCount: 1,
          status: "cancelled",
        },
      ],
    });

    expect(result.get("standard")).toBe(0);
    expect(result.get("family")).toBe(2);
  });

  it("does not count checkout date as occupied for the next guest", () => {
    expect(datesOverlap("2026-06-03", "2026-06-04", "2026-06-01", "2026-06-03")).toBe(false);
  });
});
