import { describe, expect, it, vi } from "vitest";
import { LINE_PUSH_ENDPOINT } from "../../../constants/line-ai";
import { pushLineMessage } from "../client";

describe("pushLineMessage", () => {
  it("pushes a text message to a LINE user or group target", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));

    await pushLineMessage({
      accessToken: " token ",
      to: " target-id ",
      messages: [{ type: "text", text: "handoff" }],
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      LINE_PUSH_ENDPOINT,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
        body: JSON.stringify({ to: "target-id", messages: [{ type: "text", text: "handoff" }] }),
      })
    );
  });
});
