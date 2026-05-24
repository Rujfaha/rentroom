import { LINE_REPLY_ENDPOINT } from "../../constants/line-ai";
import type { LineReplyMessage } from "@/types/line-ai.types";

type LineFetch = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface ReplyLineMessageInput {
  accessToken: string;
  replyToken: string;
  messages: LineReplyMessage[];
  fetcher?: LineFetch;
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
