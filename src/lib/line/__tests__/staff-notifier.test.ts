import { describe, expect, it, vi } from "vitest";
import { notifyLineStaffHandoff } from "../staff-notifier";

describe("notifyLineStaffHandoff", () => {
  it("sends handoff details when staff target is configured", async () => {
    const push = vi.fn().mockResolvedValue(undefined);

    await notifyLineStaffHandoff({
      accessToken: "token",
      staffTargetId: "group-id",
      handoff: { required: true, reason: "payment_issue", priority: "high" },
      sourceMessage: "โอนแล้วแต่สลิปมีปัญหา",
      conversationId: "conversation-1",
      lineUserId: "line-user-1",
      customerContact: {
        displayName: "Mina",
        chatLink: "https://line.me/R/oaMessage/@arkkarawin",
      },
      push,
    });

    expect(push).toHaveBeenCalledOnce();
    const text = push.mock.calls[0]?.[0].messages[0].text;
    expect(text).toContain("ลูกค้าต้องการให้ทีมงานช่วยดู");
    expect(text).toContain("ปัญหาการชำระเงิน/สลิป");
    expect(text).toContain("โอนแล้วแต่สลิปมีปัญหา");
    expect(text).toContain("Mina");
    expect(text).toContain("https://line.me/R/oaMessage/@arkkarawin");
    expect(text).not.toContain("conversation-1");
    expect(text).not.toContain("line-user-1");
    expect(text).not.toContain("[LINE AI Handoff]");
    expect(text).not.toContain("Reason:");
    expect(text).not.toContain("Priority:");
    expect(text).not.toContain("LINE user:");
    expect(text).not.toContain("payment_issue");
  });

  it("skips notification when target is missing", async () => {
    const push = vi.fn();

    await notifyLineStaffHandoff({
      accessToken: "token",
      staffTargetId: "",
      handoff: { required: true, reason: "refund", priority: "high" },
      sourceMessage: "refund",
      conversationId: null,
      lineUserId: null,
      push,
    });

    expect(push).not.toHaveBeenCalled();
  });
});
