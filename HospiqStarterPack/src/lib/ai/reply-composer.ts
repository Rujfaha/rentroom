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
    "Intent:",
    payload.intent,
    "",
    "Current hotel identity:",
    JSON.stringify(payload.identity, null, 2),
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
    "- Use only the hotel facts, FAQ examples, memory, and policies above.",
    "- Do not use data from any other hotel.",
    "- If a requested fact is missing, do not guess.",
    "- If a booking link can be offered, use only hotelData.webbookingUrl.",
    `- Keep the reply within ${payload.policies.maxReplyLength} characters.`,
  ].join("\n");
}
