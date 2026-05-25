export interface LineTextMessage {
  type: "text";
  text: string;
}

export async function replyLineMessage(input: {
  accessToken: string;
  replyToken: string;
  messages: LineTextMessage[];
}) {
  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken: input.replyToken,
      messages: input.messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`LINE reply failed with status ${response.status}`);
  }
}
