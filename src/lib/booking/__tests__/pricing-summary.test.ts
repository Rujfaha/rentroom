import { describe, expect, it } from "vitest";
import {
  calculateBookingRoomSubtotal,
  calculateBookingRoomTotal,
  calculateBookingRoomsTotal,
} from "../pricing-summary";
import type { RoomTypeDisplay } from "@/types/landing.types";

function room(overrides: Partial<RoomTypeDisplay>): RoomTypeDisplay {
  return {
    id: "room-type-1",
    name: "Deluxe",
    description: "",
    shortDescription: "",
    coverImageUrl: "/placeholder-room.jpg",
    galleryUrls: [],
    basePrice: 1000,
    maxGuests: 2,
    extraBedPrice: 300,
    maxExtraBeds: 1,
    bedType: "King",
    roomSize: 30,
    amenities: [],
    isActive: true,
    availableRoomsCount: 2,
    ...overrides,
  };
}

describe("booking pricing summary", () => {
  it("adds extra bed charge for guests above standard capacity", () => {
    expect(calculateBookingRoomTotal(room({}), 2, 3)).toBe(2600);
  });

  it("uses stayTotal as the authoritative room total when present", () => {
    expect(calculateBookingRoomTotal(room({ stayTotal: 2600 }), 2, 3)).toBe(2600);
  });

  it("sums repeated cart rooms with extra bed pricing", () => {
    expect(calculateBookingRoomsTotal([room({}), room({ id: "room-type-2" })], 2, 3)).toBe(5200);
  });

  it("builds server-side room subtotal from base stay total and extra bed charge", () => {
    expect(
      calculateBookingRoomSubtotal({
        roomBaseTotal: 2400,
        totalGuests: 4,
        standardGuests: 2,
        extraBedPrice: 350,
        totalNights: 2,
      })
    ).toBe(3800);
  });
});
