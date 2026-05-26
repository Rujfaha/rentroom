import { describe, expect, it } from "vitest";
import { normalizeExtractionRoomType } from "../roomtype-normalizer";
import type { HospiqAiContext, StarterIntentEntityExtraction } from "../types";

const roomtypes: HospiqAiContext["roomtypes"] = [
  {
    id: "standard",
    name: "Standard Queen",
    description: "Room for one or two guests",
    moodDescription: "Simple",
    basePrice: 1200,
    standardCapacity: 2,
    maxCapacity: 2,
    availableRooms: 2,
    totalRooms: 2,
    priceNote: "Starting price",
    amenities: [],
  },
  {
    id: "family",
    name: "Family Twin",
    description: "Room for family or three to four guests",
    moodDescription: "Spacious",
    basePrice: 1900,
    standardCapacity: 3,
    maxCapacity: 4,
    availableRooms: 1,
    totalRooms: 2,
    priceNote: "Starting price",
    amenities: [],
  },
];

const baseExtraction: StarterIntentEntityExtraction = {
  language: "th",
  primaryIntent: "room_recommendation",
  intents: ["room_recommendation"],
  entities: {},
  handoff: null,
};

describe("roomtype normalizer", () => {
  it("maps a generic family room mention to the best matching DB roomtype", () => {
    const result = normalizeExtractionRoomType(
      {
        ...baseExtraction,
        entities: { roomTypeName: "ห้องครอบครัว" },
      },
      roomtypes,
    );

    expect(result.entities.roomTypeName).toBe("Family Twin");
  });

  it("keeps an exact DB roomtype name unchanged", () => {
    const result = normalizeExtractionRoomType(
      {
        ...baseExtraction,
        entities: { roomTypeName: "Standard Queen" },
      },
      roomtypes,
    );

    expect(result.entities.roomTypeName).toBe("Standard Queen");
  });
});
