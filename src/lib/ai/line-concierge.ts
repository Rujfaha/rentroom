import { LINE_AI_FALLBACK_REPLY, LINE_TEXT_LIMIT } from "../../constants/line-ai";
import type { AiGenerateResult, AvailabilityRequest, LineConversationMemory, LineMessageHistoryItem } from "@/types/line-ai.types";
import { parseThaiDateRange } from "../../utils/thai-date-parser";
import { detectPrivacyRestrictedQuestion, validateAiAnswer } from "./guardrails";
import { buildHotelContext, formatHotelContextPrompt, summarizeAvailability } from "./hotel-context";
import { detectLineHandoff } from "./handoff";
import { detectLineIntent, detectLineIntents, mergeBookingLead } from "./intent-router";
import { detectLineLanguage } from "./language";
import { getAiProvider } from "./provider";
import { composeLineReply } from "./reply-composer";
import { HOSPIQ_ASSISTANT_PROFILE, buildAssistantFirstContactInstruction, buildAssistantSystemPrompt } from "./assistant-profile";

const ISO_DATE_PATTERN = /\b(20\d{2}-\d{2}-\d{2})\b/g;

export function extractAvailabilityRequest(message: string): AvailabilityRequest | null {
  const parsed = parseThaiDateRange(message);
  if (parsed) return parsed;

  const dates = Array.from(message.matchAll(ISO_DATE_PATTERN), (match) => match[1]).filter(Boolean);
  if (dates.length < 2 || !dates[0] || !dates[1]) return null;

  const guestsMatch = message.match(/(\d{1,2})\s*(?:คน|ท่าน)/);
  const guests = guestsMatch?.[1] ? Number(guestsMatch[1]) : undefined;

  return {
    checkIn: dates[0],
    checkOut: dates[1],
    ...(guests && guests > 0 ? { guests } : {}),
  };
}

export function normalizeLineReply(text: string): string {
  const normalized = text.trim();
  if (!normalized) return LINE_AI_FALLBACK_REPLY;
  if (normalized.length <= LINE_TEXT_LIMIT) return normalized;
  return `${normalized.slice(0, LINE_TEXT_LIMIT - 3).trimEnd()}...`;
}

export function buildBookingUrl(siteUrl: string, request?: AvailabilityRequest | null): string {
  const url = new URL("/booking", siteUrl);
  if (request?.checkIn) url.searchParams.set("checkIn", request.checkIn);
  if (request?.checkOut) url.searchParams.set("checkOut", request.checkOut);
  if (request?.guests) url.searchParams.set("guests", String(request.guests));
  return url.toString();
}

export interface LineConciergeReply {
  hotelId: string;
  reply: string;
  provider: AiGenerateResult["provider"];
  model: string;
  memory: LineConversationMemory;
  intent: string;
  handoff: ReturnType<typeof detectLineHandoff>;
}

export interface GenerateLineConciergeReplyOptions {
  memory?: LineConversationMemory;
  history?: LineMessageHistoryItem[];
}

export async function generateLineConciergeReply(message: string, options: GenerateLineConciergeReplyOptions = {}): Promise<LineConciergeReply> {
  const language = detectLineLanguage(message);
  const history = options.history ?? [];
  const existingMemory = options.memory ?? {};
  const isFirstInteraction = isFirstLineInteraction(existingMemory, history);
  const privacy = detectPrivacyRestrictedQuestion(message);
  if (privacy) {
    const context = await buildHotelContext(null);
    return {
      hotelId: context.hotelId,
      reply: normalizeLineReply(privacy.safeAnswer),
      provider: "gemini",
      model: "guardrail",
      memory: existingMemory,
      intent: "privacy_restricted",
      handoff: null,
    };
  }

  const pendingHandoff = resolvePendingHandoff(message, existingMemory);
  const handoff = detectLineHandoff(message) ?? pendingHandoff;
  const intents = pendingHandoff ? (["handoff"] as const) : detectLineIntents(message);
  const intent = pendingHandoff ? "handoff" : detectLineIntent(message);
  const parsedRequest = pendingHandoff ? null : extractAvailabilityRequest(message);
  const replyMemory = parsedRequest ? mergeBookingLead(existingMemory, parsedRequest) : existingMemory;
  const memory = updateHandoffMemory(replyMemory, handoff, message);
  const availabilityRequest = parsedRequest ?? getAvailabilityFromMemory(memory, intent);
  const context = await buildHotelContext(availabilityRequest);
  const bookingUrl = buildBookingUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", availabilityRequest);
  const deterministicReply = composeLineReply({ language, intents: [...intents], context, bookingUrl, memory: replyMemory, handoff, isFirstInteraction });
  if (deterministicReply) {
    return {
      hotelId: context.hotelId,
      reply: normalizeLineReply(deterministicReply),
      provider: "gemini",
      model: "deterministic",
      memory,
      intent: intents.join(","),
      handoff,
    };
  }

  const provider = getAiProvider();
  const result = await provider.generate({
    system: buildSystemPrompt(),
    prompt: [
      `ข้อความลูกค้า: ${message}`,
      "",
      "ข้อมูลจริงจากระบบ:",
      formatHotelContextPrompt(context),
      "",
      formatHistoryPrompt(history),
      formatMemoryPrompt(memory),
      availabilityRequest ? `สรุปห้องว่างจากระบบ: ${summarizeAvailability(context)}` : null,
      `ลิงก์จองที่ต้องใช้เมื่อมี intent จอง: ${bookingUrl}`,
      `ภาษาที่ลูกค้าใช้: ${language}`,
      isFirstInteraction ? buildAssistantFirstContactInstruction(HOSPIQ_ASSISTANT_PROFILE, language, context) : null,
      `Follow the ${HOSPIQ_ASSISTANT_PROFILE.name} profile for tone, format, and language policy.`,
      "Answer every customer intent in the message using short sections when useful.",
      "Use only grounded facts from the supplied system context and keep all guardrails.",
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  });
  const validation = validateAiAnswer({
    answer: result.text,
    hasAvailabilityData: Boolean(context.availability),
    privacyRestricted: false,
  });

  return {
    hotelId: context.hotelId,
    reply: normalizeLineReply(validation.allowed ? result.text : validation.safeAnswer ?? LINE_AI_FALLBACK_REPLY),
    provider: result.provider,
    model: result.model,
    memory,
    intent: intents.join(","),
    handoff,
  };
}

function resolvePendingHandoff(message: string, memory: LineConversationMemory): ReturnType<typeof detectLineHandoff> {
  if (!memory.handoffPending || !looksLikeHandoffFollowUp(message)) return null;
  return {
    required: true,
    reason: memory.handoffPending.reason,
    priority: memory.handoffPending.priority,
  };
}

function looksLikeHandoffFollowUp(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return /\b0\d{8,9}\b/.test(text) || /(ชื่อ|เบอร์|โทร|สลิป|booking|จอง)/i.test(text);
}

function updateHandoffMemory(
  memory: LineConversationMemory,
  handoff: ReturnType<typeof detectLineHandoff>,
  sourceMessage: string
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

function buildSystemPrompt(): string {
  return buildAssistantSystemPrompt(HOSPIQ_ASSISTANT_PROFILE);
}

function isFirstLineInteraction(memory: LineConversationMemory, history: LineMessageHistoryItem[]): boolean {
  const hasMeaningfulMemory = Boolean(memory.bookingLead || memory.handoffPending);
  const hasOutboundHistory = history.some((item) => item.direction === "outbound");
  return !hasMeaningfulMemory && !hasOutboundHistory;
}

function getAvailabilityFromMemory(memory: LineConversationMemory, intent: string): AvailabilityRequest | null {
  if (intent !== "availability" && intent !== "availability_payment" && intent !== "booking") return null;
  const lead = memory.bookingLead;
  if (!lead?.checkIn || !lead.checkOut) return null;
  return {
    checkIn: lead.checkIn,
    checkOut: lead.checkOut,
    ...(lead.guests ? { guests: lead.guests } : {}),
  };
}

function formatHistoryPrompt(history: LineMessageHistoryItem[]): string | null {
  if (!history.length) return null;
  const lines = history.slice(-8).map((item) => `${item.direction === "inbound" ? "ลูกค้า" : "ผู้ช่วย"}: ${item.text}`);
  return `ประวัติสนทนาล่าสุด:\n${lines.join("\n")}`;
}

function formatMemoryPrompt(memory: LineConversationMemory): string | null {
  if (!memory.bookingLead) return null;
  return `ข้อมูลจองที่จำไว้: ${JSON.stringify(memory.bookingLead)}`;
}
