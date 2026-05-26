import type { HospiqAiContext, StarterIntentEntityExtraction } from "./types";

const FAMILY_HINTS = ["family", "ครอบครัว"];
const COUPLE_HINTS = ["couple", "สองคน", "2 คน", "queen"];

export function normalizeExtractionRoomType(
  extraction: StarterIntentEntityExtraction,
  roomtypes: HospiqAiContext["roomtypes"],
): StarterIntentEntityExtraction {
  const requested = extraction.entities.roomTypeName;
  if (!requested || !roomtypes.length) return extraction;

  const matched = findMatchingRoomtype(requested, roomtypes);
  if (!matched || matched.name === requested) return extraction;

  return {
    ...extraction,
    entities: {
      ...extraction.entities,
      roomTypeName: matched.name,
    },
  };
}

function findMatchingRoomtype(
  requested: string,
  roomtypes: HospiqAiContext["roomtypes"],
) {
  const normalized = normalizeText(requested);
  const exact = roomtypes.find((roomtype) => normalizeText(roomtype.name) === normalized);
  if (exact) return exact;

  const contains = roomtypes.find((roomtype) => {
    const roomName = normalizeText(roomtype.name);
    return roomName.includes(normalized) || normalized.includes(roomName);
  });
  if (contains) return contains;

  if (FAMILY_HINTS.some((hint) => normalized.includes(normalizeText(hint)))) {
    return roomtypes
      .filter((roomtype) => roomtype.maxCapacity >= 3 || containsAny(roomtype, FAMILY_HINTS))
      .sort((a, b) => b.maxCapacity - a.maxCapacity || a.basePrice - b.basePrice)[0];
  }

  if (COUPLE_HINTS.some((hint) => normalized.includes(normalizeText(hint)))) {
    return roomtypes
      .filter((roomtype) => roomtype.standardCapacity <= 2 && roomtype.maxCapacity <= 2)
      .sort((a, b) => a.basePrice - b.basePrice)[0];
  }

  return null;
}

function containsAny(roomtype: HospiqAiContext["roomtypes"][number], hints: string[]) {
  const haystack = normalizeText([
    roomtype.name,
    roomtype.description,
    roomtype.moodDescription,
    roomtype.amenities.join(" "),
  ].filter(Boolean).join(" "));
  return hints.some((hint) => haystack.includes(normalizeText(hint)));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
