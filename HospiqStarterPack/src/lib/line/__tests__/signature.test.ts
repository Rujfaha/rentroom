import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyLineSignature } from "../signature";

describe("verifyLineSignature", () => {
  it("accepts a valid LINE signature", () => {
    const body = JSON.stringify({ events: [] });
    const secret = "secret";
    const signature = createHmac("sha256", secret).update(body).digest("base64");

    expect(verifyLineSignature(body, signature, secret)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(verifyLineSignature("{}", "bad", "secret")).toBe(false);
  });
});
