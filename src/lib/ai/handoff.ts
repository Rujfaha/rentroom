import type { LineHandoffReason, LineHandoffRequest } from "@/types/line-ai.types";

const HANDOFF_PATTERNS: Array<{ reason: LineHandoffReason; priority: LineHandoffRequest["priority"]; pattern: RegExp }> = [
  { reason: "payment_issue", priority: "high", pattern: /(โอนแล้ว|โอนเงินแล้ว|สลิปมีปัญหา|จ่ายแล้ว|payment issue|paid already|transfer problem|付款.*问题|支払.*問題|pago.*problema|دفعت|مشكلة.*دفع)/i },
  { reason: "refund", priority: "high", pattern: /(refund|คืนเงิน|ขอเงินคืน|返金|退款|reembolso|استرداد)/i },
  { reason: "complaint", priority: "high", pattern: /(complaint|ร้องเรียน|ไม่พอใจ|แย่มาก|投诉|苦情|queja|شكوى)/i },
  { reason: "cancellation", priority: "normal", pattern: /(cancel|cancellation|ยกเลิก|取消|キャンセル|cancelar|إلغاء)/i },
  { reason: "special_approval", priority: "normal", pattern: /(ขอส่วนลดพิเศษ|ลดเพิ่ม|special price|special approval|late checkout|early checkin|特殊|特別|precio especial|سعر خاص)/i },
  { reason: "group_booking", priority: "normal", pattern: /(กรุ๊ป|หมู่คณะ|หลายห้อง|group booking|many rooms|团体|団体|grupo|مجموعة)/i },
  { reason: "booking_ready", priority: "normal", pattern: /(พร้อมจอง|เอาห้องนี้|confirm booking|ready to book|book this|จองเลย|预订这个|予約したい|reservar ahora|احجز)/i },
];

export function detectLineHandoff(message: string): LineHandoffRequest | null {
  const match = HANDOFF_PATTERNS.find((entry) => entry.pattern.test(message));
  if (!match) return null;
  return {
    required: true,
    reason: match.reason,
    priority: match.priority,
  };
}
