import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyLineSignature } from "../signature";

describe("verifyLineSignature", () => {
  it("accepts a valid LINE HMAC signature", () => {
    const body = JSON.stringify({ events: [] });
    const secret = "channel-secret";
    const signature = createHmac("sha256", secret).update(body).digest("base64");

    expect(verifyLineSignature(body, signature, secret)).toBe(true);
  });

  it("rejects missing, malformed, or mismatched signatures", () => {
    const body = JSON.stringify({ events: [] });
    const secret = "channel-secret";

    expect(verifyLineSignature(body, null, secret)).toBe(false);
    expect(verifyLineSignature(body, "not-base64", secret)).toBe(false);
    expect(verifyLineSignature(body, createHmac("sha256", "other").update(body).digest("base64"), secret)).toBe(false);
  });
});
