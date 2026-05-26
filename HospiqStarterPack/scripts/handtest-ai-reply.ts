import { readFileSync } from "node:fs";
import { generateHospiqReply } from "../src/lib/ai/orchestrator";

loadEnv(".env.local");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const hotelId = process.argv[2] ?? "12af7b54-d63d-4525-9c7a-429726241f49";
  const message = process.argv.slice(3).join(" ") || "รถยนต์จอดได้ไหม และถ้าพักสองคนแนะนำห้องไหน";

  const result = await generateHospiqReply({
    hotelId,
    lineUserId: "manual-handtest-user",
    message,
  });

  console.log(JSON.stringify({
    reply: result.reply,
    intent: result.intent,
    provider: result.aiProvider,
    model: result.aiModel,
    faqQuestions: result.prompt.retrievedFaqs.map((faq) => faq.question),
  }, null, 2));
}

function loadEnv(path: string) {
  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
