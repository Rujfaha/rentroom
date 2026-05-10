import { NextRequest, NextResponse } from "next/server";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { createServiceClient } from "@/lib/supabase/service";

interface PromptPaySettings {
  accountId?: string;
  accountName?: string;
  type?: "phone" | "national_id";
}

interface HotelSettingsRow {
  settings: {
    promptpay?: PromptPaySettings;
  } | null;
}

async function getPromptPayConfig(hotelId?: string): Promise<PromptPaySettings | null> {
  const supabase = await createServiceClient();
  let query = supabase
    .from("hotels")
    .select("settings")
    .eq("is_active", true)
    .limit(1);

  if (hotelId) {
    query = query.eq("id", hotelId);
  }

  const { data, error } = await query.single();
  const hotel = data as HotelSettingsRow | null;

  if (error || !hotel) {
    console.error("PromptPay settings fetch error:", error);
    return null;
  }

  const settings = hotel.settings || {};
  return settings.promptpay || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = Number(body.amount);
    const config = await getPromptPayConfig(typeof body.hotelId === "string" ? body.hotelId : undefined);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!config?.accountId || !config.accountName) {
      return NextResponse.json(
        { error: "PromptPay account is not configured" },
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
