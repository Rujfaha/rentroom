import { NextRequest, NextResponse } from "next/server";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";
import { onboardingService } from "@/server/services/onboarding.service";
import { onboardingSchema } from "@/server/validators/onboarding.schema";

function jsonError(error: unknown, fallbackStatus = 400) {
  const status = error instanceof AppError ? error.status : fallbackStatus;
  const code = error instanceof AppError ? error.code : "BAD_REQUEST";
  return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error", code), { status });
}

export async function POST(request: NextRequest) {
  try {
    const account = await getCurrentAccount();
    const requestedHotelId = request.nextUrl.searchParams.get("hotelId") ?? undefined;
    const hotelId = requireHotelAccess(account, requestedHotelId);
    const payload = onboardingSchema.parse(await request.json());
    const result = await onboardingService.completeOnboarding(hotelId, payload);

    return NextResponse.json(apiOk(result));
  } catch (error) {
    return jsonError(error);
  }
}
