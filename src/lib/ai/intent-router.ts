import type {
  AiGenerateResult,
  AvailabilityRequest,
  LineConversationMemory,
  LineHandoffReason,
  LineHandoffRequest,
  LineIntent,
  LineIntentEntities,
  LineIntentEntityExtraction,
  SupportedLineLanguage,
} from "@/types/line-ai.types";
import type { AiProvider } from "./provider";
import { getAiProvider } from "./provider";

const SUPPORTED_LANGUAGES: SupportedLineLanguage[] = ["th", "zh", "en", "ja", "es", "ar"];

const SUPPORTED_INTENTS: LineIntent[] = [
  "availability",
  "availability_payment",
  "payment",
  "price",
  "promotion",
  "contact",
  "booking",
  "handoff",
  "general",
  "greeting",
  "room_overview",
  "room_specific_detail",
  "room_detail",
  "room_recommendation",
  "amenities_question",
  "availability_check",
  "price_inquiry",
  "cheapest_room",
  "group_booking",
  "booking_ready",
  "booking_intent",
  "sales_handoff",
  "handoff_required",
  "fallback",
];

const SUPPORTED_HANDOFF_REASONS: LineHandoffReason[] = [
  "admin_request",
  "payment_issue",
  "refund",
  "complaint",
  "cancellation",
  "special_approval",
  "group_booking",
  "booking_ready",
];

export async function extractLineIntentEntities(
  message: string,
  provider: AiProvider = getAiProvider()
): Promise<LineIntentEntityExtraction & { provider: AiGenerateResult["provider"]; model: string }> {
  const result = await provider.generate({
    system: buildIntentExtractionSystemPrompt(),
    prompt: buildIntentExtractionUserPrompt(message),
    maxOutputTokens: 500,
  });
  const parsed = parseIntentExtraction(result.text);

  return {
    ...parsed,
    provider: result.provider,
    model: result.model,
  };
}

export function parseIntentExtraction(text: string): LineIntentEntityExtraction {
  const value = parseJsonObject(text);
  const language = readLanguage(value);
  const intents = readIntents(value);
  const primaryIntent = readIntent((value as { primaryIntent?: unknown }).primaryIntent) ?? intents[0] ?? "general";
  const entities = readEntities((value as { entities?: unknown }).entities);
  const handoff = readHandoff((value as { handoff?: unknown }).handoff);

  return {
    language,
    primaryIntent,
    intents,
    entities,
    handoff,
  };
}

export function buildIntentExtractionSystemPrompt(): string {
  return [
    "You extract hotel chat intent and entities for a multi-tenant SaaS hotel assistant.",
    "Return only valid JSON. Do not include markdown, comments, or explanation.",
    "Do not infer hotel-specific room names, amenities, styles, policies, prices, or promotions unless the customer explicitly wrote them.",
    "Use ISO YYYY-MM-DD for explicit or relative dates when clear. If a date is unclear, omit it.",
    "Use the customer's language code when supported.",
    "Schema:",
    JSON.stringify({
      language: "th | en | zh | ja | es | ar",
      primaryIntent: "one LineIntent",
      intents: ["one or more LineIntent values"],
      entities: {
        roomTypeName: "customer-written room type name",
        checkIn: "YYYY-MM-DD",
        checkOut: "YYYY-MM-DD",
        guests: 2,
        guestName: "customer name",
        phone: "customer phone",
        roomPreference: ["customer preferences only"],
        dislikedFeatures: ["customer dislikes only"],
        isGroupBooking: false,
        leadScore: "low | medium | high",
      },
      handoff: {
        required: false,
        reason: "admin_request | payment_issue | refund | complaint | cancellation | special_approval | group_booking | booking_ready",
        priority: "normal | high",
      },
    }),
  ].join("\n");
}

function buildIntentExtractionUserPrompt(message: string): string {
  return `Customer message:\n${message}`;
}

export function buildAvailabilityRequestFromEntities(entities: LineIntentEntities): AvailabilityRequest | null {
  if (!entities.checkIn || !entities.checkOut) return null;
  return {
    checkIn: entities.checkIn,
    checkOut: entities.checkOut,
    ...(entities.guests ? { guests: entities.guests } : {}),
  };
}

export function mergeBookingLeadFromEntities(
  existing: LineConversationMemory,
  entities: LineIntentEntities
): LineConversationMemory {
  const prevLead = existing.bookingLead ?? {};
  const prevSource = prevLead.source ?? {};
  const nextLead = {
    ...prevLead,
    source: {
      ...prevSource,
    },
  };

  if (entities.roomTypeName) {
    nextLead.roomTypeName = entities.roomTypeName;
    nextLead.source.roomId = "customer";
  }
  if (entities.checkIn) {
    nextLead.checkIn = entities.checkIn;
    nextLead.source.checkIn = "customer";
  }
  if (entities.checkOut) {
    nextLead.checkOut = entities.checkOut;
    nextLead.source.checkOut = "customer";
  }
  if (entities.guests) {
    nextLead.guests = entities.guests;
    nextLead.source.guests = "customer";
  }
  if (entities.guestName) nextLead.guestName = entities.guestName;
  if (entities.phone) nextLead.phone = entities.phone;
  if (entities.roomPreference) nextLead.roomPreference = entities.roomPreference;
  if (entities.dislikedFeatures) nextLead.dislikedFeatures = entities.dislikedFeatures;
  if (entities.isGroupBooking) nextLead.isGroupBooking = true;
  if (entities.leadScore) nextLead.leadScore = entities.leadScore;

  return {
    ...existing,
    bookingLead: nextLead,
  };
}

export function mergeBookingLead(memory: LineConversationMemory, next: Partial<AvailabilityRequest>): LineConversationMemory {
  return {
    ...memory,
    bookingLead: {
      ...(memory.bookingLead ?? {}),
      ...next,
    },
  };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const jsonText = extractJsonObjectText(trimmed);
  try {
    const value: unknown = JSON.parse(jsonText);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  } catch {
    return {};
  }
}

function extractJsonObjectText(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return text;
  return text.slice(first, last + 1);
}

function readLanguage(value: Record<string, unknown>): SupportedLineLanguage {
  const language = value.language;
  return typeof language === "string" && isSupportedLanguage(language) ? language : "th";
}

function readIntents(value: Record<string, unknown>): LineIntent[] {
  const raw = value.intents;
  if (!Array.isArray(raw)) return ["general"];
  const intents = raw.map(readIntent).filter((intent): intent is LineIntent => Boolean(intent));
  const unique = Array.from(new Set(intents));
  return unique.length ? unique : ["general"];
}

function readIntent(value: unknown): LineIntent | null {
  if (typeof value !== "string") return null;
  return isSupportedIntent(value) ? value : null;
}

function readEntities(value: unknown): LineIntentEntities {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const entities: LineIntentEntities = {};

  if (typeof source.roomTypeName === "string" && source.roomTypeName.trim()) entities.roomTypeName = source.roomTypeName.trim();
  if (typeof source.checkIn === "string" && source.checkIn.trim()) entities.checkIn = source.checkIn.trim();
  if (typeof source.checkOut === "string" && source.checkOut.trim()) entities.checkOut = source.checkOut.trim();
  if (typeof source.guests === "number" && Number.isInteger(source.guests) && source.guests > 0) entities.guests = source.guests;
  if (typeof source.guestName === "string" && source.guestName.trim()) entities.guestName = source.guestName.trim();
  if (typeof source.phone === "string" && source.phone.trim()) entities.phone = source.phone.trim();
  if (Array.isArray(source.roomPreference)) entities.roomPreference = source.roomPreference.filter(isString);
  if (Array.isArray(source.dislikedFeatures)) entities.dislikedFeatures = source.dislikedFeatures.filter(isString);
  if (source.isGroupBooking === true) entities.isGroupBooking = true;
  if (source.leadScore === "low" || source.leadScore === "medium" || source.leadScore === "high") entities.leadScore = source.leadScore;

  return entities;
}

function readHandoff(value: unknown): LineHandoffRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.required !== true) return null;
  const reason = typeof source.reason === "string" && isSupportedHandoffReason(source.reason) ? source.reason : "admin_request";
  const priority = source.priority === "high" ? "high" : "normal";
  return { required: true, reason, priority };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSupportedLanguage(value: string): value is SupportedLineLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLineLanguage);
}

function isSupportedIntent(value: string): value is LineIntent {
  return SUPPORTED_INTENTS.includes(value as LineIntent);
}

function isSupportedHandoffReason(value: string): value is LineHandoffReason {
  return SUPPORTED_HANDOFF_REASONS.includes(value as LineHandoffReason);
}
