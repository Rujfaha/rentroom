import { NextRequest, NextResponse } from "next/server";
import { lineWebhookService } from "@/server/services/line-webhook.service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ hotelId: string }> },
) {
  const { hotelId } = await context.params;
  const rawBody = await request.text();

  const result = await lineWebhookService.handleWebhook({
    hotelId,
    rawBody,
    signature: request.headers.get("x-line-signature"),
  });

  return NextResponse.json(result);
}
