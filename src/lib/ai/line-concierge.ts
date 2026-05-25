import { LINE_AI_FALLBACK_REPLY, LINE_TEXT_LIMIT } from "../../constants/line-ai";
import type {
  AiGenerateResult,
  AvailabilityRequest,
  LineConversationMemory,
  LineHandoffRequest,
  LineIntentEntityExtraction,
  LineMessageHistoryItem,
} from "@/types/line-ai.types";
import { sanitizeResponse } from "./assistant-profile";
import { detectPrivacyRestrictedQuestion, validateAiAnswer } from "./guardrails";
import { buildHotelContext } from "./hotel-context";
import { buildAvailabilityRequestFromEntities, extractLineIntentEntities, mergeBookingLeadFromEntities } from "./intent-router";
import { getAiProvider } from "./provider";
import { buildLineResponsePlan } from "./reply-composer";
import { generateGroundedLineResponse } from "./response-generator";

export function normalizeLineReply(text: string): string {
  const normalized = text.trim();
  if (!normalized) return LINE_AI_FALLBACK_REPLY;
  if (normalized.length <= LINE_TEXT_LIMIT) return normalized;
  return `${normalized.slice(0, LINE_TEXT_LIMIT - 3).trimEnd()}...`;
}

export function buildBookingUrl(siteUrl: string, lead?: LineConversationMemory["bookingLead"] | null): string {
  const url = new URL("/booking", siteUrl);
  if (lead?.checkIn) url.searchParams.set("checkIn", lead.checkIn);
  if (lead?.checkOut) url.searchParams.set("checkOut", lead.checkOut);
  if (lead?.guests) url.searchParams.set("guests", String(lead.guests));
  if (lead?.roomTypeName) url.searchParams.set("roomTypeName", lead.roomTypeName);
  return url.toString();
}

export interface LineConciergeReply {
  hotelId: string;
  reply: string;
  provider: AiGenerateResult["provider"];
  model: string;
  memory: LineConversationMemory;
  intent: string;
  handoff: LineHandoffRequest | null;
}

export interface GenerateLineConciergeReplyOptions {
  memory?: LineConversationMemory;
  history?: LineMessageHistoryItem[];
}

export async function generateLineConciergeReply(
  message: string,
  options: GenerateLineConciergeReplyOptions = {},
): Promise<LineConciergeReply> {
  const history = options.history ?? [];
  const existingMemory = options.memory ?? {};
  const isFirstInteraction = isFirstLineInteraction(existingMemory, history);
  const privacy = detectPrivacyRestrictedQuestion(message);

  if (privacy) {
    const context = await buildHotelContext(null);
    return {
      hotelId: context.hotelId,
      reply: normalizeLineReply(sanitizeResponse(privacy.safeAnswer)),
      provider: "gemini",
      model: "guardrail",
      memory: existingMemory,
      intent: "privacy_restricted",
      handoff: null,
    };
  }

  const provider = getAiProvider();
  const analysis = await extractLineIntentEntities(message, provider);
  const pendingHandoff = resolvePendingHandoff(message, existingMemory);
  const handoff = pendingHandoff ?? analysis.handoff ?? null;
  const intents = pendingHandoff ? (["handoff"] as const) : analysis.intents;
  const language = analysis.language;
  const replyMemory = pendingHandoff ? existingMemory : mergeBookingLeadFromEntities(existingMemory, analysis.entities);
  const memory = updateHandoffMemory(replyMemory, handoff, message);
  const availabilityRequest = pendingHandoff
    ? null
    : buildAvailabilityRequestFromEntities(analysis.entities) ?? getAvailabilityFromMemory(memory, analysis);
  const context = await buildHotelContext(availabilityRequest, language);
  const bookingUrl = buildBookingUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", memory.bookingLead);
  const responsePlan = buildLineResponsePlan({
    intents: [...intents],
    context,
    bookingUrl,
    memory,
    availabilityRequest,
    handoff,
  });

  const result = await generateGroundedLineResponse({
    provider,
    message,
    language,
    context,
    memory,
    history,
    analysis,
    responsePlan,
    isFirstInteraction,
  });
  const validation = validateAiAnswer({
    answer: result.text,
    hasAvailabilityData: Boolean(context.availability),
    privacyRestricted: false,
  });

  return {
    hotelId: context.hotelId,
    reply: normalizeLineReply(sanitizeResponse(validation.allowed ? result.text : validation.safeAnswer ?? LINE_AI_FALLBACK_REPLY)),
    provider: result.provider,
    model: result.model,
    memory,
    intent: intents.join(","),
    handoff,
  };
}

function resolvePendingHandoff(message: string, memory: LineConversationMemory): LineHandoffRequest | null {
  if (!memory.handoffPending || !message.trim()) return null;
  return {
    required: true,
    reason: memory.handoffPending.reason,
    priority: memory.handoffPending.priority,
  };
}

function updateHandoffMemory(
  memory: LineConversationMemory,
  handoff: LineHandoffRequest | null,
  sourceMessage: string,
): LineConversationMemory {
  if (!handoff?.required) return memory;
  return {
    ...memory,
    handoffPending: {
      reason: handoff.reason,
      priority: handoff.priority,
      requestedAt: memory.handoffPending?.requestedAt ?? new Date().toISOString(),
      lastCustomerMessage: sourceMessage.slice(0, 1000),
    },
  };
}

function isFirstLineInteraction(memory: LineConversationMemory, history: LineMessageHistoryItem[]): boolean {
  const hasMeaningfulMemory = Boolean(memory.bookingLead || memory.handoffPending);
  const hasOutboundHistory = history.some((item) => item.direction === "outbound");
  return !hasMeaningfulMemory && !hasOutboundHistory;
}

function getAvailabilityFromMemory(memory: LineConversationMemory, analysis: LineIntentEntityExtraction): AvailabilityRequest | null {
  const usesAvailability = analysis.intents.some((intent) =>
    intent === "availability" ||
    intent === "availability_payment" ||
    intent === "booking" ||
    intent === "booking_ready" ||
    intent === "availability_check"
  );
  if (!usesAvailability) return null;
  const lead = memory.bookingLead;
  if (!lead?.checkIn || !lead.checkOut) return null;
  if (lead.source?.checkIn !== "customer" || lead.source?.checkOut !== "customer") return null;
  return {
    checkIn: lead.checkIn,
    checkOut: lead.checkOut,
    ...(lead.guests ? { guests: lead.guests } : {}),
  };
}
