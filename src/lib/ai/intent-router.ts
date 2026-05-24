import type { AvailabilityRequest, HotelContext, LineConversationMemory, LineIntent } from "@/types/line-ai.types";

interface DeterministicReplyInput {
  intent: LineIntent;
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
}

export function detectLineIntent(message: string): LineIntent {
  const text = message.toLowerCase();
  const hasPaymentIntent = /(ชำระ|จ่าย|โอน|พร้อมเพย์|promptpay|สลิป|บัญชี|payment)/i.test(text);
  const hasAvailabilityIntent = /(ว่าง|ห้องว่าง|เข้าพัก|เช็คอิน|เช็กอิน|check.?in|เช็คเอาต์|เช็กเอาต์|คืน|คน|ท่าน|พรุ่งนี้|มะรืน|วันนี้)/i.test(text);
  const hasPriceIntent = /(ราคา|เท่าไหร่|กี่บาท|เรท|rate|price|ถูกสุด|ถูกที่สุด|ประหยัด)/i.test(text);

  if (hasPaymentIntent && (hasAvailabilityIntent || hasPriceIntent)) return "availability_payment";
  if (hasAvailabilityIntent) return "availability";
  if (hasPriceIntent) return "price";
  if (hasPaymentIntent) return "payment";
  if (/(โปร|โปรโมชั่น|ส่วนลด|ลดราคา|promotion|discount)/i.test(text)) return "promotion";
  if (/(ติดต่อ|เบอร์|โทร|line|แผนที่|อยู่ที่ไหน|ที่อยู่|location|contact)/i.test(text)) return "contact";
  if (/(จอง|จองห้อง|booking|book|เอาห้อง|สนใจ)/i.test(text)) return "booking";
  return "general";
}

export function buildDeterministicReply(input: DeterministicReplyInput): string | null {
  switch (input.intent) {
    case "availability_payment":
      return buildAvailabilityPaymentReply(input.context, input.bookingUrl);
    case "payment":
      return buildPaymentReply(input.context, input.bookingUrl);
    case "price":
      return buildPriceReply(input.context, input.bookingUrl);
    case "promotion":
      return buildPromotionReply(input.context);
    case "contact":
      return buildContactReply(input.context);
    case "booking":
      return buildBookingReply(input.bookingUrl, input.memory);
    case "availability":
      return buildAvailabilityReply(input.context, input.bookingUrl);
    default:
      return null;
  }
}

function buildAvailabilityPaymentReply(context: HotelContext, bookingUrl: string): string | null {
  const availabilityReply = buildAvailabilityReply(context, bookingUrl);
  const paymentReply = buildPaymentReply(context, bookingUrl, false);

  if (!availabilityReply) return paymentReply;
  return [availabilityReply, paymentReply].join("\n\n");
}

export function mergeBookingLead(memory: LineConversationMemory, next: Partial<AvailabilityRequest>): LineConversationMemory {
  return {
    ...memory,
    bookingLead: {
      ...(memory.bookingLead ?? {}),
      ...next,
    },
  };
}

function buildPaymentReply(context: HotelContext, bookingUrl: string, includeBookingUrl = true): string {
  const methods = context.payment?.promptPayConfigured
    ? `ชำระผ่าน PromptPay/โอนเงินได้ครับ${context.payment.accountName ? ` ชื่อบัญชี ${context.payment.accountName}` : ""}`
    : "ชำระผ่านการโอนเงินตามขั้นตอนในหน้าจองได้ครับ";

  const lines = [
    methods,
    "หลังชำระเงินแล้วให้อัปโหลดสลิปในหน้าจอง เพื่อให้ทีมงานตรวจสอบและยืนยันการจองครับ",
    "ถ้าโอนแล้วแต่ลืมอัปโหลดสลิป ให้กลับไปอัปโหลดในหน้าจอง หรือแจ้งทีมงานพร้อมชื่อ/เบอร์ที่ใช้จองเพื่อช่วยตรวจสอบครับ",
  ];

  if (includeBookingUrl) lines.push(`เริ่มจองได้ที่ ${bookingUrl}`);
  return lines.join("\n");
}

function buildAvailabilityReply(context: HotelContext, bookingUrl: string): string | null {
  if (!context.availability) return null;

  const { request, roomTypes } = context.availability;
  if (!roomTypes.length) {
    return `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${request.guests ? ` สำหรับ ${request.guests} ท่าน` : ""} ตอนนี้ยังไม่พบห้องว่างจากระบบครับ`;
  }

  const roomLines = roomTypes
    .slice(0, 5)
    .map((roomType) => `- ${roomType.name}: ว่าง ${roomType.availableRooms} ห้อง เริ่มต้น ${formatCurrency(roomType.basePrice)} บาท/คืน`);
  return [
    `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${request.guests ? ` สำหรับ ${request.guests} ท่าน` : ""} มีตัวเลือกดังนี้ครับ`,
    ...roomLines,
    `จองต่อได้ที่ ${bookingUrl}`,
  ].join("\n");
}

function buildPriceReply(context: HotelContext, bookingUrl: string): string {
  if (!context.roomTypes.length) return `ตอนนี้ยังไม่มีข้อมูลราคาห้องในระบบครับ ดูรายละเอียดเพิ่มเติมได้ที่ ${bookingUrl}`;

  const roomLines = context.roomTypes
    .slice(0, 5)
    .map((roomType) => `- ${roomType.name}: เริ่มต้น ${formatCurrency(roomType.basePrice)} บาท/คืน รองรับ ${roomType.maxGuests} ท่าน`);

  return [`ราคาห้องพักเริ่มต้นมีดังนี้ครับ`, ...roomLines, `ยอดรวมจริงขึ้นกับวันที่เข้าพักและโปรโมชัน ดู/จองได้ที่ ${bookingUrl}`].join("\n");
}

function buildPromotionReply(context: HotelContext): string {
  if (!context.promotions.length) return "ตอนนี้ยังไม่พบโปรโมชั่นที่เปิดใช้งานในระบบครับ";
  return ["โปรโมชั่นที่มีตอนนี้ครับ", ...context.promotions.map((promo) => `- ${promo.title}${promo.discountText ? ` (${promo.discountText})` : ""}`)].join("\n");
}

function buildContactReply(context: HotelContext): string {
  const lines = [
    context.phone ? `โทร: ${context.phone}` : null,
    context.email ? `อีเมล: ${context.email}` : null,
    context.address ? `ที่อยู่: ${context.address}` : null,
    ...context.contacts.map((contact) => `${contact.label || contact.type}: ${contact.value}`),
  ].filter((line): line is string => Boolean(line));

  return lines.length ? lines.join("\n") : "ตอนนี้ยังไม่มีข้อมูลติดต่อในระบบครับ";
}

function buildBookingReply(bookingUrl: string, memory: LineConversationMemory): string {
  const lead = memory.bookingLead;
  const summary = lead?.checkIn && lead.checkOut ? `วันที่ ${lead.checkIn} ถึง ${lead.checkOut}${lead.guests ? ` สำหรับ ${lead.guests} ท่าน` : ""}` : null;
  return [summary ? `ได้ครับ สรุปข้อมูลที่มีตอนนี้: ${summary}` : "ได้ครับ สามารถเริ่มจองผ่านหน้าเว็บได้เลย", `ลิงก์จอง: ${bookingUrl}`].join("\n");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}
