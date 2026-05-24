import { createHmac, timingSafeEqual } from "crypto";

export function verifyLineSignature(body: string, signature: string | null, channelSecret: string): boolean {
  const normalizedSecret = channelSecret.trim();
  if (!signature || !normalizedSecret) return false;

  const expected = createHmac("sha256", normalizedSecret).update(body).digest();
  let actual: Buffer;

  try {
    actual = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
