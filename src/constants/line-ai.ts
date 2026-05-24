export const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply";

export const DEFAULT_AI_PROVIDER = "gemini";
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
export const LINE_TEXT_LIMIT = 1900;

export const LINE_AI_FALLBACK_REPLY =
  "ขออภัยครับ ตอนนี้ระบบผู้ช่วยอัตโนมัติขัดข้องชั่วคราว กรุณาฝากคำถามไว้ แล้วทีมงานจะรีบติดต่อกลับครับ";

export const LINE_UNSUPPORTED_MESSAGE_REPLY =
  "ตอนนี้ระบบอัตโนมัติรองรับข้อความตัวอักษรก่อนครับ กรุณาพิมพ์คำถามหรือรายละเอียดที่ต้องการจองได้เลย";

export const BLOCKING_BOOKING_STATUSES = ["pending", "confirmed", "checked_in"] as const;
