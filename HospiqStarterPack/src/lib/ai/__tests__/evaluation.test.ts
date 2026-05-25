import { describe, expect, it } from "vitest";
import { evaluateAiResult } from "../evaluation";
import type { GenerateHospiqReplyResult } from "../types";

const baseResult: GenerateHospiqReplyResult = {
  reply: "Parking is available.",
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
    memory: {
      bookingLead: {},
    },
    userMessage: "parking?",
    intent: "general",
  },
  handoffRequired: false,
  memoryUpdate: {},
  language: "en",
  entities: {},
};

describe("evaluateAiResult", () => {
  it("checks intent and include/exclude phrases", () => {
    expect(
      evaluateAiResult(baseResult, {
        expectedIntent: "general",
        mustInclude: ["parking"],
        mustNotInclude: ["other hotel"],
      }),
    ).toEqual({ passed: true, failures: [] });
  });

  it("reports failures", () => {
    const result = evaluateAiResult(baseResult, {
      expectedIntent: "booking_intent",
      mustInclude: ["pool"],
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("intent_mismatch");
    expect(result.failures).toContain("missing:pool");
  });
});
