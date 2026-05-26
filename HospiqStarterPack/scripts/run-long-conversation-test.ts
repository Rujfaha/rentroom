import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateHospiqReply } from "../src/lib/ai/orchestrator";
import { lineRepository } from "../src/server/repositories/line.repository";
import { bookingService } from "../src/server/services/booking.service";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";

loadEnv(".env.local");

const hotelId = "12af7b54-d63d-4525-9c7a-429726241f49"; // hospiq-handtest-hotel
const lineUserId = `long-test-user-${Date.now()}`;

const turns = [
  {
    turn: 1,
    name: "Greeting (เริ่มต้นทักทาย)",
    message: "สวัสดีครับ",
  },
  {
    turn: 2,
    name: "Inquiry with Dates & Guests (ระบุวันและผู้เข้าพัก)",
    message: "จะไปพัก 3 คน วันที่ 1-3 มิถุนายนนี้ แนะนำห้องไหนดี ราคาเท่าไหร่บ้างครับ",
  },
  {
    turn: 3,
    name: "Multi-part tough question (ถามคำถามยากๆ หลายคำถามใน 1 ที)",
    message: "ที่จอดรถปลอดภัยไหมครับ แล้วถ้าต้องการเตียงเสริมเพิ่มอีกเตียงคิดราคาเท่าไหร่ รวมทั้งหมดเป็นเท่าไหร่ และเช็คอินเช้ากว่าปกติได้ไหมครับ",
  },
  {
    turn: 4,
    name: "Lead Capture / Booking Ready (ยืนยันจองพร้อมให้ข้อมูล)",
    message: "โอเคครับ จองห้อง Family Twin เลยครับ พัก 3 คน วันที่ 1-3 มิ.ย. นี้ ชื่อ พงศกร เบอร์ 0998887777",
  },
];

async function runLongConversationTest() {
  console.log(`Starting long conversation test for user: ${lineUserId}`);
  const supabase = createSupabaseAdminClient();

  // 1. Upsert initial session
  console.log("Initializing LINE session...");
  const session = await lineRepository.upsertLineSession(hotelId, lineUserId, "Test User");
  console.log(`Session initialized. ID: ${session.id}`);

  const results: any[] = [];

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
        entities: result.entities,
        memoryState: result.memoryUpdate,
      });

    } catch (error: any) {
      console.error(`Error in Turn ${step.turn}:`, error);
      results.push({
        turn: step.turn,
        name: step.name,
        message: step.message,
        error: error.message || error,
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
