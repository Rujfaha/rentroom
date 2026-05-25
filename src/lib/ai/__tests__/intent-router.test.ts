import { describe, expect, it, vi } from "vitest";
import {
  buildAvailabilityRequestFromEntities,
  buildIntentExtractionSystemPrompt,
  extractLineIntentEntities,
  mergeBookingLead,
  mergeBookingLeadFromEntities,
  parseIntentExtraction,
} from "../intent-router";
import type { LineConversationMemory } from "@/types/line-ai.types";
import type { AiProvider } from "../provider";

describe("extractLineIntentEntities", () => {
  it("uses the LLM provider to extract intent, entities, and language instead of regex rules", async () => {
    const generate = vi.fn(async () => ({
        provider: "gemini" as const,
        model: "extractor-test",
        text: JSON.stringify({
          language: "th",
          primaryIntent: "room_specific_detail",
          intents: ["room_specific_detail", "price"],
          entities: { roomTypeName: "Sunset Villa", guests: 2 },
          handoff: null,
        }),
      }));
    const provider: AiProvider = { generate };

    const result = await extractLineIntentEntities("Sunset Villa ราคาเท่าไหร่ 2 คน", provider);

    expect(generate).toHaveBeenCalledOnce();
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining("Return only valid JSON"),
    }));
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining("Do not infer hotel-specific room names"),
    }));
    expect(result.language).toBe("th");
    expect(result.intents).toEqual(["room_specific_detail", "price"]);
    expect(result.entities).toEqual({ roomTypeName: "Sunset Villa", guests: 2 });
  });

  it("parses handoff requests from LLM JSON", () => {
    const result = parseIntentExtraction(JSON.stringify({
      language: "th",
      primaryIntent: "handoff",
      intents: ["handoff"],
      entities: {},
      handoff: { required: true, reason: "payment_issue", priority: "high" },
    }));

    expect(result.handoff).toEqual({ required: true, reason: "payment_issue", priority: "high" });
  });

  it("falls back safely when the provider returns malformed JSON", () => {
    expect(parseIntentExtraction("not json")).toEqual({
      language: "th",
      primaryIntent: "general",
      intents: ["general"],
      entities: {},
      handoff: null,
    });
  });

  it("keeps extraction prompt SaaS-ready without hotel-specific room examples", () => {
    const prompt = buildIntentExtractionSystemPrompt();

    expect(prompt).toContain("multi-tenant SaaS hotel assistant");
    expect(prompt).not.toContain("Warmly House");
    expect(prompt).not.toContain("Honeymoon House");
    expect(prompt).not.toContain("Forest Hill");
  });
});

describe("entity helpers", () => {
  it("builds availability request from extracted entities", () => {
    expect(buildAvailabilityRequestFromEntities({ checkIn: "2026-06-01", checkOut: "2026-06-03", guests: 2 })).toEqual({
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
    });
  });

  it("merges LLM-extracted entities into booking memory", () => {
    const memory: LineConversationMemory = {
      bookingLead: { checkIn: "2026-06-01", source: { checkIn: "customer" } },
    };

    expect(mergeBookingLeadFromEntities(memory, { roomTypeName: "Sunset Villa", guests: 2 })).toEqual({
      bookingLead: {
        checkIn: "2026-06-01",
        roomTypeName: "Sunset Villa",
        guests: 2,
        source: { checkIn: "customer", roomId: "customer", guests: "customer" },
      },
    });
  });
});

describe("mergeBookingLead", () => {
  it("keeps previous booking lead values and fills new values", () => {
    const memory: LineConversationMemory = {
      bookingLead: { checkIn: "2026-06-01", checkOut: "2026-06-03" },
    };

    expect(mergeBookingLead(memory, { guests: 2 })).toEqual({
      bookingLead: { checkIn: "2026-06-01", checkOut: "2026-06-03", guests: 2 },
    });
  });
});
