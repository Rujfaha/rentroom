// ============================================================
// Session Management — stateless JWT via httpOnly cookie
// ใช้ Web Crypto API (Edge-compatible, ไม่ต้องติดตั้ง jose)
// ============================================================
import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  decrypt,
  encrypt,
  type SessionPayload,
} from "@/lib/session-core";

export { SESSION_COOKIE, decrypt, encrypt };
export type { SessionPayload };

// ─── Cookie API ────────────────────────────────────────────

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const token = await encrypt({ ...payload, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
