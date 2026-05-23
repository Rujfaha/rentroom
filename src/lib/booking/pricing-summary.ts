import type { RoomTypeDisplay } from "@/types/landing.types";

interface BookingRoomSubtotalInput {
  roomBaseTotal: number;
  totalGuests: number;
  standardGuests: number;
  extraBedPrice: number;
  totalNights: number;
}

function money(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

export function calculateExtraBedCharge(input: Omit<BookingRoomSubtotalInput, "roomBaseTotal">): number {
  const extraGuests = Math.max(0, Math.floor(input.totalGuests) - Math.max(1, Math.floor(input.standardGuests)));
  const nights = Math.max(1, Math.floor(input.totalNights));
  return money(extraGuests * money(input.extraBedPrice) * nights);
}

export function calculateBookingRoomSubtotal(input: BookingRoomSubtotalInput): number {
  return money(
    money(input.roomBaseTotal) +
      calculateExtraBedCharge({
        totalGuests: input.totalGuests,
        standardGuests: input.standardGuests,
        extraBedPrice: input.extraBedPrice,
        totalNights: input.totalNights,
      })
  );
}

export function calculateBookingRoomTotal(
  room: RoomTypeDisplay,
  totalNights: number,
  totalGuests: number
): number {
  if (Number.isFinite(room.stayTotal) && room.stayTotal !== undefined) {
    return money(room.stayTotal);
  }

  return calculateBookingRoomSubtotal({
    roomBaseTotal: money(room.basePrice) * Math.max(1, Math.floor(totalNights)),
    totalGuests,
    standardGuests: room.maxGuests || 2,
    extraBedPrice: room.extraBedPrice || 0,
    totalNights,
  });
}

export function calculateBookingRoomsTotal(
  rooms: RoomTypeDisplay[],
  totalNights: number,
  totalGuests: number
): number {
  return money(
    rooms.reduce(function (sum, room) {
      return sum + calculateBookingRoomTotal(room, totalNights, totalGuests);
    }, 0)
  );
}
