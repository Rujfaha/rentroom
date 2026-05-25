import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";
import { bookingService } from "@/server/services/booking.service";
import { createBookingLeadSchema } from "@/server/validators/booking.schema";

function jsonError(error: unknown, fallbackStatus = 400) {
  const status = error instanceof AppError ? error.status : fallbackStatus;
  const code = error instanceof AppError ? error.code : "BAD_REQUEST";
  return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error", code), { status });
}

export async function GET(request: NextRequest) {
  try {
    const account = await getCurrentAccount();
    const requestedHotelId = request.nextUrl.searchParams.get("hotelId") ?? undefined;
    const hotelId = requireHotelAccess(account, requestedHotelId);
    const bookings = await bookingService.listBookings(hotelId);
    return NextResponse.json(apiOk(bookings));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = await getCurrentAccount();
    const requestedHotelId = request.nextUrl.searchParams.get("hotelId") ?? undefined;
    const hotelId = requireHotelAccess(account, requestedHotelId);
    const payload = createBookingLeadSchema.parse(await request.json());
    const booking = await bookingService.createBookingLead(hotelId, payload);
    return NextResponse.json(apiOk(booking), { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
