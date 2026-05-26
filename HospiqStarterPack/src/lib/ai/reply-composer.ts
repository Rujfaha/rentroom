import type { LineConversationMemory, StarterPromptPayload } from "./types";
import type { AiProvider } from "./provider";
import { getAiProvider } from "./provider";
import { buildStarterSystemPrompt } from "./system-prompt";

export interface AiReplyDraft {
  reply: string;
  memoryUpdate: Partial<LineConversationMemory>;
  source: string;
  provider: string | null;
  model: string | null;
}

export interface ReplyComposer {
  compose(payload: StarterPromptPayload): Promise<AiReplyDraft>;
}

export function createNotConfiguredReplyComposer(): ReplyComposer {
  return {
    async compose(payload) {
      return {
        reply: payload.retrievedFaqs[0]?.answer ?? "",
        memoryUpdate: payload.memory,
        source: "not_configured",
        provider: null,
        model: null,
      };
    },
  };
}

export function createModelBackedReplyComposer(provider: AiProvider = getAiProvider()): ReplyComposer {
  return {
    async compose(payload) {
      const result = await provider.generate({
        system: buildStarterSystemPrompt(),
        prompt: buildGroundedReplyPrompt(payload),
        maxOutputTokens: Math.ceil(payload.policies.maxReplyLength / 3),
      });

      return {
        reply: result.text,
        memoryUpdate: payload.memory,
        source: "model",
        provider: result.provider,
        model: result.model,
      };
    },
  };
}

export function buildGroundedReplyPrompt(payload: StarterPromptPayload): string {
  return [
    `Customer message:\n${payload.userMessage}`,
    "",
    "Mandatory grounding brief:",
    buildGroundingBrief(payload),
    "",
    "Booking summary facts:",
    buildBookingSummaryFacts(payload),
    "",
    "Intent:",
    payload.intent,
    "",
    "Current hotel identity:",
    JSON.stringify(payload.identity, null, 2),
    "",
    "Persona policy:",
    JSON.stringify(payload.persona, null, 2),
    "",
    "Hospitality and sales assistance policy:",
    JSON.stringify(payload.hospitalitySales, null, 2),
    "",
    "Hospiq AI knowledge and policies:",
    JSON.stringify(payload.aiKnowledge, null, 2),
    "",
    "Hotel facts from Starter Pack database:",
    JSON.stringify(payload.hotelData, null, 2),
    "",
    "Relevant FAQ examples from Starter Pack database:",
    JSON.stringify(payload.retrievedFaqs, null, 2),
    "",
    "Conversation memory:",
    JSON.stringify(payload.memory, null, 2),
    "",
    "Policies:",
    JSON.stringify(payload.policies, null, 2),
    "",
    "Core response rules:",
    "- First decide what concrete facts the customer asked for, then answer those facts directly.",
    "- If Relevant FAQ examples contain an answer to the customer message, use that FAQ answer as the primary grounding.",
    "- When recommending rooms for specific dates, check if any roomtypes are fully booked (i.e., Available rooms is 0). Do not recommend or list fully booked roomtypes as available options. Propose only roomtypes that actually have room availability for the requested stay.",
    "- If a roomtype is fully booked for the requested dates but the customer specifically inquiries about it, or if you need to mention it, clearly state that it is fully booked for their dates and steer the customer to the alternative available options instead.",
    "- Follow the persona policy as a female hotel sales assistant.",
    "- Use natural feminine Thai service language when replying in Thai.",
    "- Lead with what the hotel can support before mentioning limitations.",
    "- Do not lead with limitations.",
    "- Help the customer choose before sending booking links.",
    "- Follow the CTA strategy from hospitalitySales. Do not include booking links for handoff-only requests.",
    "- If hospitalitySales.memorySummary.shouldSummarize is true, summarize known booking details before the next action.",
    "- When summarizing booking details, include check-in date, check-out date, room, guest count, and estimated cost if hospitalitySales.memorySummary.estimatedCost is present.",
    "- Label cost as an estimate or starting price when the policy or room price note says prices may vary.",
    "- If the check-in and check-out dates are already specified or known in the conversation memory or booking summary facts, do not include generic price-by-date variation caveats (e.g., 'ราคาเริ่มต้น อาจเปลี่ยนตามวันเข้าพัก' or 'ราคาอาจเปลี่ยนแปลงตามวันเข้าพัก').",
    "- When recommending a room where the customer's guest count exceeds the standard capacity (or when asked about extra beds/guests), do not say 'ราคาอาจเปลี่ยนแปลงตามจำนวนผู้เข้าพัก'. Instead, upsell the extra bed service using the room's concrete extra bed price (e.g., 'หากมีผู้เข้าพักเพิ่ม เรามีบริการเสริมเตียงเสริมให้ในราคา {extraBedPrice} บาทต่อคืน/ท่านค่ะ' or similar natural phrasing).",
    "- For multi-part customer messages, answer each part in the same reply.",
    "- Use only the hotel facts, FAQ examples, memory, and policies above.",
    "- Do not use data from any other hotel.",
    "- If a requested fact is missing, do not guess.",
    "- Do not respond with a generic greeting or ask what the customer wants when the customer already asked a concrete question.",
    "- When responding to a general greeting with no concrete question (e.g., 'สวัสดีครับ'), reply with a concise welcoming greeting that includes the hotel name (e.g., 'สวัสดีค่ะ แอดมิน Hospiq ยินดีต้อนรับสู่ {hotelName} ค่ะ มีข้อมูลส่วนไหนให้แอดมินช่วยเหลือสอบถามได้เลยนะคะ') without dragging follow-up questions.",
    "- Do not provide the webbookingUrl or rush the customer to book unless they have explicitly confirmed they want to book, or the CTA strategy is 'booking_ready'.",
    "- If a booking link can be offered, use only hotelData.webbookingUrl.",
    `- CTA strategy: ${payload.hospitalitySales.ctaStrategy}.`,
    "- Summarize known booking details when customer has already provided booking details.",
    `- Keep the reply within ${payload.policies.maxReplyLength} characters.`,
    ].join("\n");
}

function buildBookingSummaryFacts(payload: StarterPromptPayload): string {
  const summary = payload.hospitalitySales.memorySummary;
  if (!summary.shouldSummarize) return "No booking summary is needed yet.";

  return JSON.stringify({
    knownDetails: summary.knownDetails,
    estimatedCost: summary.estimatedCost,
    instruction: "When replying about booking-ready details, summarize these known details in natural language before the CTA.",
  }, null, 2);
}

function buildGroundingBrief(payload: StarterPromptPayload): string {
  const faqFacts = payload.retrievedFaqs
    .slice(0, 3)
    .map((faq, index) => `${index + 1}. FAQ: ${faq.question}\nAnswer: ${faq.answer}`);
  const roomFacts = payload.hotelData.roomtypes
    .slice(0, 4)
    .map((roomtype, index) => {
      const availability = roomtype.availableRooms === null ? "not calculated" : String(roomtype.availableRooms);
      return [
        `${index + 1}. Room: ${roomtype.name}`,
        `Base price: ${roomtype.basePrice}`,
        `Standard capacity: ${roomtype.standardCapacity}`,
        `Max capacity: ${roomtype.maxCapacity}`,
        roomtype.maxExtraBeds > 0 ? `Max extra beds: ${roomtype.maxExtraBeds}` : null,
        roomtype.extraBedPrice > 0 ? `Extra bed price: ${roomtype.extraBedPrice}` : null,
        `Available rooms: ${availability}`,
        roomtype.priceNote ? `Price note: ${roomtype.priceNote}` : null,
        roomtype.description ? `Description: ${roomtype.description}` : null,
      ].filter(Boolean).join("\n");
    });

  return [
    "Use these facts before any general wording. If they answer the customer, answer directly.",
    "FAQ facts:",
    faqFacts.length ? faqFacts.join("\n") : "None",
    "Room facts:",
    roomFacts.length ? roomFacts.join("\n") : "None",
  ].join("\n");
}
