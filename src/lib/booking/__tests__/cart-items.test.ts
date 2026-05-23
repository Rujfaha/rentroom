import { describe, expect, it } from "vitest";
import {
  mergeRoomIntoCart,
  normalizeCartItems,
  syncCartSnapshots,
  type StoredBookingCartItem,
} from "../cart-items";
import type { RoomTypeDisplay } from "@/types/landing.types";

function room(id: string, overrides: Partial<RoomTypeDisplay> = {}): RoomTypeDisplay {
  return {
    id,
    name: "Room " + id,
    description: "",
    shortDescription: "",
    coverImageUrl: "/placeholder-room.jpg",
    galleryUrls: [],
    basePrice: 1000,
    stayTotal: 2000,
    maxGuests: 2,
    extraBedPrice: 0,
    maxExtraBeds: 0,
    bedType: "King",
    roomSize: 30,
    amenities: [],
    isActive: true,
    availableRoomsCount: 3,
    ...overrides,
  };
}

describe("booking cart item hygiene", () => {
  it("drops stored items whose snapshot id does not match the cart room type id", () => {
    const items: StoredBookingCartItem[] = [
      { roomTypeId: "deluxe", quantity: 1, snapshot: room("suite"), addedAt: 1 },
    ];

    expect(normalizeCartItems(items)).toEqual([]);
  });

  it("refreshes the snapshot even when adding an existing room cannot increase quantity", () => {
    const oldRoom = room("deluxe", { basePrice: 1000, stayTotal: 2000, availableRoomsCount: 1 });
    const freshRoom = room("deluxe", { basePrice: 1200, stayTotal: 2400, availableRoomsCount: 1 });

    const items = mergeRoomIntoCart(
      [{ roomTypeId: "deluxe", quantity: 1, snapshot: oldRoom, addedAt: 1 }],
      freshRoom,
      1,
      2
    );

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].snapshot.basePrice).toBe(1200);
    expect(items[0].snapshot.stayTotal).toBe(2400);
  });

  it("syncs all display fields from fresh room data, not only prices", () => {
    const items = syncCartSnapshots(
      [{ roomTypeId: "deluxe", quantity: 2, snapshot: room("deluxe", { name: "Old" }), addedAt: 1 }],
      [room("deluxe", { name: "Fresh", basePrice: 1500, stayTotal: 3000, availableRoomsCount: 1 })],
      2
    );

    expect(items[0].quantity).toBe(1);
    expect(items[0].snapshot.name).toBe("Fresh");
    expect(items[0].snapshot.basePrice).toBe(1500);
  });
});
