import type { AiProvider } from "./provider";
import { getAiProvider } from "./provider";
import type {
  LineConversationMemory,
  StarterAiIntent,
  StarterHandoffRequest,
  StarterIntentEntities,
  StarterIntentEntityExtraction,
} from "./types";

const SUPPORTED_LANGUAGES = ["th", "zh", "en", "ja", "es", "ar"];

const SUPPORTED_INTENTS: StarterAiIntent[] = [
  "empty",
  "room_inquiry",
  "room_overview",
  "room_detail",
  "room_recommendation",
  "availability",
  "availability_check",
  "price_inquiry",
  "cheapest_room",
  "booking_intent",
  "booking_ready",
  "group_booking",
  "policy_question",
  "payment",
  "promotion",
  "contact",
  "amenities_question",
  "greeting",
  "handoff_request",
  "handoff_required",
  "general",
];

const SUPPORTED_HANDOFF_REASONS: StarterHandoffRequest["reason"][] = [
  "admin_request",
  "payment_issue",
  "refund",
  "complaint",
  "cancellation",
  "special_approval",
  "group_booking",
  "booking_ready",
];

export async function extractStarterIntentEntities(
  message: string,
  provider: AiProvider = getAiProvider(),
): Promise<StarterIntentEntityExtraction> {
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

export function parseIntentExtraction(text: string): StarterIntentEntityExtraction {
  const value = parseJsonObject(text);
  const language = readLanguage(value);
  const intents = readIntents(value);
  const primaryIntent = readIntent(value.primaryIntent) ?? intents[0] ?? "general";
  const entities = readEntities(value.entities);
  const handoff = readHandoff(value.handoff);

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
    "Do not infer hotel-specific room names, amenities, policies, prices, availability, promotions, or contacts unless the customer explicitly wrote them.",
    "Use ISO YYYY-MM-DD for explicit or relative dates when clear. If a date is unclear, omit it.",
    "Use the customer's language code when supported.",
    "Schema:",
    JSON.stringify({
      language: "th | en | zh | ja | es | ar",
      primaryIntent: "one StarterAiIntent",
      intents: ["one or more StarterAiIntent values"],
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

export function mergeBookingLeadFromEntities(
  existing: LineConversationMemory,
  extraction: Pick<StarterIntentEntityExtraction, "entities" | "handoff" | "language">,
): LineConversationMemory {
  const prevLead = existing.bookingLead ?? {};
  const entities = extraction.entities;

  return {
    ...existing,
    language: extraction.language || existing.language,
    handoffPending: existing.handoffPending || extraction.handoff?.required === true,
    bookingLead: {
      ...prevLead,
      ...(entities.roomTypeName ? { roomTypeName: entities.roomTypeName } : {}),
      ...(entities.checkIn ? { checkIn: entities.checkIn } : {}),
      ...(entities.checkOut ? { checkOut: entities.checkOut } : {}),
      ...(entities.guests ? { guests: entities.guests } : {}),
      ...(entities.guestName ? { guestName: entities.guestName } : {}),
      ...(entities.phone ? { phone: entities.phone } : {}),
      ...(entities.roomPreference ? { roomPreference: entities.roomPreference } : {}),
      ...(entities.dislikedFeatures ? { dislikedFeatures: entities.dislikedFeatures } : {}),
      ...(entities.isGroupBooking ? { isGroupBooking: true } : {}),
      ...(entities.leadScore ? { leadScore: entities.leadScore } : {}),
    },
  };
}

function buildIntentExtractionUserPrompt(message: string): string {
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return [`Today's date: ${iso}`, "Customer message:", message].join("\n");
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

function readLanguage(value: Record<string, unknown>): string {
  const language = value.language;
  return typeof language === "string" && SUPPORTED_LANGUAGES.includes(language) ? language : "th";
}

function readIntents(value: Record<string, unknown>): StarterAiIntent[] {
  const raw = value.intents;
  if (!Array.isArray(raw)) return ["general"];
  const intents = raw.map(readIntent).filter((intent): intent is StarterAiIntent => Boolean(intent));
  const unique = Array.from(new Set(intents));
  return unique.length ? unique : ["general"];
}

function readIntent(value: unknown): StarterAiIntent | null {
  if (typeof value !== "string") return null;
  return SUPPORTED_INTENTS.includes(value as StarterAiIntent) ? value as StarterAiIntent : null;
}

function readEntities(value: unknown): StarterIntentEntities {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const entities: StarterIntentEntities = {};

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

function readHandoff(value: unknown): StarterHandoffRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (source.required !== true) return null;
  const reason =
    typeof source.reason === "string" && SUPPORTED_HANDOFF_REASONS.includes(source.reason as StarterHandoffRequest["reason"])
      ? source.reason as StarterHandoffRequest["reason"]
      : "admin_request";
  const priority = source.priority === "high" ? "high" : "normal";
  return { required: true, reason, priority };
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
