// ============================================================
// Session Management — stateless JWT via httpOnly cookie
// ใช้ Web Crypto API (Edge-compatible, ไม่ต้องติดตั้ง jose)
// ============================================================
import "server-only";
import { cookies } from "next/headers";
import type { UserRole } from "@/types/database.types";

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  userId: string;
  role: UserRole;
  hotelId: string | null;
  hotelName: string | null;
  fullName: string;
  expiresAt: number; // Unix timestamp ms
}

// ─── Helpers ───────────────────────────────────────────────

function getSecretKey(): string {
  const key = process.env.SESSION_SECRET;
  if (!key) throw new Error("SESSION_SECRET environment variable is not set");
  return key;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// ─── Encrypt / Decrypt ─────────────────────────────────────

export async function encrypt(payload: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  const key = await getCryptoKey(secret);
  const json = JSON.stringify(payload);
  const enc = new TextEncoder();
  const data = enc.encode(json);

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigBase64 = Buffer.from(signature).toString("base64url");
  const payloadBase64 = Buffer.from(json).toString("base64url");

  return `${payloadBase64}.${sigBase64}`;
}

export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const [payloadBase64, sigBase64] = token.split(".");
    if (!payloadBase64 || !sigBase64) return null;

    const secret = getSecretKey();
    const key = await getCryptoKey(secret);
    const enc = new TextEncoder();
    const data = enc.encode(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    );
    const signature = Buffer.from(sigBase64, "base64url");

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf-8")
    );

    // ตรวจสอบวันหมดอายุ
    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Cookie API ────────────────────────────────────────────

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encrypt({ ...payload, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return decrypt(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
