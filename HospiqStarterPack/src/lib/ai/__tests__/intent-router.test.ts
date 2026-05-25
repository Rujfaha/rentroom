import { describe, expect, it } from "vitest";
import { createEmptyMemory } from "../hotel-context";
import { mergeBookingLeadFromEntities, parseIntentExtraction } from "../intent-router";

describe("intent-router", () => {
  it("parses model JSON into intent, language, entities, and handoff", () => {
    const extraction = parseIntentExtraction(`
      text before
      {
        "language": "en",
        "primaryIntent": "booking_ready",
        "intents": ["booking_ready", "availability_check"],
        "entities": {
          "roomTypeName": "Standard",
          "checkIn": "2026-06-01",
          "checkOut": "2026-06-03",
          "guests": 2,
          "leadScore": "high"
        },
        "handoff": {
          "required": true,
          "reason": "booking_ready",
          "priority": "high"
        }
      }
    `);

    expect(extraction.language).toBe("en");
    expect(extraction.primaryIntent).toBe("booking_ready");
    expect(extraction.entities.roomTypeName).toBe("Standard");
    expect(extraction.entities.guests).toBe(2);
    expect(extraction.handoff?.priority).toBe("high");
  });

  it("merges extracted booking entities into conversation memory", () => {
    const memory = mergeBookingLeadFromEntities(createEmptyMemory(), {
      language: "en",
      entities: {
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        guests: 2,
        guestName: "Mina",
      },
      handoff: null,
    });

    expect(memory.language).toBe("en");
    expect(memory.bookingLead.checkIn).toBe("2026-06-01");
    expect(memory.bookingLead.guestName).toBe("Mina");
  });
});
