import type { AvailabilityRequest, HotelContext, LineConversationMemory, LineIntent } from "@/types/line-ai.types";
import { detectLineHandoff } from "./handoff";

interface DeterministicReplyInput {
  intent: LineIntent;
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
}

export function detectLineIntent(message: string): LineIntent {
  const intents = detectLineIntents(message);
  if (intents.includes("availability") && intents.includes("payment")) return "availability_payment";
  
  // For backward compatibility, return the first base intent if available
  const baseIntents: LineIntent[] = ["availability", "payment", "price", "promotion", "contact", "booking", "handoff"];
  const matchedBase = intents.find((i) => baseIntents.includes(i));
  return matchedBase ?? intents[0] ?? "general";
}

export function detectLineIntents(message: string): LineIntent[] {
  const text = message.toLowerCase();
  const intents: LineIntent[] = [];
  
  if (detectLineHandoff(message)) intents.push("handoff");

  // 1. Group booking (10+ people or keywords)
  if (/(1\d|[2-9]\d|\d{3,})\s*(คน|ท่าน)|(กรุ๊ป|หมู่คณะ|หลายคน|มาเป็นกลุ่ม|ทัวร์|บริษัท|group booking)/i.test(text)) {
    intents.push("group_booking");
  }

  // 2. Cheapest room
  if (/(ถูกที่สุด|ถูกสุด|ราคาถูก|ประหยัดสุด|cheapest|lowest price)/i.test(text)) {
    intents.push("cheapest_room");
  }

  // 3. Room recommendation
  if (/(ห้องไหนดี|แนะนำห้อง|ที่ไหนสวยสุด|ห้องไหนสวยสุด|วิวดี|ถ่ายรูปสวย|ไม่ชอบบ้านไม้|ไม่ชอบแบบบ้านไม้)/i.test(text)) {
    intents.push("room_recommendation");
  }

  // 4. Amenities question
  if (/(สิ่งอำนวยความสะดวก|มีอะไรบ้าง|facility|amenities|ของใช้|อุปกรณ์)/i.test(text)) {
    intents.push("amenities_question");
  }

  // 5. Availability check
  if (/(ว่างไหม|ว่างวันไหน|มีห้องไหม|เช็กห้อง|เช็คห้อง)/i.test(text)) {
    intents.push("availability_check");
  }

  // 6. Price inquiry
  if (/(ราคา|เท่าไหร่|กี่บาท|เรท|rate|price|budget|价格|料金|precio|سعر)/i.test(text)) {
    intents.push("price_inquiry");
  }

  // 7. Room detail
  if (/(รายละเอียด|ข้อมูลเพิ่มเติม|สนใจ|ห้อง|house|warmly|honeymoon|slowly|forest)/i.test(text)) {
    intents.push("room_detail");
  }

  // 8. Booking intent
  if (/(จอง|จองห้อง|booking|book|reserve|reservation|เอาห้อง|สนใจ|预订|予約|reservar|reserva|حجز)/i.test(text)) {
    intents.push("booking_intent");
  }

  // Map to traditional base intents for compatibility
  if (hasAvailabilityIntent(text) || intents.includes("availability_check")) {
    intents.push("availability");
  }
  if (intents.includes("price_inquiry") || intents.includes("cheapest_room")) {
    intents.push("price");
  }
  if (/(โปร|โปรโมชั่น|ส่วนลด|ลดราคา|promotion|discount|deal|offer|优惠|割引|promoción|descuento|عرض|خصม)/i.test(text)) {
    intents.push("promotion");
  }
  if (/(ชำระ|จ่าย|โอน|พร้อมเพย์|promptpay|สลิป|บัญชี|payment|pay|transfer|slip|付款|支付|支払い|pagar|pago|دفع|تحويل)/i.test(text)) {
    intents.push("payment");
  }
  if (/(ติดต่อ|เบอร์|โทร|line|แผนที่|อยู่ที่ไหน|ที่อยู่|location|contact|phone|call|map|address|联系|電話|連絡|contacto|teléfono|اتصال|هاتف|عنوان)/i.test(text)) {
    intents.push("contact");
  }
  if (intents.includes("booking_intent") || intents.includes("group_booking")) {
    intents.push("booking");
  }

  const uniqueIntents = Array.from(new Set(intents));
  return uniqueIntents.length ? uniqueIntents : ["general"];
}

function hasAvailabilityIntent(text: string): boolean {
  const availabilityWords =
    /(ว่าง|ห้องว่าง|เข้าพัก|เช็คอิน|เช็กอิน|check.?in|check.?out|available|availability|room|stay|tomorrow|tonight|有没有|空房|部屋|空室|habitación|disponible|غرفة|متاح|พรุ่งนี้|มะรืน|วันนี้)/i;
  if (availabilityWords.test(text)) return true;

  const hasGuestCount = /\d{1,2}\s*(คน|ท่าน)\b/.test(text);
  const hasStayWord = /(ห้อง|พัก|จอง|คืน|เข้าพัก|เช็คอิน|เช็กอิน)/.test(text);
  return hasGuestCount && hasStayWord;
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
    ? `ชำระผ่าน PromptPay/โอนเงินได้ค่ะ${context.payment.accountName ? ` ชื่อบัญชี ${context.payment.accountName}` : ""}`
    : "ชำระผ่านการโอนเงินตามขั้นตอนในหน้าจองได้ค่ะ";

  const lines = [
    methods,
    "หลังชำระเงินแล้วให้อัปโหลดสลิปในหน้าจอง เพื่อให้ทีมงานตรวจสอบและยืนยันการจองค่ะ",
    "ถ้าโอนแล้วแต่ลืมอัปโหลดสลิป ให้กลับไปอัปโหลดในหน้าจอง หรือแจ้งทีมงานพร้อมชื่อ/เบอร์ที่ใช้จองเพื่อช่วยตรวจสอบค่ะ",
  ];

  if (includeBookingUrl) lines.push(`เริ่มจองได้ที่ ${bookingUrl}`);
  return lines.join("\n");
}

function buildAvailabilityReply(context: HotelContext, bookingUrl: string): string | null {
  if (!context.availability) return null;

  const { request, roomTypes } = context.availability;
  if (!roomTypes.length) {
    return `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${request.guests ? ` สำหรับ ${request.guests} ท่าน` : ""} ตอนนี้ยังไม่พบห้องว่างจากระบบค่ะ`;
  }

  const roomLines = roomTypes
    .slice(0, 5)
    .map((roomType) => `- ${roomType.name}: ว่าง ${roomType.availableRooms} ห้อง เริ่มต้น ${formatCurrency(roomType.basePrice)} บาท/คืน`);
  return [
    `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${request.guests ? ` สำหรับ ${request.guests} ท่าน` : ""} มีตัวเลือกดังนี้ค่ะ`,
    ...roomLines,
    `จองต่อได้ที่ ${bookingUrl}`,
  ].join("\n");
}

function buildPriceReply(context: HotelContext, bookingUrl: string): string {
  if (!context.roomTypes.length) return `ตอนนี้ยังไม่มีข้อมูลราคาห้องในระบบค่ะ ดูรายละเอียดเพิ่มเติมได้ที่ ${bookingUrl}`;

  const roomLines = context.roomTypes
    .slice(0, 5)
    .map((roomType) => `- ${roomType.name}: เริ่มต้น ${formatCurrency(roomType.basePrice)} บาท/คืน รองรับ ${roomType.maxGuests} ท่าน`);

  return [`ราคาห้องพักเริ่มต้นมีดังนี้ค่ะ`, ...roomLines, `ยอดรวมจริงขึ้นกับวันที่เข้าพักและโปรโมชัน ดู/จองได้ที่ ${bookingUrl}`].join("\n");
}

function buildPromotionReply(context: HotelContext): string {
  if (!context.promotions.length) return "ตอนนี้ยังไม่พบโปรโมชั่นที่เปิดใช้งานในระบบค่ะ";
  return ["โปรโมชั่นที่มีตอนนี้ค่ะ", ...context.promotions.map((promo) => `- ${promo.title}${promo.discountText ? ` (${promo.discountText})` : ""}`)].join("\n");
}

function buildContactReply(context: HotelContext): string {
  const lines = [
    context.phone ? `โทร: ${context.phone}` : null,
    context.email ? `อีเมล: ${context.email}` : null,
    context.address ? `ที่อยู่: ${context.address}` : null,
    ...context.contacts.map((contact) => `${contact.label || contact.type}: ${contact.value}`),
  ].filter((line): line is string => Boolean(line));

  return lines.length ? lines.join("\n") : "ตอนนี้ยังไม่มีข้อมูลติดต่อในระบบค่ะ";
}

function buildBookingReply(bookingUrl: string, memory: LineConversationMemory): string {
  const lead = memory.bookingLead;
  const summary = lead?.checkIn && lead.checkOut ? `วันที่ ${lead.checkIn} ถึง ${lead.checkOut}${lead.guests ? ` สำหรับ ${lead.guests} ท่าน` : ""}` : null;
  return [summary ? `ได้ค่ะ สรุปข้อมูลที่มีตอนนี้: ${summary}` : "ได้ค่ะ สามารถเริ่มจองผ่านหน้าเว็บได้เลย", `ลิงก์จอง: ${bookingUrl}`].join("\n");
}

function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}
