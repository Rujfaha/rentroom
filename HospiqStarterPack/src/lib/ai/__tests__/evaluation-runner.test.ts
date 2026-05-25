import { describe, expect, it } from "vitest";
import { evaluateAiResult } from "../evaluation";
import type { GenerateHospiqReplyResult } from "../types";

function createResult(reply: string): GenerateHospiqReplyResult {
  return {
    reply,
    intent: "general",
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
        maxReplyLength: 100,
      },
      memory: { bookingLead: {} },
      userMessage: "hello",
      intent: "general",
    },
    handoffRequired: false,
    handoffReason: null,
    handoffPriority: null,
    memoryUpdate: {},
    language: "en",
    entities: {},
  };
}

describe("AI evaluation runner helpers", () => {
  it("can evaluate golden reply fragments", () => {
    expect(evaluateAiResult(createResult("Parking is available."), { mustInclude: ["parking"] })).toEqual({
      passed: true,
      failures: [],
    });
  });
});
