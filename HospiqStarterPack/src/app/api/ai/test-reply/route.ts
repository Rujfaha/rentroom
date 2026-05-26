import { NextRequest, NextResponse } from "next/server";
import { generateHospiqReply } from "@/lib/ai/orchestrator";
import { getCurrentAccount } from "@/server/auth/get-current-account";
import { requireHotelAccess } from "@/server/auth/require-hotel-access";
import { AppError } from "@/server/http/api-error";
import { apiError, apiOk } from "@/server/http/api-response";
import { testAiReplySchema } from "@/server/validators/ai.schema";

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
    const payload = testAiReplySchema.parse(await request.json());
    const result = await generateHospiqReply({
      hotelId,
      lineUserId: payload.lineUserId,
      lineSessionId: payload.lineSessionId,
      message: payload.message,
    });

    return NextResponse.json(apiOk(result));
  } catch (error) {
    return jsonError(error);
  }
}
