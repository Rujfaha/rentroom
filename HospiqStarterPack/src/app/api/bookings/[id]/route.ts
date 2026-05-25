import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";
import { bookingService } from "@/server/services/booking.service";
import { updateBookingLeadSchema } from "@/server/validators/booking.schema";

function jsonError(error: unknown, fallbackStatus = 400) {
  const status = error instanceof AppError ? error.status : fallbackStatus;
  const code = error instanceof AppError ? error.code : "BAD_REQUEST";
  return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error", code), { status });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const account = await getCurrentAccount();
    const requestedHotelId = request.nextUrl.searchParams.get("hotelId") ?? undefined;
    const hotelId = requireHotelAccess(account, requestedHotelId);
    const { id } = await context.params;
    const payload = updateBookingLeadSchema.parse(await request.json());
    const booking = await bookingService.updateBookingLead(hotelId, id, payload);

    return NextResponse.json(apiOk(booking));
  } catch (error) {
    return jsonError(error);
  }
}
