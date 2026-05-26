import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateHospiqReply } from "../src/lib/ai/orchestrator";

loadEnv(".env.local");

const hotelId = "12af7b54-d63d-4525-9c7a-429726241f49"; // hospiq-handtest-hotel

const testCases = [
  {
    name: "1. ที่จอดรถ (FAQ - Amenities)",
    message: "มีที่จอดรถหรือเปล่าครับ",
  },
  {
    name: "2. เวลาเช็คอิน (FAQ - Check-in/Check-out)",
    message: "เช็คอินได้กี่โมงและเช็คเอาท์กี่โมงครับ",
  },
  {
    name: "3. สิ่งอำนวยความสะดวกที่ไม่มี (Missing Fact - สระว่ายน้ำ)",
    message: "มีสระว่ายน้ำหรือฟิตเนสให้ใช้ไหมครับ",
  },
  {
    name: "4. แนะนำห้องพักสำหรับ 3 คน (Room Recommendation)",
    message: "มาพักกัน 3 คน แนะนำห้องไหนดี ราคาเท่าไหร่",
  },
  {
    name: "5. ขอคุยกับแอดมิน (Handoff Request)",
    message: "ขอบุคคลจริงตอบหน่อยครับ หรือขอคุยกับแอดมิน",
  },
  {
    name: "6. การจองพร้อมจอง (Booking Ready)",
    message: "จองห้อง Standard Queen พัก 2 คน คืนนี้ครับ ชื่อ เอกพล เบอร์ 0817777777",
  },
];

async function runTests() {
  console.log("Starting local AI response tests...");
  const results: any[] = [];

  for (const tc of testCases) {
    console.log(`Running: ${tc.name}`);
    try {
      const result = await generateHospiqReply({
        hotelId,
        lineUserId: `test-user-${Date.now()}`,
        message: tc.message,
      });

      results.push({
        name: tc.name,
        message: tc.message,
        reply: result.reply,
        intent: result.intent,
        provider: result.aiProvider,
        model: result.aiModel,
        handoffRequired: result.handoffRequired,
        handoffReason: result.handoffReason,
        entities: result.entities,
        retrievedFaqs: result.prompt.retrievedFaqs.map((faq) => faq.question),
      });
    } catch (error: any) {
      console.error(`Error running test ${tc.name}:`, error);
      results.push({
        name: tc.name,
        message: tc.message,
        error: error.message || error,
      });
    }
  }

  // Generate markdown report
  let mdContent = `# AI Local Response Test Report\n\n`;
  mdContent += `**Date:** ${new Date().toLocaleString("th-TH")}\n`;
  mdContent += `**Hotel ID:** \`${hotelId}\` (Hospiq Handtest Hotel)\n\n`;
  mdContent += `## Summary of Test Cases\n\n`;
  mdContent += `| Case Name | Intent | Handoff | Provider/Model |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;

  for (const r of results) {
    if (r.error) {
      mdContent += `| ${r.name} | *ERROR* | - | - |\n`;
    } else {
      mdContent += `| ${r.name} | \`${r.intent}\` | \`${r.handoffRequired ? "Yes" : "No"}\` | ${r.provider} (${r.model}) |\n`;
    }
  }

  mdContent += `\n---\n\n## Test Case Details\n\n`;

  for (const r of results) {
    mdContent += `### ${r.name}\n\n`;
    mdContent += `**User Message:**\n`;
    mdContent += `\`\`\`txt\n${r.message}\n\`\`\`\n\n`;

    if (r.error) {
      mdContent += `**Error:**\n`;
      mdContent += `\`\`\`txt\n${r.error}\n\`\`\`\n\n`;
    } else {
      mdContent += `**AI Response:**\n`;
      mdContent += `\`\`\`txt\n${r.reply}\n\`\`\`\n\n`;
      mdContent += `**Metadata:**\n`;
      mdContent += `- **Intent:** \`${r.intent}\`\n`;
      mdContent += `- **Handoff:** \`${r.handoffRequired ? "Yes" : "No"}${r.handoffReason ? ` (${r.handoffReason})` : ""}\`\n`;
      mdContent += `- **AI Provider / Model:** \`${r.provider}\` / \`${r.model}\`\n`;
      mdContent += `- **Extracted Entities:** \`${JSON.stringify(r.entities)}\`\n`;
      if (r.retrievedFaqs.length > 0) {
        mdContent += `- **Retrieved FAQs:**\n`;
        r.retrievedFaqs.forEach((faq: string) => {
          mdContent += `  - ${faq}\n`;
        });
      }
    }
    mdContent += `\n---\n\n`;
  }

  const outputFilePath = join(process.cwd(), "docs", "local-ai-test-results.md");
  writeFileSync(outputFilePath, mdContent, "utf8");
  console.log(`Test results saved to: ${outputFilePath}`);
}

runTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});

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
