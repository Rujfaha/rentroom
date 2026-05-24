import type { AvailabilityRequest } from "@/types/line-ai.types";

const ISO_DATE_PATTERN = /\b(20\d{2}-\d{2}-\d{2})\b/g;
const THAI_MONTHS: Record<string, number> = {
  "ม.ค.": 0,
  มกราคม: 0,
  "ก.พ.": 1,
  กุมภาพันธ์: 1,
  "มี.ค.": 2,
  มีนาคม: 2,
  "เม.ย.": 3,
  เมษายน: 3,
  "พ.ค.": 4,
  พฤษภาคม: 4,
  "มิ.ย.": 5,
  มิถุนายน: 5,
  "ก.ค.": 6,
  กรกฎาคม: 6,
  "ส.ค.": 7,
  สิงหาคม: 7,
  "ก.ย.": 8,
  กันยายน: 8,
  "ต.ค.": 9,
  ตุลาคม: 9,
  "พ.ย.": 10,
  พฤศจิกายน: 10,
  "ธ.ค.": 11,
  ธันวาคม: 11,
};

const WEEKDAY_INDEX: Record<string, number> = {
  อาทิตย์: 0,
  จันทร์: 1,
  อังคาร: 2,
  พุธ: 3,
  พฤหัส: 4,
  ศุกร์: 5,
  เสาร์: 6,
};

export function parseThaiDateRange(message: string, baseDate = new Date()): AvailabilityRequest | null {
  const isoDates = Array.from(message.matchAll(ISO_DATE_PATTERN), (match) => match[1]).filter(Boolean);
  const guests = extractGuests(message);
  if (isoDates.length >= 2 && isoDates[0] && isoDates[1]) {
    return withGuests({ checkIn: isoDates[0], checkOut: isoDates[1] }, guests);
  }

  const thaiRange = parseThaiMonthRange(message, baseDate);
  if (thaiRange) return withGuests(thaiRange, guests);

  const relative = parseRelativeDate(message, baseDate);
  if (relative) return withGuests(relative, guests);

  return null;
}

function parseThaiMonthRange(message: string, baseDate: Date): Omit<AvailabilityRequest, "guests"> | null {
  const monthNames = Object.keys(THAI_MONTHS).join("|");
  const rangePattern = new RegExp(`(?:วันที่\\s*)?(\\d{1,2})\\s*(?:-|ถึง|–)\\s*(\\d{1,2})\\s*(${monthNames})`);
  const match = message.match(rangePattern);
  if (!match?.[1] || !match[2] || !match[3]) return null;

  const month = THAI_MONTHS[match[3]];
  if (month === undefined) return null;

  const startDay = Number(match[1]);
  const endDay = Number(match[2]);
  if (!isValidDay(startDay) || !isValidDay(endDay)) return null;

  const year = resolveYear(baseDate, month, startDay);
  return {
    checkIn: formatIsoDate(new Date(year, month, startDay)),
    checkOut: formatIsoDate(new Date(year, month, endDay)),
  };
}

function parseRelativeDate(message: string, baseDate: Date): Omit<AvailabilityRequest, "guests"> | null {
  if (message.includes("มะรืน")) return oneNight(addDays(baseDate, 2));
  if (message.includes("พรุ่งนี้")) return oneNight(addDays(baseDate, 1));
  if (message.includes("วันนี้")) return oneNight(baseDate);

  for (const [keyword, dayIndex] of Object.entries(WEEKDAY_INDEX)) {
    if (message.includes(`${keyword}นี้`) || message.includes(`วัน${keyword}`)) {
      return oneNight(nextWeekday(baseDate, dayIndex));
    }
  }

  return null;
}

function oneNight(checkInDate: Date): Omit<AvailabilityRequest, "guests"> {
  return {
    checkIn: formatIsoDate(checkInDate),
    checkOut: formatIsoDate(addDays(checkInDate, 1)),
  };
}

function extractGuests(message: string): number | undefined {
  const match = message.match(/(\d{1,2})\s*(?:คน|ท่าน)/);
  const guests = match?.[1] ? Number(match[1]) : undefined;
  return guests && guests > 0 ? guests : undefined;
}

function withGuests(request: Omit<AvailabilityRequest, "guests">, guests: number | undefined): AvailabilityRequest {
  return guests ? { ...request, guests } : request;
}

function resolveYear(baseDate: Date, month: number, day: number): number {
  const candidate = new Date(baseDate.getFullYear(), month, day);
  return candidate < startOfDay(baseDate) ? baseDate.getFullYear() + 1 : baseDate.getFullYear();
}

function nextWeekday(baseDate: Date, weekday: number): Date {
  const base = startOfDay(baseDate);
  const diff = (weekday - base.getDay() + 7) % 7 || 7;
  return addDays(base, diff);
}

function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDay(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}
