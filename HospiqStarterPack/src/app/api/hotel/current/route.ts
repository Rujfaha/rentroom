import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";
import { hotelService } from "@/server/services/hotel.service";
import { updateHotelSchema } from "@/server/validators/hotel.schema";

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
    const hotel = await hotelService.getCurrentHotel(hotelId);
    return NextResponse.json(apiOk(hotel));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const account = await getCurrentAccount();
    const requestedHotelId = request.nextUrl.searchParams.get("hotelId") ?? undefined;
    const hotelId = requireHotelAccess(account, requestedHotelId);
    const payload = updateHotelSchema.parse(await request.json());
    const hotel = await hotelService.updateHotel(hotelId, payload);
    return NextResponse.json(apiOk(hotel));
  } catch (error) {
    return jsonError(error);
  }
}
