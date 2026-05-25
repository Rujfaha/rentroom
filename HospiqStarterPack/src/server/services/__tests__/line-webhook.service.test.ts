import { describe, expect, it } from "vitest";
import { createLineWebhookService } from "../line-webhook.service";
import type { GenerateHospiqReplyResult } from "../../../lib/ai/types";

function createAiResult(overrides: Partial<GenerateHospiqReplyResult> = {}): GenerateHospiqReplyResult {
  return {
    reply: "Model reply",
    intent: "booking_intent",
    aiResponseSource: "model",
    aiProvider: "test",
    aiModel: "fake",
    prompt: {
      identity: {
        brandName: "Hospiq",
        hotelName: "Demo",
        role: "hotel_saas_assistant",
      },
      brandRules: [],
      aiKnowledge: {},
      hotelData: {
        hasWebbooking: false,
        webbookingUrl: null,
        roomtypes: [],
      },
      retrievedFaqs: [],
      policies: {
        supportedLanguages: ["en"],
        bookingCtaPolicy: {},
        handoffPolicy: {},
        fallbackPolicy: {},
        maxReplyLength: 700,
      },
      memory: {
        bookingLead: {},
      },
      userMessage: "hello",
      intent: "booking_intent",
    },
    handoffRequired: false,
    memoryUpdate: {
      bookingLead: { guests: 2 },
    },
    language: "en",
    entities: { guests: 2 },
    ...overrides,
  };
}

describe("lineWebhookService", () => {
  it("persists incoming/outgoing chat, updates session, and replies", async () => {
    const calls: string[] = [];
    const service = createLineWebhookService({
      async getLineConfig() {
        calls.push("config");
        return {
          channelSecret: "secret",
          channelAccessToken: "token",
          isConfigured: true,
        };
      },
      verifySignature() {
        calls.push("verify");
        return true;
      },
      async upsertLineSession() {
        calls.push("session");
        return { id: "session-1", memory: { bookingLead: {} } };
      },
      async insertIncoming() {
        calls.push("incoming");
      },
      async generateReply() {
        calls.push("ai");
        return createAiResult();
      },
      async updateLineSession(input) {
        calls.push(`session:${input.status}:${input.lastIntent}`);
      },
      async insertOutgoing(input) {
        calls.push(`outgoing:${input.result.aiProvider}:${input.result.aiModel}`);
      },
      async createHandoffEvent() {
        calls.push("handoff");
      },
      async replyLine(input) {
        calls.push(`reply:${input.text}`);
      },
    });

    const result = await service.handleWebhook({
      hotelId: "hotel-1",
      signature: "signature",
      rawBody: JSON.stringify({
        events: [
          {
            type: "message",
            replyToken: "reply-token",
            source: { userId: "line-user-1" },
            message: { type: "text", text: "hello" },
          },
        ],
      }),
    });

    expect(result.data).toMatchObject({
      handled: 1,
      replied: 1,
      handoffCreated: 0,
    });
    expect(calls).toContain("incoming");
    expect(calls).toContain("session:open:booking_intent");
    expect(calls).toContain("outgoing:test:fake");
    expect(calls).toContain("reply:Model reply");
  });

  it("creates handoff event and skips LINE reply when guard blocks response", async () => {
    const calls: string[] = [];
    const service = createLineWebhookService({
      async getLineConfig() {
        return {
          channelSecret: "secret",
          channelAccessToken: "token",
          isConfigured: true,
        };
      },
      verifySignature: () => true,
      async upsertLineSession() {
        return { id: "session-1", memory: { bookingLead: {} } };
      },
      async insertIncoming() {},
      async generateReply() {
        return createAiResult({ reply: "", handoffRequired: true, intent: "handoff_required" });
      },
      async updateLineSession(input) {
        calls.push(`session:${input.status}`);
      },
      async insertOutgoing() {
        calls.push("outgoing");
      },
      async createHandoffEvent() {
        calls.push("handoff");
      },
      async replyLine() {
        calls.push("reply");
      },
    });

    const result = await service.handleWebhook({
      hotelId: "hotel-1",
      signature: "signature",
      rawBody: JSON.stringify({
        events: [
          {
            type: "message",
            replyToken: "reply-token",
            source: { userId: "line-user-1" },
            message: { type: "text", text: "human please" },
          },
        ],
      }),
    });

    expect(result.data.handoffCreated).toBe(1);
    expect(calls).toEqual(["session:handoff", "handoff", "outgoing"]);
  });

  it("rejects invalid signatures", async () => {
    const service = createLineWebhookService({
      async getLineConfig() {
        return {
          channelSecret: "secret",
          channelAccessToken: "token",
          isConfigured: true,
        };
      },
      verifySignature: () => false,
      async upsertLineSession() {
        throw new Error("should not run");
      },
      async insertIncoming() {},
      async generateReply() {
        throw new Error("should not run");
      },
      async updateLineSession() {},
      async insertOutgoing() {},
      async createHandoffEvent() {},
      async replyLine() {},
    });

    await expect(
      service.handleWebhook({
        hotelId: "hotel-1",
        signature: "bad",
        rawBody: "{\"events\":[]}",
      }),
    ).rejects.toMatchObject({ code: "INVALID_LINE_SIGNATURE" });
  });
});
