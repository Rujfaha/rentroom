import type { RoomTypeDisplay } from "@/types/landing.types";

export interface StoredBookingCartItem {
  roomTypeId: string;
  quantity: number;
  snapshot: RoomTypeDisplay;
  addedAt: number;
}

function isRoomSnapshot(value: unknown): value is RoomTypeDisplay {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RoomTypeDisplay>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.basePrice === "number" &&
    typeof candidate.maxGuests === "number" &&
    typeof candidate.availableRoomsCount === "number"
  );
}

export function clampCartQuantity(qty: number, maxAvailable: number, maxQtyPerRoomType: number): number {
  if (!Number.isFinite(qty) || qty < 1) return 1;
  const ceiling = Math.min(maxQtyPerRoomType, Math.max(1, maxAvailable));
  return Math.min(Math.max(1, Math.floor(qty)), ceiling);
}

export function normalizeCartItems(
  items: unknown[],
  maxQtyPerRoomType: number = 5
): StoredBookingCartItem[] {
  const normalized: StoredBookingCartItem[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<StoredBookingCartItem>;
    if (typeof candidate.roomTypeId !== "string") continue;
    if (!isRoomSnapshot(candidate.snapshot)) continue;
    if (candidate.snapshot.id !== candidate.roomTypeId) continue;

    const existingIndex = normalized.findIndex((current) => current.roomTypeId === candidate.roomTypeId);
    const quantity = clampCartQuantity(
      Number(candidate.quantity) || 1,
      candidate.snapshot.availableRoomsCount,
      maxQtyPerRoomType
    );
    const nextItem: StoredBookingCartItem = {
      roomTypeId: candidate.roomTypeId,
      quantity,
      snapshot: candidate.snapshot,
      addedAt: Number(candidate.addedAt) || Date.now(),
    };

    if (existingIndex >= 0) {
      const existing = normalized[existingIndex];
      normalized[existingIndex] = {
        ...nextItem,
        quantity: clampCartQuantity(existing.quantity + quantity, candidate.snapshot.availableRoomsCount, maxQtyPerRoomType),
        addedAt: Math.min(existing.addedAt, nextItem.addedAt),
      };
    } else {
      normalized.push(nextItem);
    }
  }

  return normalized;
}

export function mergeRoomIntoCart(
  current: StoredBookingCartItem[],
  room: RoomTypeDisplay,
  qty: number,
  maxQtyPerRoomType: number
): StoredBookingCartItem[] {
  const sanitized = normalizeCartItems(current, maxQtyPerRoomType);
  const idx = sanitized.findIndex((item) => item.roomTypeId === room.id);

  if (idx >= 0) {
    const existing = sanitized[idx];
    const nextQty = clampCartQuantity(existing.quantity + qty, room.availableRoomsCount, maxQtyPerRoomType);
    const next = sanitized.slice();
    next[idx] = { ...existing, quantity: nextQty, snapshot: room };
    return next;
  }

  return [
    ...sanitized,
    {
      roomTypeId: room.id,
      quantity: clampCartQuantity(qty, room.availableRoomsCount, maxQtyPerRoomType),
      snapshot: room,
      addedAt: Date.now(),
    },
  ];
}

export function setCartItemQuantity(
  current: StoredBookingCartItem[],
  roomTypeId: string,
  qty: number,
  maxQtyPerRoomType: number
): StoredBookingCartItem[] {
  const sanitized = normalizeCartItems(current, maxQtyPerRoomType);
  const idx = sanitized.findIndex((item) => item.roomTypeId === roomTypeId);
  if (idx < 0) return sanitized;
  if (qty <= 0) return sanitized.filter((item) => item.roomTypeId !== roomTypeId);

  const existing = sanitized[idx];
  const next = sanitized.slice();
  next[idx] = {
    ...existing,
    quantity: clampCartQuantity(qty, existing.snapshot.availableRoomsCount, maxQtyPerRoomType),
  };
  return next;
}

export function syncCartSnapshots(
  current: StoredBookingCartItem[],
  rooms: RoomTypeDisplay[],
  maxQtyPerRoomType: number
): StoredBookingCartItem[] {
  const byId = new Map(rooms.map((room) => [room.id, room] as const));

  return normalizeCartItems(current, maxQtyPerRoomType)
    .map((item) => {
      const fresh = byId.get(item.roomTypeId);
      if (!fresh) return item;
      return {
        ...item,
        snapshot: fresh,
        quantity: clampCartQuantity(item.quantity, fresh.availableRoomsCount, maxQtyPerRoomType),
      };
    })
    .filter((item) => item.snapshot.id === item.roomTypeId);
}
