import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateHospiqReply } from "../src/lib/ai/orchestrator";
import { lineRepository } from "../src/server/repositories/line.repository";
import { bookingService } from "../src/server/services/booking.service";

loadEnv(".env.local");

const hotelId = "12af7b54-d63d-4525-9c7a-429726241f49"; // hospiq-handtest-hotel
const lineUserId = `long-test-user-${Date.now()}`;

const turns = [
  {
    turn: 1,
    name: "Inquiry with Dates & Guests (ระบุวันและผู้เข้าพัก 5 คน)",
    message: "สวัสดีครับ สนใจอยากหาห้องพักในเมืองน่าน ช่วงวันที่ 27-29 พฤษภาคมนี้ครับ ไปกันผู้ใหญ่ 4 คน เด็ก 1 คน แนะนำห้องไหนดีครับ",
  },
  {
    turn: 2,
    name: "Room Comparison & Specific Amenities (เปรียบเทียบห้องพักและสิ่งอำนวยความสะดวก)",
    message: "แล้วระหว่างจองเป็นบ้านพัก Nan Riverfront Family Villa 1 หลัง กับจองห้องพัก Deluxe Lanna Garden 2 ห้อง แบบไหนคุ้มกว่ากันครับ? แต่ละแบบมีสิ่งอำนวยความสะดวกอะไรบ้าง มีไมโครเวฟกับอ่างอาบน้ำให้ไหมครับ แล้วเตียงเสริมคิดเงินยังไง",
  },
  {
    turn: 3,
    name: "Multi-part Detailed Policy Questions (ถามคำถามหลายคำถาม อาหารเช้า ที่จอดรถ สุนัข เช็คอิน)",
    message: "เข้าใจแล้วครับ ถ้างั้นถามหน่อยว่าราคานี้รวมอาหารเช้าหรือยัง อาหารเช้าเป็นแบบไหนครับ ที่จอดรถปลอดภัยไหม นำสุนัขตัวเล็กเข้าพักด้วยได้ไหม และเช็คอินกี่โมงครับ",
  },
  {
    turn: 4,
    name: "Multiple Room Booking & Admin Handoff Request (จองห้องหลายประเภทและขอคุยกับเจ้าหน้าที่)",
    message: "โอเคครับ เสียดายนำสุนัขมาไม่ได้ เดี๋ยวฝากญาติเลี้ยงแทนละกันครับ ตกลงผมอยากจองทั้งบ้านพัก Nan Riverfront Family Villa 1 หลัง และห้อง Grand Teak Suite อีก 1 ห้องครับ พักวันที่ 27-29 พฤษภาคมนี้ รวมทั้งหมดพัก 6 คน รบกวนรวมค่าใช้จ่ายทั้งหมดให้หน่อย แล้วขอติดต่อเจ้าหน้าที่หรือแอดมินคนจริงเพื่อขอยืนยันการจองเลยครับ เบอร์โทรผม 085-1234567 ชื่อ นที ครับ",
  },
];

interface LongTestSuccessResult {
  turn: number;
  name: string;
  message: string;
  reply: string;
  intent: string;
  provider: string | null;
  model: string | null;
  handoffRequired: boolean;
  entities: Record<string, unknown>;
  memoryState: unknown;
  error?: never;
}

interface LongTestErrorResult {
  turn: number;
  name: string;
  message: string;
  error: string;
  reply?: never;
  intent?: never;
  provider?: never;
  model?: never;
  handoffRequired?: never;
  entities?: never;
  memoryState?: never;
}

type LongTestResult = LongTestSuccessResult | LongTestErrorResult;

async function runLongConversationTest() {
  console.log(`Starting long conversation test for user: ${lineUserId}`);

  // 1. Upsert initial session
  console.log("Initializing LINE session...");
  const session = await lineRepository.upsertLineSession(hotelId, lineUserId, "Test User");
  console.log(`Session initialized. ID: ${session.id}`);

  const results: LongTestResult[] = [];

  for (const step of turns) {
    console.log(`\n--- Running Turn ${step.turn}: ${step.name} ---`);
    console.log(`User: ${step.message}`);

    try {
      // 2. Generate AI reply using orchestrator (this loads context, performs RAG, routes intents/entities)
      const result = await generateHospiqReply({
        hotelId,
        lineUserId,
        lineSessionId: session.id,
        message: step.message,
      });

      console.log(`AI: ${result.reply}`);
      console.log(`Intent: ${result.intent}`);
      console.log(`Entities: ${JSON.stringify(result.entities)}`);

      // 3. Update session memory (simulating webhook updates)
      await lineRepository.updateLineSession({
        hotelId,
        lineSessionId: session.id,
        status: result.handoffRequired ? "handoff" : "open",
        lastIntent: result.intent,
        memory: result.memoryUpdate,
      });

      // 4. Upsert booking lead if lead entities exist
      const entities = result.entities;
      const hasLeadData = Boolean(
        entities.checkIn ||
          entities.checkOut ||
          entities.guests ||
          entities.guestName ||
          entities.phone ||
          entities.roomTypeName
      );

      if (hasLeadData) {
        console.log("Upserting booking lead data...");
        await bookingService.upsertLineAiBookingLead(hotelId, {
          lineSessionId: session.id,
          lineUserId,
          guestName: entities.guestName,
          guestPhone: entities.phone,
          checkinDate: entities.checkIn,
          checkoutDate: entities.checkOut,
          guestCount: entities.guests,
          conversationSummary: result.reply || undefined,
          aiSummary: JSON.stringify({
            intent: result.intent,
            language: result.language,
            roomTypeName: entities.roomTypeName,
            leadScore: entities.leadScore,
          }),
        });
      }

      results.push({
        turn: step.turn,
        name: step.name,
        message: step.message,
        reply: result.reply,
        intent: result.intent,
        provider: result.aiProvider,
        model: result.aiModel,
        handoffRequired: result.handoffRequired,
        entities: result.entities as Record<string, unknown>,
        memoryState: result.memoryUpdate,
      });

    } catch (error: unknown) {
      console.error(`Error in Turn ${step.turn}:`, error);
      const errMsg = error instanceof Error ? error.message : String(error);
      results.push({
        turn: step.turn,
        name: step.name,
        message: step.message,
        error: errMsg,
      });
      break; // stop conversation on error
    }
  }

  // 5. Generate Markdown Report
  let md = `# Long Conversation Multi-Turn Test Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString("th-TH")}\n`;
  md += `**Hotel ID:** \`${hotelId}\` (Hospiq Handtest Hotel)\n`;
  md += `**LINE User ID:** \`${lineUserId}\`\n`;
  md += `**LINE Session ID:** \`${session.id}\`\n\n`;

  md += `## Turn-by-Turn Timeline\n\n`;

  for (const r of results) {
    md += `### Turn ${r.turn}: ${r.name}\n\n`;
    md += `**💬 User Message:**\n`;
    md += `> ${r.message}\n\n`;

    if (r.error) {
      md += `**❌ Error:**\n`;
      md += `\`\`\`txt\n${r.error}\n\`\`\`\n\n`;
    } else {
      md += `**🤖 AI Reply:**\n`;
      md += `\`\`\`txt\n${r.reply}\n\`\`\`\n\n`;
      md += `**Metadata:**\n`;
      md += `- **Intent:** \`${r.intent}\`\n`;
      md += `- **Handoff:** \`${r.handoffRequired ? "Yes" : "No"}\`\n`;
      md += `- **AI Provider / Model:** \`${r.provider}\` / \`${r.model}\`\n`;
      md += `- **Extracted Entities:** \`${JSON.stringify(r.entities)}\`\n`;
      md += `- **Post-Turn Memory State:**\n`;
      md += `  \`\`\`json\n${JSON.stringify(r.memoryState, null, 2)}\n  \`\`\`\n\n`;
    }
    md += `\n---\n\n`;
  }

  const outputFilePath = join(process.cwd(), "docs", "long-conversation-test-results.md");
  writeFileSync(outputFilePath, md, "utf8");
  console.log(`\nLong conversation test report saved to: ${outputFilePath}`);
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

runLongConversationTest().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});
