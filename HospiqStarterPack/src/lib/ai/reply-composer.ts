import type { LineConversationMemory, StarterPromptPayload } from "./types";

export interface AiReplyDraft {
  reply: string;
  memoryUpdate: Partial<LineConversationMemory>;
  source: string;
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
      };
    },
  };
}
