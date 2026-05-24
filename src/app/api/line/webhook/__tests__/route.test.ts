import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelContext, LineConversationMemory } from "@/types/line-ai.types";

const state = vi.hoisted(() => ({
  memory: {} as LineConversationMemory,
  replyLineMessage: vi.fn(),
  getLineUserProfile: vi.fn(),
  notifyLineStaffHandoff: vi.fn(),
  updateLineConversationMemory: vi.fn(),
}));

const hotelContext: HotelContext = {
  hotelId: "hotel-1",
  hotelName: "Arkkarawin",
  description: null,
  address: "hello",
  phone: "0993822802",
  email: null,
  contacts: [{ type: "facebook", label: "facebook", value: "RUJITECH เว็บไซต์และระบบหลังบ้าน" }],
  payment: { promptPayConfigured: true, accountName: "arkkarawin" },
  roomTypes: [{ id: "rt-1", name: "Warmly House", basePrice: 2500, maxGuests: 2, availableRooms: 2 }],
  promotions: [],
};

vi.mock("@/lib/ai/hotel-context", () => ({
  buildHotelContext: vi.fn(async () => hotelContext),
  formatHotelContextPrompt: vi.fn(() => "hotel context"),
  resolveActiveHotelId: vi.fn(async () => "hotel-1"),
  summarizeAvailability: vi.fn(() => "availability summary"),
}));

vi.mock("@/lib/line/client", () => ({
  getLineUserProfile: state.getLineUserProfile,
  replyLineMessage: state.replyLineMessage,
}));

vi.mock("@/lib/line/staff-notifier", () => ({
  notifyLineStaffHandoff: state.notifyLineStaffHandoff,
}));

vi.mock("@/lib/line/logging", () => ({
  ensureLineConversation: vi.fn(async () => "conversation-1"),
  getLineConversationMemory: vi.fn(async () => state.memory),
  getRecentLineMessages: vi.fn(async () => []),
  recordLineHandoffEvent: vi.fn(),
  recordLineMessage: vi.fn(),
  updateLineConversationMemory: state.updateLineConversationMemory,
}));

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: vi.fn(async () => ({})),
}));

import { POST } from "../route";

describe("LINE webhook AI route", () => {
  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = "test-secret";
    process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-token";
    process.env.LINE_STAFF_NOTIFY_TARGET_ID = "staff-target";
    process.env.LINE_OA_ID = "@arkkarawin";
    process.env.LINE_BOT_ENABLED = "true";
    state.memory = {};
    state.getLineUserProfile.mockReset();
    state.getLineUserProfile.mockResolvedValue({ displayName: "Mina" });
    state.replyLineMessage.mockReset();
    state.notifyLineStaffHandoff.mockReset();
    state.updateLineConversationMemory.mockReset();
    state.updateLineConversationMemory.mockImplementation(async (_supabase, _conversationId, memory) => {
      state.memory = memory;
    });
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  it("routes admin slip issues and the next customer details through handoff", async () => {
    const first = await POST(buildLineRequest("ติดต่อแอดมินให้หน่อย จองแล้วลืมแนบสลิป", "reply-1"));

    expect(first.status).toBe(200);
    const firstReply = state.replyLineMessage.mock.calls[0]?.[0].messages[0].text as string;
    expect(firstReply).toContain("ทีมงาน");
    expect(firstReply).toContain("ชื่อ/เบอร์");
    expect(firstReply).not.toContain("PromptPay");
    expect(firstReply).not.toContain("ที่อยู่");
    expect(state.notifyLineStaffHandoff).toHaveBeenCalledTimes(1);
    expect(state.notifyLineStaffHandoff.mock.calls[0]?.[0]).toMatchObject({
      customerContact: {
        displayName: "Mina",
        chatLink: "https://line.me/R/oaMessage/@arkkarawin",
      },
    });
    expect(state.memory.handoffPending?.reason).toBe("payment_issue");

    const second = await POST(buildLineRequest("มีนา คนะยก 0817963289", "reply-2"));

    expect(second.status).toBe(200);
    const secondReply = state.replyLineMessage.mock.calls[1]?.[0].messages[0].text as string;
    expect(secondReply).toContain("รับข้อมูลแล้ว");
    expect(secondReply).toContain("ทีมงาน");
    expect(secondReply).not.toContain("Warmly House");
    expect(secondReply).not.toContain("จองต่อได้ที่");
    expect(state.notifyLineStaffHandoff).toHaveBeenCalledTimes(2);
  });

  it("logs LINE source details so groupId can be copied from production logs", async () => {
    await POST(buildLineRequest("test group id", "reply-group", { type: "group", groupId: "Cgroup-id-123", userId: "Uuser-id-123" }));

    expect(console.log).toHaveBeenCalledWith(
      "LINE webhook source:",
      JSON.stringify({ type: "group", groupId: "Cgroup-id-123", userId: "Uuser-id-123" })
    );
  });
});

function buildLineRequest(
  text: string,
  replyToken: string,
  source: { type: "user" | "group" | "room"; userId?: string; groupId?: string; roomId?: string } = { type: "user", userId: "line-user-1" }
): NextRequest {
  const body = JSON.stringify({
    events: [
      {
        type: "message",
        replyToken,
        source,
        message: { id: `message-${replyToken}`, type: "text", text },
      },
    ],
  });

  return new NextRequest("http://localhost/api/line/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-line-signature": createHmac("sha256", "test-secret").update(body).digest("base64"),
    },
    body,
  });
}
