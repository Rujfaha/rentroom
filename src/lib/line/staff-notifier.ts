import type { LineReplyMessage } from "@/types/line-ai.types";
import type { LineHandoffRequest } from "@/types/line-ai.types";
import { pushLineMessage } from "./client";

type PushLineMessage = typeof pushLineMessage;

interface NotifyLineStaffHandoffInput {
  accessToken: string | undefined;
  staffTargetId: string | undefined;
  handoff: LineHandoffRequest | null;
  sourceMessage: string;
  conversationId: string | null;
  lineUserId: string | null;
  push?: PushLineMessage;
}

export async function notifyLineStaffHandoff({
  accessToken,
  staffTargetId,
  handoff,
  sourceMessage,
  conversationId,
  lineUserId,
  push = pushLineMessage,
}: NotifyLineStaffHandoffInput): Promise<void> {
  if (!handoff?.required || !accessToken?.trim() || !staffTargetId?.trim()) return;

  try {
    await push({
      accessToken,
      to: staffTargetId,
      messages: [buildStaffHandoffMessage({ handoff, sourceMessage, conversationId, lineUserId })],
    });
  } catch (error) {
    console.error("LINE staff handoff notify error:", error);
  }
}

function buildStaffHandoffMessage(input: {
  handoff: LineHandoffRequest;
  sourceMessage: string;
  conversationId: string | null;
  lineUserId: string | null;
}): LineReplyMessage {
  return {
    type: "text",
    text: [
      "[LINE AI Handoff]",
      `Reason: ${input.handoff.reason}`,
      `Priority: ${input.handoff.priority}`,
      input.conversationId ? `Conversation: ${input.conversationId}` : null,
      input.lineUserId ? `LINE user: ${input.lineUserId}` : null,
      "",
      "Customer message:",
      input.sourceMessage.slice(0, 1000),
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}
