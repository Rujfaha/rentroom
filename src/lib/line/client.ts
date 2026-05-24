import { LINE_PUSH_ENDPOINT, LINE_REPLY_ENDPOINT } from "../../constants/line-ai";
import type { LineReplyMessage } from "@/types/line-ai.types";

type LineFetch = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface ReplyLineMessageInput {
  accessToken: string;
  replyToken: string;
  messages: LineReplyMessage[];
  fetcher?: LineFetch;
}

interface PushLineMessageInput {
  accessToken: string;
  to: string;
  messages: LineReplyMessage[];
  fetcher?: LineFetch;
}

interface LineUserProfile {
  displayName: string;
}

export async function replyLineMessage({
  accessToken,
  replyToken,
  messages,
  fetcher = fetch,
}: ReplyLineMessageInput): Promise<void> {
  const token = accessToken.trim();
  const response = await fetcher(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LINE reply failed: ${response.status} ${details}`);
  }
}

export async function pushLineMessage({
  accessToken,
  to,
  messages,
  fetcher = fetch,
}: PushLineMessageInput): Promise<void> {
  const token = accessToken.trim();
  const response = await fetcher(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: to.trim(), messages }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${details}`);
  }
}

export async function getLineUserProfile(
  accessToken: string,
  userId: string,
  fetcher: LineFetch = fetch
): Promise<LineUserProfile | null> {
  const token = accessToken.trim();
  const trimmedUserId = userId.trim();
  if (!token || !trimmedUserId) return null;

  const response = await fetcher(`https://api.line.me/v2/bot/profile/${encodeURIComponent(trimmedUserId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  const data: unknown = await response.json();
  if (!data || typeof data !== "object") return null;

  const displayName = (data as { displayName?: unknown }).displayName;
  return typeof displayName === "string" && displayName.trim() ? { displayName } : null;
}
