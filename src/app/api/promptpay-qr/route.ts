import { NextRequest, NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { getPromptPayConfig } from "@/services/mock-data";

export async function POST(request: NextRequest) {
  try {
    const config = getPromptPayConfig();
    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const payload = generatePayload(config.accountId, { amount: amount });
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: "#1a3c2a", light: "#ffffff" },
    });

    return NextResponse.json({
      qrDataUrl: qrDataUrl,
      accountName: config.accountName,
      accountId: config.accountId,
      amount: amount,
    });
  } catch (error) {
    console.error("PromptPay QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
