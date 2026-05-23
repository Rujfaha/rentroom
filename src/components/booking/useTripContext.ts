"use client";

// ─── Booking Trip Context ─────────────────────────────────
// เก็บ checkIn/checkOut/adults/children ของ booking ใน sessionStorage
// เพื่อให้ค่าคงอยู่เมื่อ user ไป /rooms/[id] แล้วกลับมา /booking
// (rooms ไม่ต้องส่งวัน/จำนวนคนกลับ booking — booking เป็นเจ้าของ trip state)

const TRIP_STORAGE_KEY = "rentroom_booking_trip_v1";
const TRIP_TTL_MS = 1000 * 60 * 60 * 6; // 6 ชั่วโมง

export interface TripState {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

interface TripStorage {
  trip: TripState;
  updatedAt: number;
}

export function readTripState(): TripState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(TRIP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TripStorage;
    if (!parsed || !parsed.trip) return null;
    if (Date.now() - parsed.updatedAt > TRIP_TTL_MS) {
      window.sessionStorage.removeItem(TRIP_STORAGE_KEY);
      return null;
    }
    const t = parsed.trip;
    if (typeof t.checkIn !== "string" || typeof t.checkOut !== "string") return null;
    if (typeof t.adults !== "number" || typeof t.children !== "number") return null;
    return t;
  } catch {
    return null;
  }
}

export function writeTripState(trip: TripState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: TripStorage = { trip, updatedAt: Date.now() };
    window.sessionStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / privacy mode errors
  }
}

export function clearTripState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TRIP_STORAGE_KEY);
  } catch {
    // ignore
  }
}
