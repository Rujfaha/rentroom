import { LINE_AI_FALLBACK_REPLY, LINE_TEXT_LIMIT } from "../../constants/line-ai";
import type { AiGenerateResult, AvailabilityRequest, LineConversationMemory, LineMessageHistoryItem } from "@/types/line-ai.types";
import { parseThaiDateRange } from "../../utils/thai-date-parser";
import { buildHotelContext, formatHotelContextPrompt, summarizeAvailability } from "./hotel-context";
import { buildDeterministicReply, detectLineIntent, mergeBookingLead } from "./intent-router";
import { getAiProvider } from "./provider";

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
}

export interface GenerateLineConciergeReplyOptions {
  memory?: LineConversationMemory;
  history?: LineMessageHistoryItem[];
}

export async function generateLineConciergeReply(message: string, options: GenerateLineConciergeReplyOptions = {}): Promise<LineConciergeReply> {
  const intent = detectLineIntent(message);
  const parsedRequest = extractAvailabilityRequest(message);
  const memory = parsedRequest ? mergeBookingLead(options.memory ?? {}, parsedRequest) : options.memory ?? {};
  const availabilityRequest = parsedRequest ?? getAvailabilityFromMemory(memory, intent);
  const context = await buildHotelContext(availabilityRequest);
  const bookingUrl = buildBookingUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", availabilityRequest);
  const deterministicReply = buildDeterministicReply({ intent, context, bookingUrl, memory });
  if (deterministicReply) {
    return {
      hotelId: context.hotelId,
      reply: normalizeLineReply(deterministicReply),
      provider: "gemini",
      model: "deterministic",
      memory,
      intent,
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
      formatHistoryPrompt(options.history ?? []),
      formatMemoryPrompt(memory),
      availabilityRequest ? `สรุปห้องว่างจากระบบ: ${summarizeAvailability(context)}` : null,
      `ลิงก์จองที่ต้องใช้เมื่อมี intent จอง: ${bookingUrl}`,
      "ตอบกลับลูกค้าเป็นภาษาไทย กระชับ และห้ามแต่งข้อมูลที่ไม่มีในข้อมูลจริงจากระบบ",
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
  });

  return {
    hotelId: context.hotelId,
    reply: normalizeLineReply(result.text),
    provider: result.provider,
    model: result.model,
    memory,
    intent,
  };
}

function buildSystemPrompt(): string {
  return [
    "คุณคือผู้ช่วยตอบ LINE OA ของโรงแรม/ที่พัก",
    "ตอบภาษาไทย สุภาพ กระชับ และเน้นช่วยให้ลูกค้าจองผ่านเว็บ",
    "ใช้เฉพาะข้อมูลจริงจากระบบที่ให้มาเท่านั้น",
    "ถ้าข้อมูลไม่ครบ ให้ถามต่อครั้งละหนึ่งคำถาม",
    "ถ้าลูกค้าต้องการจอง ให้ส่งลิงก์จองจากระบบ",
    "ห้ามยืนยันการจอง ห้ามรับรองการชำระเงิน ห้ามแต่งโปรโมชัน นโยบาย เลขบัญชี หรือห้องว่างเอง",
    "เรื่อง refund, complaint, cancellation, special approval, group deal หรือ payment issue ให้แจ้งว่าจะให้ทีมงานช่วยดูต่อ",
  ].join("\n");
}

function getAvailabilityFromMemory(memory: LineConversationMemory, intent: string): AvailabilityRequest | null {
  if (intent !== "availability" && intent !== "booking") return null;
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
