import { createHmac, timingSafeEqual } from "crypto";

export function verifyLineSignature(body: string, signature: string | null, channelSecret: string): boolean {
  if (!signature || !channelSecret) return false;

  const expected = createHmac("sha256", channelSecret).update(body).digest();
  let actual: Buffer;

  try {
    actual = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
