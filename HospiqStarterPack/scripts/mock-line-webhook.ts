import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { generateHospiqReply } from "../src/lib/ai/orchestrator";
import { verifyLineSignature } from "../src/lib/line/signature";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { lineRepository } from "../src/server/repositories/line.repository";
import { createLineWebhookService } from "../src/server/services/line-webhook.service";
import { bookingService } from "../src/server/services/booking.service";

loadEnv(".env.local");

const hotelId = process.argv[2] ?? "12af7b54-d63d-4525-9c7a-429726241f49";
const lineUserId = process.env.MOCK_LINE_USER_ID || "mock-line-user-001";
const message = process.argv.slice(3).join(" ") || "รถยนต์จอดได้ไหม และถ้าพักสองคนแนะนำห้องไหน";
const channelSecret = "mock-line-secret";
const capturedReplies: string[] = [];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  await ensureMockLineConfig();

  const rawBody = JSON.stringify({
    events: [
      {
        type: "message",
        replyToken: "mock-reply-token",
        source: { userId: lineUserId },
        message: { type: "text", text: message },
      },
    ],
  });
  const signature = createHmac("sha256", channelSecret).update(rawBody).digest("base64");

  const service = createLineWebhookService({
    getLineConfig: lineRepository.getLineConfig,
    getAdminVerifyCode: lineRepository.getAdminVerifyCode,
    verifySignature: verifyLineSignature,
    upsertLineSession: lineRepository.upsertLineSession,
    markSessionAdminVerified: lineRepository.markSessionAdminVerified,
    insertIncoming(input) {
      return lineRepository.insertChatHistory({
        hotelId: input.hotelId,
        lineSessionId: input.lineSessionId,
        lineUserId: input.lineUserId,
        direction: "incoming",
        messageType: input.messageType,
        messageText: input.messageText,
        rawPayload: input.rawPayload,
      });
    },
    generateReply: generateHospiqReply,
    updateLineSession: lineRepository.updateLineSession,
    insertOutgoing(input) {
      return lineRepository.insertChatHistory({
        hotelId: input.hotelId,
        lineSessionId: input.lineSessionId,
        lineUserId: input.lineUserId,
        direction: "outgoing",
        messageType: "text",
        messageText: input.messageText,
        intent: input.result.intent,
        aiResponseSource: input.result.aiResponseSource,
        aiProvider: input.result.aiProvider,
        aiModel: input.result.aiModel,
        rawPayload: {
          handoffRequired: input.result.handoffRequired,
          language: input.result.language,
          entities: input.result.entities,
        },
      });
    },
    createHandoffEvent(input) {
      return lineRepository.createHandoffEvent({
        hotelId: input.hotelId,
        lineSessionId: input.lineSessionId,
        lineUserId: input.lineUserId,
        reason: input.result.handoffReason ?? input.result.intent,
        priority: input.result.handoffPriority ?? "normal",
        sourceMessage: input.sourceMessage,
        metadata: {
          intent: input.result.intent,
          language: input.result.language,
          entities: input.result.entities,
          aiProvider: input.result.aiProvider,
          aiModel: input.result.aiModel,
        },
      });
    },
    async upsertBookingLead(input) {
      const entities = input.result.entities;
      const hasLeadData = Boolean(
        entities.checkIn ||
          entities.checkOut ||
          entities.guests ||
          entities.guestName ||
          entities.phone ||
          entities.roomTypeName,
      );

      if (!hasLeadData) return;

      await bookingService.upsertLineAiBookingLead(input.hotelId, {
        lineSessionId: input.lineSessionId,
        lineUserId: input.lineUserId,
        guestName: entities.guestName,
        guestPhone: entities.phone,
        checkinDate: entities.checkIn,
        checkoutDate: entities.checkOut,
        guestCount: entities.guests,
        conversationSummary: input.result.reply || undefined,
        aiSummary: JSON.stringify({
          intent: input.result.intent,
          language: input.result.language,
          roomTypeName: entities.roomTypeName,
          leadScore: entities.leadScore,
        }),
      });
    },
    async replyLine(input) {
      capturedReplies.push(input.text);
    },
  });

  const webhookResult = await service.handleWebhook({ hotelId, rawBody, signature });
  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from("line_sessions")
    .select("id, status, last_intent, memory, updated_at")
    .eq("hotel_id", hotelId)
    .eq("line_user_id", lineUserId)
    .single();
  const { data: history } = await supabase
    .from("line_chat_history")
    .select("direction, message_text, intent, ai_provider, ai_model, created_at")
    .eq("hotel_id", hotelId)
    .eq("line_user_id", lineUserId)
    .order("created_at", { ascending: false })
    .limit(2);
  const { count: handoffCount } = await supabase
    .from("line_handoff_events")
    .select("id", { count: "exact", head: true })
    .eq("hotel_id", hotelId)
    .eq("line_user_id", lineUserId);

  console.log(JSON.stringify({
    user: message,
    ai: capturedReplies[0] ?? history?.find((row) => row.direction === "outgoing")?.message_text ?? null,
    webhookResult,
    session,
    recentHistory: history?.reverse(),
    handoffCount,
  }, null, 2));
}

async function ensureMockLineConfig() {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("line_configs")
    .upsert({
      hotel_id: hotelId,
      channel_id: "mock-channel",
      channel_secret: channelSecret,
      channel_access_token: "mock-access-token",
      webhook_url: "local-mock",
      is_configured: true,
    }, { onConflict: "hotel_id" });

  if (error) throw new Error(error.message);
}

function loadEnv(path: string) {
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
