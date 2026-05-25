import type { AiGenerateResult, HotelContext, LineConversationMemory, LineIntentEntityExtraction, LineMessageHistoryItem, SupportedLineLanguage } from "@/types/line-ai.types";
import type { AiProvider } from "./provider";
import type { LineResponsePlan } from "./reply-composer";
import { formatHotelAiKnowledgePrompt } from "./ai-knowledge";
import {
  HOSPIQ_ASSISTANT_PROFILE,
  buildAssistantFirstContactInstruction,
  buildAssistantSalesFlowInstruction,
  buildAssistantSystemPrompt,
} from "./assistant-profile";
import { formatHotelContextPrompt, summarizeAvailability } from "./hotel-context";

interface GenerateLineResponseInput {
  provider: AiProvider;
  message: string;
  language: SupportedLineLanguage;
  context: HotelContext;
  memory: LineConversationMemory;
  history: LineMessageHistoryItem[];
  analysis: LineIntentEntityExtraction;
  responsePlan: LineResponsePlan;
  isFirstInteraction: boolean;
}

export async function generateGroundedLineResponse(input: GenerateLineResponseInput): Promise<AiGenerateResult> {
  return input.provider.generate({
    system: buildAssistantSystemPrompt(HOSPIQ_ASSISTANT_PROFILE),
    prompt: buildGroundedResponsePrompt(input),
    maxOutputTokens: 900,
  });
}

export function buildGroundedResponsePrompt(input: Omit<GenerateLineResponseInput, "provider">): string {
  return [
    `Customer message:\n${input.message}`,
    "",
    "Intent and entity extraction:",
    JSON.stringify(input.analysis, null, 2),
    "",
    "Response plan:",
    JSON.stringify(input.responsePlan, null, 2),
    "",
    "Hotel facts from database:",
    formatHotelContextPrompt(input.context),
    "",
    "Hotel AI knowledge from database:",
    formatHotelAiKnowledgePrompt(input.context.aiKnowledge),
    "",
    input.context.availability ? `Availability result from database:\n${summarizeAvailability(input.context)}` : null,
    formatHistoryPrompt(input.history),
    formatMemoryPrompt(input.memory),
    input.isFirstInteraction ? buildAssistantFirstContactInstruction(HOSPIQ_ASSISTANT_PROFILE, input.language, input.context) : null,
    buildAssistantSalesFlowInstruction(),
    "Core response rules:",
    "- Generate the final customer-facing LINE reply yourself from the database facts above.",
    "- Do not use canned templates or invent hotel-specific facts.",
    "- If a requested fact is missing, say that the system does not have that detail yet and ask one useful follow-up or offer staff help.",
    "- For overview questions, summarize multiple relevant room types from the database instead of pushing one room.",
    "- For a specific room question, answer only that room if present in the database facts.",
    "- Include the booking URL only when responsePlan.canIncludeBookingUrl is true.",
    "- If responsePlan.handoff is present, keep the reply focused on staff follow-up and do not add unrelated sales details.",
    "- Use the customer's language. For Thai, use polite feminine particles only.",
    "- Keep the answer concise for LINE chat.",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function formatHistoryPrompt(history: LineMessageHistoryItem[]): string | null {
  if (!history.length) return null;
  return [
    "Recent conversation:",
    ...history.slice(-8).map((item) => `${item.direction}: ${item.text}`),
  ].join("\n");
}

function formatMemoryPrompt(memory: LineConversationMemory): string | null {
  if (!memory.bookingLead && !memory.handoffPending) return null;
  return `Conversation memory:\n${JSON.stringify(memory, null, 2)}`;
}
