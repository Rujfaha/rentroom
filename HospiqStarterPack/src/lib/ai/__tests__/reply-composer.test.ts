import { describe, expect, it } from "vitest";
import { createEmptyMemory } from "../hotel-context";
import { buildStarterPromptPayload } from "../prompt-builder";
import { buildGroundedReplyPrompt, createModelBackedReplyComposer } from "../reply-composer";
import type { AiProvider } from "../provider";
import type { HospiqAiContext } from "../types";

const context: HospiqAiContext = {
  hotelId: "hotel-1",
  hotelName: "Demo Hotel",
  hasWebbooking: true,
  webbookingUrl: "https://example.com/book",
  roomtypes: [
    {
      id: "roomtype-1",
      name: "Standard",
      description: "Simple room",
      moodDescription: "Quiet",
      basePrice: 900,
      availableRooms: 2,
      totalRooms: 5,
      amenities: ["wifi"],
    },
  ],
  faqs: [
    {
      id: "faq-1",
      question: "parking",
      answer: "yes",
      category: "facility",
      language: "en",
      keywords: ["parking"],
    },
  ],
  aiSetting: {
    assistantName: "Nara",
    assistantGenderTone: "female_polite",
    supportedLanguages: ["th", "en"],
    bookingCtaPolicy: { enabled: true },
    handoffPolicy: {},
    fallbackPolicy: {},
    maxReplyLength: 600,
    fallbackToAdminEnabled: true,
    adminContactMessage: null,
  },
  memory: createEmptyMemory(),
};

describe("reply composer", () => {
  it("passes grounded Starter Pack context to the provider", async () => {
    const payload = buildStarterPromptPayload(context, "Do you have parking?", "general");
    const calls: Array<{ system: string; prompt: string; maxOutputTokens?: number }> = [];
    const provider: AiProvider = {
      async generate(input) {
        calls.push(input);
        return { provider: "test", model: "fake-model", text: "Yes, parking is available." };
      },
    };

    const draft = await createModelBackedReplyComposer(provider).compose(payload);

    expect(draft.reply).toBe("Yes, parking is available.");
    expect(draft.provider).toBe("test");
    expect(draft.model).toBe("fake-model");
    expect(calls[0]?.prompt).toContain("Demo Hotel");
    expect(calls[0]?.prompt).toContain("Do you have parking?");
    expect(calls[0]?.system).toContain("Never answer with facts from another hotel");
  });

  it("builds a prompt that includes isolation and missing-fact rules", () => {
    const payload = buildStarterPromptPayload(context, "How much?", "room_inquiry");
    const prompt = buildGroundedReplyPrompt(payload);

    expect(prompt).toContain("Do not use data from any other hotel");
    expect(prompt).toContain("If a requested fact is missing, do not guess");
    expect(prompt).toContain("Standard");
  });
});
