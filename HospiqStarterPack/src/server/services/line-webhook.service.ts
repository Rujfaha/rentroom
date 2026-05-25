import { generateHospiqReply } from "../../lib/ai/orchestrator";
import type { GenerateHospiqReplyResult, LineConversationMemory } from "../../lib/ai/types";
import { replyLineMessage } from "../../lib/line/client";
import { verifyLineSignature } from "../../lib/line/signature";
import { AppError } from "../http/api-error";
import { apiOk } from "../http/api-response";
import { lineRepository, type LineConfigRecord, type LineSessionRecord } from "../repositories/line.repository";

interface LineWebhookInput {
  hotelId: string;
  rawBody: string;
  signature: string | null;
}

interface LineWebhookPayload {
  events?: unknown[];
}

interface LineMessageEvent {
  type: string;
  replyToken?: string;
  source?: {
    userId?: string;
  };
  message?: {
    type?: string;
    text?: string;
  };
}

interface LineWebhookDependencies {
  getLineConfig(hotelId: string): Promise<LineConfigRecord | null>;
  verifySignature(body: string, signature: string | null, channelSecret: string): boolean;
  upsertLineSession(hotelId: string, lineUserId: string): Promise<LineSessionRecord>;
  insertIncoming(input: {
    hotelId: string;
    lineSessionId: string;
    lineUserId: string;
    messageType: string;
    messageText: string | null;
    rawPayload: Record<string, unknown>;
  }): Promise<void>;
  generateReply(input: { hotelId: string; lineUserId: string; lineSessionId: string; message: string }): Promise<GenerateHospiqReplyResult>;
  updateLineSession(input: {
    hotelId: string;
    lineSessionId: string;
    status: "open" | "handoff" | "closed";
    lastIntent: string;
    memory: Partial<LineConversationMemory>;
  }): Promise<void>;
  insertOutgoing(input: {
    hotelId: string;
    lineSessionId: string;
    lineUserId: string;
    messageText: string;
    result: GenerateHospiqReplyResult;
  }): Promise<void>;
  createHandoffEvent(input: {
    hotelId: string;
    lineSessionId: string;
    lineUserId: string;
    sourceMessage: string;
    result: GenerateHospiqReplyResult;
  }): Promise<void>;
  replyLine(input: { accessToken: string; replyToken: string; text: string }): Promise<void>;
}

export function createLineWebhookService(deps: LineWebhookDependencies) {
  return {
    async handleWebhook(input: LineWebhookInput) {
      const config = await deps.getLineConfig(input.hotelId);
      if (!config?.isConfigured || !config.channelSecret) {
        throw new AppError("LINE is not configured for this hotel", 400, "LINE_NOT_CONFIGURED");
      }

      if (!deps.verifySignature(input.rawBody, input.signature, config.channelSecret)) {
        throw new AppError("Invalid LINE signature", 401, "INVALID_LINE_SIGNATURE");
      }

      const payload = parseWebhookPayload(input.rawBody);
      const events = payload.events?.filter(isLineMessageEvent) ?? [];
      let handled = 0;
      let replied = 0;
      let handoffCreated = 0;

      for (const event of events) {
        if (event.type !== "message" || event.message?.type !== "text" || !event.message.text || !event.source?.userId) {
          continue;
        }

        handled += 1;
        const lineUserId = event.source.userId;
        const session = await deps.upsertLineSession(input.hotelId, lineUserId);

        await deps.insertIncoming({
          hotelId: input.hotelId,
          lineSessionId: session.id,
          lineUserId,
          messageType: event.message.type,
          messageText: event.message.text,
          rawPayload: event as unknown as Record<string, unknown>,
        });

        const result = await deps.generateReply({
          hotelId: input.hotelId,
          lineUserId,
          lineSessionId: session.id,
          message: event.message.text,
        });

        await deps.updateLineSession({
          hotelId: input.hotelId,
          lineSessionId: session.id,
          status: result.handoffRequired ? "handoff" : "open",
          lastIntent: result.intent,
          memory: result.memoryUpdate,
        });

        if (result.handoffRequired) {
          handoffCreated += 1;
          await deps.createHandoffEvent({
            hotelId: input.hotelId,
            lineSessionId: session.id,
            lineUserId,
            sourceMessage: event.message.text,
            result,
          });
        }

        await deps.insertOutgoing({
          hotelId: input.hotelId,
          lineSessionId: session.id,
          lineUserId,
          messageText: result.reply,
          result,
        });

        if (result.reply && event.replyToken && config.channelAccessToken) {
          replied += 1;
          await deps.replyLine({
            accessToken: config.channelAccessToken,
            replyToken: event.replyToken,
            text: result.reply,
          });
        }
      }

      return apiOk({
        hotelId: input.hotelId,
        received: true,
        handled,
        replied,
        handoffCreated,
      });
    },
  };
}

export const lineWebhookService = createLineWebhookService({
  getLineConfig: lineRepository.getLineConfig,
  verifySignature: verifyLineSignature,
  upsertLineSession: lineRepository.upsertLineSession,
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
      reason: input.result.intent,
      priority: input.result.handoffRequired ? "normal" : "normal",
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
  replyLine(input) {
    return replyLineMessage({
      accessToken: input.accessToken,
      replyToken: input.replyToken,
      messages: [{ type: "text", text: input.text }],
    });
  },
});

function parseWebhookPayload(rawBody: string): LineWebhookPayload {
  try {
    const parsed: unknown = JSON.parse(rawBody || "{\"events\":[]}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as LineWebhookPayload : { events: [] };
  } catch {
    throw new AppError("Invalid LINE webhook payload", 400, "INVALID_LINE_PAYLOAD");
  }
}

function isLineMessageEvent(event: unknown): event is LineMessageEvent {
  return Boolean(event && typeof event === "object" && !Array.isArray(event));
}
