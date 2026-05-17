import type { GuestInfo } from "@/types/landing.types";

export interface WebsiteBookingValidationInput {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  slipUrl: string;
}

export interface NormalizedGuestInfo {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
}

export const MIN_BOOKING_FORM_TIME_MS = 3000;
export const MAX_BOOKING_NIGHTS = 30;

export function calculateBookingNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export function normalizeGuestInfo(guest: GuestInfo): NormalizedGuestInfo {
  return {
    fullName: guest.fullName.trim().replace(/\s+/g, " "),
    phone: guest.phone.trim().replace(/[\s-]/g, ""),
    email: guest.email.trim().toLowerCase(),
    specialRequests: guest.specialRequests.trim(),
  };
}

export function isValidBookingDateRange(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false;
  const checkInTime = new Date(checkIn).getTime();
  const checkOutTime = new Date(checkOut).getTime();
  if (!Number.isFinite(checkInTime) || !Number.isFinite(checkOutTime)) return false;
  return checkOutTime > checkInTime;
}

export function isValidFormTiming(formStartedAt?: number, nowMs = Date.now()): boolean {
  if (!formStartedAt || !Number.isFinite(formStartedAt)) return false;
  const elapsedMs = nowMs - formStartedAt;
  return elapsedMs >= MIN_BOOKING_FORM_TIME_MS && elapsedMs < 24 * 60 * 60 * 1000;
}

export function validateWebsiteBookingInput(
  input: WebsiteBookingValidationInput,
  guest: NormalizedGuestInfo,
  now = new Date()
): string | null {
  if (!input.hotelId || !input.roomTypeId || !isValidBookingDateRange(input.checkIn, input.checkOut)) {
    return "ข้อมูลการจองไม่ครบถ้วน";
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const checkInTime = new Date(input.checkIn).getTime();
  if (checkInTime < today.getTime()) {
    return "กรุณาเลือกวันที่เข้าพักให้ถูกต้อง";
  }

  if (calculateBookingNights(input.checkIn, input.checkOut) > MAX_BOOKING_NIGHTS) {
    return "ระยะเวลาการเข้าพักยาวเกินไป กรุณาติดต่อที่พักโดยตรง";
  }

  if (guest.fullName.length < 2 || guest.fullName.length > 100) {
    return "กรุณากรอกชื่อผู้เข้าพักให้ถูกต้อง";
  }

  if (!/^\+?\d{8,20}$/.test(guest.phone)) {
    return "กรุณากรอกเบอร์โทรให้ถูกต้อง";
  }

  if (guest.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    return "กรุณากรอกอีเมลให้ถูกต้อง";
  }

  if (guest.specialRequests.length > 1000) {
    return "รายละเอียดคำขอเพิ่มเติมยาวเกินไป";
  }

  if (!input.slipUrl.trim()) {
    return "กรุณาแนบหลักฐานการชำระเงิน";
  }

  return null;
}
