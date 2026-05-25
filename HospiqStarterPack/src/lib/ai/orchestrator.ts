import type { GenerateHospiqReplyInput, GenerateHospiqReplyResult } from "./types";
import { enforceFemalePoliteThaiTone, preventCrossHotelLeak } from "./response-guard";

export async function generateHospiqReply(input: GenerateHospiqReplyInput): Promise<GenerateHospiqReplyResult> {
  const draftReply = "ขอบคุณค่ะ Hospiq กำลังตรวจสอบข้อมูลจากที่พักให้ค่ะ";
  const toneSafe = enforceFemalePoliteThaiTone(draftReply);
  const leakSafe = preventCrossHotelLeak(toneSafe, input.hotelId);

  return {
    reply: leakSafe.response,
    intent: "general",
    aiResponseSource: leakSafe.allowed ? "starter_orchestrator" : "guardrail",
  };
}
