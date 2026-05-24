import { NextRequest, NextResponse } from "next/server";
import { LINE_AI_FALLBACK_REPLY, LINE_UNSUPPORTED_MESSAGE_REPLY } from "@/constants/line-ai";
import { generateLineConciergeReply } from "@/lib/ai/line-concierge";
import { resolveActiveHotelId } from "@/lib/ai/hotel-context";
import { getLineUserProfile, replyLineMessage } from "@/lib/line/client";
import {
  ensureLineConversation,
  getLineConversationMemory,
  getRecentLineMessages,
  recordLineHandoffEvent,
  recordLineMessage,
  updateLineConversationMemory,
} from "@/lib/line/logging";
import { notifyLineStaffHandoff } from "@/lib/line/staff-notifier";
import { verifyLineSignature } from "@/lib/line/signature";
import { createServiceClient } from "@/lib/supabase/service";
import type { LineMessageEvent, LineWebhookEvent, LineWebhookPayload } from "@/types/line-ai.types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim();

  if (!channelSecret) {
    console.error("LINE_CHANNEL_SECRET is not configured");
    return NextResponse.json({ error: "LINE is not configured" }, { status: 500 });
  }

  if (!verifyLineSignature(body, request.headers.get("x-line-signature"), channelSecret)) {
    return NextResponse.json({ error: "Invalid LINE signature" }, { status: 401 });
  }

  const payload = parseLineWebhookPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid LINE payload" }, { status: 400 });
  }

  if (process.env.LINE_BOT_ENABLED === "false") {
    return NextResponse.json({ ok: true, skipped: "disabled" });
  }

  await Promise.all(payload.events.map((event) => handleLineEvent(event)));
  return NextResponse.json({ ok: true });
}

async function handleLineEvent(event: LineWebhookEvent): Promise<void> {
  console.log("LINE webhook source:", JSON.stringify(event.source ?? null));
  if (!hasReplyToken(event)) return;

  if (isLineTextMessageEvent(event)) {
    await handleTextMessageEvent(event);
    return;
  }

  if (event.type === "follow") {
    await safeReply(event.replyToken, "สวัสดีครับ สอบถามข้อมูลห้องพัก ราคา หรือวันเข้าพักที่ต้องการได้เลยครับ");
    return;
  }

  await safeReply(event.replyToken, LINE_UNSUPPORTED_MESSAGE_REPLY);
}

async function handleTextMessageEvent(event: LineMessageEvent): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const lineUserId = event.source.userId ?? null;

  try {
    const hotelId = await resolveActiveHotelId();
    if (!hotelId) throw new Error("Active hotel not found");

    const supabase = await createServiceClient();
    const conversationId = await ensureLineConversation(supabase, hotelId, lineUserId);

    await recordLineMessage(supabase, {
      hotelId,
      lineUserId,
      conversationId,
      direction: "inbound",
      messageType: "text",
      lineMessageId: event.message.id,
      text: event.message.text || "",
    });

    const [memory, history] = await Promise.all([
      getLineConversationMemory(supabase, conversationId),
      getRecentLineMessages(supabase, conversationId),
    ]);
    const result = await generateLineConciergeReply(event.message.text || "", { memory, history });

    if (!accessToken) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    await replyLineMessage({
      accessToken,
      replyToken: event.replyToken,
      messages: [{ type: "text", text: result.reply }],
    });

    await recordLineMessage(supabase, {
      hotelId: result.hotelId,
      lineUserId,
      conversationId,
      direction: "outbound",
      messageType: "text",
      text: result.reply,
      ai: { provider: result.provider, model: result.model },
      metadata: { intent: result.intent },
    });
    await recordLineHandoffEvent(supabase, {
      hotelId: result.hotelId,
      lineUserId,
      conversationId,
      handoff: result.handoff,
      sourceMessage: event.message.text || "",
      metadata: { intent: result.intent },
    });
    console.log(
      "LINE staff handoff status:",
      JSON.stringify({
        required: Boolean(result.handoff?.required),
        reason: result.handoff?.reason ?? null,
        hasAccessToken: Boolean(accessToken),
        staffTarget: describeLineTarget(process.env.LINE_STAFF_NOTIFY_TARGET_ID),
        conversationId,
      })
    );
    const customerContact = await resolveLineCustomerContact(accessToken, lineUserId);
    await notifyLineStaffHandoff({
      accessToken,
      staffTargetId: process.env.LINE_STAFF_NOTIFY_TARGET_ID,
      handoff: result.handoff,
      sourceMessage: event.message.text || "",
      conversationId,
      lineUserId,
      customerContact,
    });
    await updateLineConversationMemory(supabase, conversationId, result.memory, result.intent);
  } catch (error) {
    console.error("LINE text event handling error:", error);
    await safeReply(event.replyToken, LINE_AI_FALLBACK_REPLY);
  }
}

async function safeReply(replyToken: string, text: string): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    return;
  }

  try {
    await replyLineMessage({
      accessToken,
      replyToken,
      messages: [{ type: "text", text }],
    });

    const hotelId = await resolveActiveHotelId();
    if (hotelId) {
      const supabase = await createServiceClient();
      await recordLineMessage(supabase, {
        hotelId,
        lineUserId: null,
        conversationId: null,
        direction: "outbound",
        messageType: "text",
        text,
      });
    }
  } catch (error) {
    console.error("LINE safe reply error:", error);
  }
}

function parseLineWebhookPayload(body: string): LineWebhookPayload | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== "object") return null;
    const events = (value as { events?: unknown }).events;
    if (!Array.isArray(events)) return null;
    return {
      destination: typeof (value as { destination?: unknown }).destination === "string" ? (value as { destination: string }).destination : undefined,
      events: events.filter((event): event is LineWebhookEvent => Boolean(event && typeof event === "object")) as LineWebhookEvent[],
    };
  } catch {
    return null;
  }
}

function hasReplyToken(event: LineWebhookEvent): event is LineWebhookEvent & { replyToken: string } {
  return typeof event.replyToken === "string" && event.replyToken.length > 0;
}

function isLineTextMessageEvent(event: LineWebhookEvent): event is LineMessageEvent {
  if (event.type !== "message") return false;
  const candidate = event as Partial<LineMessageEvent>;
  return (
    typeof candidate.replyToken === "string" &&
    candidate.message?.type === "text" &&
    typeof candidate.message.text === "string"
  );
}

function describeLineTarget(targetId: string | undefined): { configured: boolean; prefix: string | null; length: number } {
  const trimmed = targetId?.trim();
  return {
    configured: Boolean(trimmed),
    prefix: trimmed ? trimmed.slice(0, 1) : null,
    length: trimmed?.length ?? 0,
  };
}

async function resolveLineCustomerContact(accessToken: string, lineUserId: string | null) {
  const profile = lineUserId ? await safeGetLineUserProfile(accessToken, lineUserId) : null;

  return {
    displayName: profile?.displayName ?? null,
    chatLink: buildLineChatLink(),
  };
}

async function safeGetLineUserProfile(accessToken: string, lineUserId: string) {
  try {
    return await getLineUserProfile(accessToken, lineUserId);
  } catch (error) {
    console.error("LINE profile fetch error:", error);
    return null;
  }
}

function buildLineChatLink(): string | null {
  const rawId = process.env.LINE_OFFICIAL_ACCOUNT_ID ?? process.env.LINE_OA_ID ?? process.env.NEXT_PUBLIC_LINE_OA_ID;
  const lineId = rawId?.trim();
  if (!lineId) return null;

  const encodedLineId = encodeURIComponent(lineId).replaceAll("%40", "@");
  return `https://line.me/R/oaMessage/${encodedLineId}`;
}
