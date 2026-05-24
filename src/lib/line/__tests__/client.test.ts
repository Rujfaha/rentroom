import { describe, expect, it } from "vitest";
import { replyLineMessage } from "../client";

describe("replyLineMessage", () => {
  it("posts reply messages to LINE with bearer authorization", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response("{}", { status: 200 });
    };

    await replyLineMessage({
      accessToken: "line-token",
      fetcher,
      replyToken: "reply-token",
      messages: [{ type: "text", text: "สวัสดีครับ" }],
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.line.me/v2/bot/message/reply");
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers).toEqual({
      Authorization: "Bearer line-token",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({
      replyToken: "reply-token",
      messages: [{ type: "text", text: "สวัสดีครับ" }],
    });
  });

  it("throws when LINE returns an error response", async () => {
    const fetcher = async (): Promise<Response> => new Response("bad request", { status: 400 });

    await expect(
      replyLineMessage({
        accessToken: "line-token",
        fetcher,
        replyToken: "reply-token",
        messages: [{ type: "text", text: "สวัสดีครับ" }],
      })
    ).rejects.toThrow("LINE reply failed: 400 bad request");
  });
});
