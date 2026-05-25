import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/server/http/api-error";
import { apiError } from "@/server/http/api-response";
import { lineWebhookService } from "@/server/services/line-webhook.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  try {
    const { hotelId } = await context.params;
    const rawBody = await request.text();

    const result = await lineWebhookService.handleWebhook({
      hotelId,
      rawBody,
      signature: request.headers.get("x-line-signature"),
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof AppError ? error.status : 400;
    const code = error instanceof AppError ? error.code : "BAD_REQUEST";
    return NextResponse.json(apiError(error instanceof Error ? error.message : "Unknown error", code), { status });
  }
}
