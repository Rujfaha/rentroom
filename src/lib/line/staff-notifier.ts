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
      "ลูกค้าต้องการให้ทีมงานช่วยดู",
      `เรื่อง: ${formatHandoffReason(input.handoff.reason)}`,
      `ความเร่งด่วน: ${input.handoff.priority === "high" ? "สูง" : "ปกติ"}`,
      input.conversationId ? `รหัสบทสนทนา: ${input.conversationId}` : null,
      input.lineUserId ? `LINE user id: ${input.lineUserId}` : null,
      "",
      "ข้อความจากลูกค้า:",
      input.sourceMessage.slice(0, 1000),
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  };
}

function formatHandoffReason(reason: LineHandoffRequest["reason"]): string {
  return {
    admin_request: "ขอติดต่อแอดมิน/เจ้าหน้าที่",
    payment_issue: "ปัญหาการชำระเงิน/สลิป",
    refund: "ขอคืนเงิน",
    complaint: "ร้องเรียน/ไม่พอใจบริการ",
    cancellation: "ยกเลิกการจอง",
    special_approval: "ขออนุมัติพิเศษ",
    group_booking: "จองหลายห้อง/หมู่คณะ",
    booking_ready: "ลูกค้าพร้อมจอง",
  }[reason];
}
