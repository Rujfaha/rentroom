import type { UserRole } from "@/types/database.types";

export const SESSION_COOKIE = "admin_session";
export const SESSION_DURATION_MS = 30 * 60 * 1000;

export interface SessionPayload {
  userId: string;
  role: UserRole;
  hotelId: string | null;
  hotelName: string | null;
  fullName: string;
  expiresAt: number;
}

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

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToArrayBuffer(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function encodeBase64Url(value: string): string {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function decodeBase64Url(value: string): string {
  return new TextDecoder().decode(base64UrlToArrayBuffer(value));
}

function isValidRole(role: unknown): role is UserRole {
  return role === "super_admin" || role === "admin" || role === "staff";
}

function isSessionPayload(payload: unknown): payload is SessionPayload {
  if (!payload || typeof payload !== "object") return false;

  const data = payload as Record<string, unknown>;
  return (
    typeof data.userId === "string" &&
    isValidRole(data.role) &&
    (typeof data.hotelId === "string" || data.hotelId === null) &&
    (typeof data.hotelName === "string" || data.hotelName === null) &&
    typeof data.fullName === "string" &&
    typeof data.expiresAt === "number" &&
    Number.isFinite(data.expiresAt)
  );
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  const secret = getSecretKey();
  const key = await getCryptoKey(secret);
  const json = JSON.stringify(payload);
  const enc = new TextEncoder();
  const data = enc.encode(json);

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigBase64 = bytesToBase64Url(new Uint8Array(signature));
  const payloadBase64 = encodeBase64Url(json);

  return `${payloadBase64}.${sigBase64}`;
}

export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const [payloadBase64, sigBase64, extra] = token.split(".");
    if (!payloadBase64 || !sigBase64 || extra) return null;

    const secret = getSecretKey();
    const key = await getCryptoKey(secret);
    const json = decodeBase64Url(payloadBase64);
    const enc = new TextEncoder();
    const data = enc.encode(json);
    const signature = base64UrlToArrayBuffer(sigBase64);

    const valid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!valid) return null;

    const payload: unknown = JSON.parse(json);
    if (!isSessionPayload(payload)) return null;

    if (Date.now() > payload.expiresAt) return null;

    return payload;
  } catch {
    return null;
  }
}
