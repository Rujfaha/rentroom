"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RoomTypeDisplay } from "@/types/landing.types";
import {
  mergeRoomIntoCart,
  normalizeCartItems,
  setCartItemQuantity,
  syncCartSnapshots,
  type StoredBookingCartItem,
} from "@/lib/booking/cart-items";

const CART_STORAGE_KEY = "rentroom_booking_cart_v3";
const LEGACY_CART_STORAGE_KEYS = ["rentroom_booking_cart_v2"];
const CART_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_QTY_PER_ROOM_TYPE = 5;

export type BookingCartItem = StoredBookingCartItem;

interface CartStorage {
  items: BookingCartItem[];
  updatedAt: number;
}

function readCart(): BookingCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const legacyRaw = raw || LEGACY_CART_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!legacyRaw) return [];

    const parsed = JSON.parse(legacyRaw) as Partial<CartStorage>;
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.updatedAt !== "number") return [];
    if (Date.now() - parsed.updatedAt > CART_TTL_MS) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      LEGACY_CART_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      return [];
    }

    return normalizeCartItems(parsed.items, MAX_QTY_PER_ROOM_TYPE);
  } catch {
    return [];
  }
}

function writeCart(items: BookingCartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    LEGACY_CART_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    const sanitized = normalizeCartItems(items, MAX_QTY_PER_ROOM_TYPE);
    if (sanitized.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const payload: CartStorage = { items: sanitized, updatedAt: Date.now() };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / privacy mode errors
  }
}

export interface UseBookingCart {
  items: BookingCartItem[];
  isHydrated: boolean;
  totalRoomCount: number;
  itemTypeCount: number;
  addRoom: (room: RoomTypeDisplay, qty?: number) => void;
  setQuantity: (roomTypeId: string, qty: number) => void;
  removeRoom: (roomTypeId: string) => void;
  clearCart: () => void;
  isInCart: (roomTypeId: string) => boolean;
  getQuantity: (roomTypeId: string) => number;
  syncSnapshots: (rooms: RoomTypeDisplay[]) => void;
  pruneUnavailable: () => string[];
}

export function useBookingCart(): UseBookingCart {
  const [items, setItems] = useState<BookingCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(function () {
    const timeoutId = window.setTimeout(function () {
      setItems(readCart());
      setHydrated(true);
    }, 0);
    return function () {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(function () {
    function onStorage(e: StorageEvent) {
      if (e.key !== CART_STORAGE_KEY && !LEGACY_CART_STORAGE_KEYS.includes(e.key || "")) return;
      setItems(readCart());
    }
    window.addEventListener("storage", onStorage);
    return function () {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(function () {
    if (!hydrated) return;
    writeCart(items);
  }, [items, hydrated]);

  const addRoom = useCallback(function (room: RoomTypeDisplay, qty: number = 1) {
    setItems(function (current) {
      return mergeRoomIntoCart(current, room, qty, MAX_QTY_PER_ROOM_TYPE);
    });
  }, []);

  const setQuantity = useCallback(function (roomTypeId: string, qty: number) {
    setItems(function (current) {
      return setCartItemQuantity(current, roomTypeId, qty, MAX_QTY_PER_ROOM_TYPE);
    });
  }, []);

  const removeRoom = useCallback(function (roomTypeId: string) {
    setItems(function (current) {
      return normalizeCartItems(current, MAX_QTY_PER_ROOM_TYPE).filter((item) => item.roomTypeId !== roomTypeId);
    });
  }, []);

  const clearCart = useCallback(function () {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    function (roomTypeId: string) {
      return items.some((item) => item.roomTypeId === roomTypeId && item.snapshot.id === roomTypeId);
    },
    [items]
  );

  const getQuantity = useCallback(
    function (roomTypeId: string) {
      const item = items.find((candidate) => candidate.roomTypeId === roomTypeId && candidate.snapshot.id === roomTypeId);
      return item?.quantity ?? 0;
    },
    [items]
  );

  const syncSnapshots = useCallback(function (rooms: RoomTypeDisplay[]) {
    setItems(function (current) {
      if (current.length === 0) return current;
      return syncCartSnapshots(current, rooms, MAX_QTY_PER_ROOM_TYPE);
    });
  }, []);

  const pruneUnavailable = useCallback(function (): string[] {
    const removed: string[] = [];
    setItems(function (current) {
      const next = normalizeCartItems(current, MAX_QTY_PER_ROOM_TYPE).filter(function (item) {
        if (item.snapshot.availableRoomsCount > 0) return true;
        removed.push(item.snapshot.name);
        return false;
      });
      return next.length === current.length ? current : next;
    });
    return removed;
  }, []);

  return useMemo(
    function () {
      const safeItems = normalizeCartItems(items, MAX_QTY_PER_ROOM_TYPE);
      const totalRoomCount = safeItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        items: safeItems,
        isHydrated: hydrated,
        totalRoomCount,
        itemTypeCount: safeItems.length,
        addRoom,
        setQuantity,
        removeRoom,
        clearCart,
        isInCart,
        getQuantity,
        syncSnapshots,
        pruneUnavailable,
      };
    },
    [items, hydrated, addRoom, setQuantity, removeRoom, clearCart, isInCart, getQuantity, syncSnapshots, pruneUnavailable]
  );
}
