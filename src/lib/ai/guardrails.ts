export interface PrivacyGuardrailResult {
  reason: "guest_privacy";
  safeAnswer: string;
}

export interface AiAnswerValidationInput {
  answer: string;
  hasAvailabilityData: boolean;
  privacyRestricted: boolean;
}

export interface AiAnswerValidationResult {
  allowed: boolean;
  reason?: string;
  safeAnswer?: string;
}

export const PRIVACY_SAFE_ANSWER =
  "ขออภัยครับ ข้อมูลของลูกค้าท่านอื่นเป็นข้อมูลส่วนตัว ทางโรงแรมไม่สามารถเปิดเผยได้ครับ\n\nหากต้องการสอบถามข้อมูลการจองของคุณเอง สามารถแจ้งข้อมูลอ้างอิงการจองให้เจ้าหน้าที่ตรวจสอบได้ครับ";

export const UNCONFIRMED_AVAILABILITY_SAFE_ANSWER =
  "ผมช่วยรับเรื่องจองให้ได้ครับ แต่ตอนนี้ยังไม่สามารถยืนยันห้องว่างได้ทันที ต้องให้เจ้าหน้าที่ตรวจสอบอีกครั้งครับ\n\nขอทราบชื่อผู้จอง เบอร์โทร/LINE วันที่เช็กอิน วันที่เช็กเอาต์ และจำนวนผู้เข้าพักได้ไหมครับ";

const PRIVACY_PATTERNS = [
  /ลูกค้าคนอื่น/i,
  /แขกคนอื่น/i,
  /ใคร(?:เข้า)?พัก/i,
  /ใครจอง/i,
  /ห้อง\s*\d{2,4}\s*(?:มีใคร|ใคร|พัก)/i,
  /เบอร์ลูกค้า/i,
  /ชื่อคนจอง/i,
  /ข้อมูลลูกค้า/i,
  /ประวัติการจอง/i,
  /guest.*(name|phone|room|booking)/i,
  /who.*(?:stay|staying|booked)/i,
];

const FORBIDDEN_AVAILABILITY_CLAIMS = [
  "มีห้องว่าง",
  "ว่างครับ",
  "ว่างค่ะ",
  "จองได้เลย",
  "ยืนยันการจอง",
  "confirmed",
  "available",
];

export function detectPrivacyRestrictedQuestion(message: string): PrivacyGuardrailResult | null {
  if (!PRIVACY_PATTERNS.some((pattern) => pattern.test(message))) return null;
  return {
    reason: "guest_privacy",
    safeAnswer: PRIVACY_SAFE_ANSWER,
  };
}

export function validateAiAnswer(input: AiAnswerValidationInput): AiAnswerValidationResult {
  if (input.privacyRestricted) {
    return {
      allowed: false,
      reason: "privacy_restricted",
      safeAnswer: PRIVACY_SAFE_ANSWER,
    };
  }

  const answer = input.answer.toLowerCase();
  if (!input.hasAvailabilityData && FORBIDDEN_AVAILABILITY_CLAIMS.some((claim) => answer.includes(claim.toLowerCase()))) {
    return {
      allowed: false,
      reason: "availability_claim_without_data",
      safeAnswer: UNCONFIRMED_AVAILABILITY_SAFE_ANSWER,
    };
  }

  return { allowed: true };
}
