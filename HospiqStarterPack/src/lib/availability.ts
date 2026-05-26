export interface AvailabilityRoomtypeInput {
  id: string;
  totalRooms: number;
  activeRooms: number;
}

export interface AvailabilityBookingInput {
  roomtypeId: string | null;
  checkinDate: string | null;
  checkoutDate: string | null;
  roomCount: number | null;
  status: string;
}

const BLOCKING_BOOKING_STATUSES = new Set(["pending", "confirmed"]);

export function calculateAvailableRoomsByRoomtype(input: {
  roomtypes: AvailabilityRoomtypeInput[];
  bookings: AvailabilityBookingInput[];
  checkinDate?: string | null;
  checkoutDate?: string | null;
}): Map<string, number> {
  const availability = new Map(
    input.roomtypes.map((roomtype) => [
      roomtype.id,
      Math.max(0, roomtype.activeRooms || roomtype.totalRooms),
    ]),
  );

  if (!input.checkinDate || !input.checkoutDate) return availability;

  for (const booking of input.bookings) {
    if (!booking.roomtypeId || !BLOCKING_BOOKING_STATUSES.has(booking.status)) continue;
    if (!datesOverlap(input.checkinDate, input.checkoutDate, booking.checkinDate, booking.checkoutDate)) continue;

    const current = availability.get(booking.roomtypeId);
    if (current === undefined) continue;
    availability.set(booking.roomtypeId, Math.max(0, current - Math.max(1, booking.roomCount ?? 1)));
  }

  return availability;
}

export function datesOverlap(
  checkinDate: string,
  checkoutDate: string,
  bookingCheckinDate: string | null,
  bookingCheckoutDate: string | null,
) {
  if (!bookingCheckinDate || !bookingCheckoutDate) return false;
  return bookingCheckinDate < checkoutDate && bookingCheckoutDate > checkinDate;
}
