import type { HotelContext, LineConversationMemory, LineHandoffRequest, LineIntent, SupportedLineLanguage } from "@/types/line-ai.types";

interface ComposeLineReplyInput {
  language: SupportedLineLanguage;
  intents: LineIntent[];
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
  handoff?: LineHandoffRequest | null;
}

const EMOJI = "😊";

export function composeLineReply(input: ComposeLineReplyInput): string | null {
  const intents = normalizeIntents(input.intents);
  const parts = [
    input.handoff?.required ? handoffSection(input.language, input.handoff) : null,
    intents.includes("availability") ? availabilitySection(input.context, input.bookingUrl, input.language) : null,
    intents.includes("price") && !input.context.availability ? priceSection(input.context, input.bookingUrl, input.language) : null,
    intents.includes("promotion") ? promotionSection(input.context, input.language) : null,
    intents.includes("payment") ? paymentSection(input.context, input.bookingUrl, input.language, !intents.includes("availability")) : null,
    intents.includes("contact") ? contactSection(input.context, input.language) : null,
    intents.includes("booking") && !intents.includes("availability") ? bookingSection(input.bookingUrl, input.memory, input.language) : null,
  ].filter((part): part is string => Boolean(part));

  if (!parts.length) return null;
  return `${opener(input.language)} ${EMOJI}\n${parts.join("\n\n")}`;
}

function handoffSection(language: SupportedLineLanguage, handoff: LineHandoffRequest): string {
  const reason = handoff.reason.replaceAll("_", " ");
  return text(language, "handoff", { reason });
}

function normalizeIntents(intents: LineIntent[]): LineIntent[] {
  const expanded = intents.flatMap((intent) => (intent === "availability_payment" ? (["availability", "payment"] as LineIntent[]) : [intent]));
  return Array.from(new Set(expanded.filter((intent) => intent !== "general")));
}

function availabilitySection(context: HotelContext, bookingUrl: string, language: SupportedLineLanguage): string | null {
  if (!context.availability) return null;
  const { request, roomTypes } = context.availability;
  const dateText = `${request.checkIn} - ${request.checkOut}${request.guests ? guestText(language, request.guests) : ""}`;
  if (!roomTypes.length) return text(language, "noAvailability", { dateText });

  const roomLines = roomTypes
    .slice(0, 5)
    .map((room) => `- ${room.name}: ${availableWord(language)} ${room.availableRooms}, ${fromWord(language)} ${formatCurrency(room.basePrice)}`);

  return [text(language, "availability", { dateText }), ...roomLines, text(language, "bookingUrl", { bookingUrl })].join("\n");
}

function priceSection(context: HotelContext, bookingUrl: string, language: SupportedLineLanguage): string {
  if (!context.roomTypes.length) return text(language, "noPrice", { bookingUrl });
  const roomLines = context.roomTypes
    .slice(0, 5)
    .map((room) => `- ${room.name}: ${fromWord(language)} ${formatCurrency(room.basePrice)}, ${capacityWord(language)} ${room.maxGuests}`);
  return [text(language, "price"), ...roomLines, text(language, "bookingUrl", { bookingUrl })].join("\n");
}

function promotionSection(context: HotelContext, language: SupportedLineLanguage): string {
  if (!context.promotions.length) return text(language, "noPromo");
  return [text(language, "promo"), ...context.promotions.map((promo) => `- ${promo.title}${promo.discountText ? ` (${promo.discountText})` : ""}`)].join("\n");
}

function paymentSection(context: HotelContext, bookingUrl: string, language: SupportedLineLanguage, includeBookingUrl: boolean): string {
  const payment = context.payment.promptPayConfigured
    ? text(language, "paymentPromptPay", { accountName: context.payment.accountName ? ` ${context.payment.accountName}` : "" })
    : text(language, "paymentGeneric");
  const lines = [payment, text(language, "slip")];
  if (includeBookingUrl) lines.push(text(language, "bookingUrl", { bookingUrl }));
  return lines.join("\n");
}

function contactSection(context: HotelContext, language: SupportedLineLanguage): string {
  const lines = [
    context.phone ? `${text(language, "phone")}: ${context.phone}` : null,
    context.email ? `${text(language, "email")}: ${context.email}` : null,
    context.address ? `${text(language, "address")}: ${context.address}` : null,
    ...context.contacts.map((contact) => `${contact.label || contact.type}: ${contact.value}`),
  ].filter((line): line is string => Boolean(line));
  return lines.length ? lines.join("\n") : text(language, "noContact");
}

function bookingSection(bookingUrl: string, memory: LineConversationMemory, language: SupportedLineLanguage): string {
  const lead = memory.bookingLead;
  const summary = lead?.checkIn && lead.checkOut ? `${lead.checkIn} - ${lead.checkOut}${lead.guests ? guestText(language, lead.guests) : ""}` : null;
  return [summary ? text(language, "bookingSummary", { dateText: summary }) : text(language, "bookingStart"), text(language, "bookingUrl", { bookingUrl })].join("\n");
}

function opener(language: SupportedLineLanguage): string {
  return {
    th: "ได้เลยครับ",
    en: "Sure",
    zh: "可以的",
    ja: "承知しました",
    es: "Claro",
    ar: "بالتأكيد",
  }[language];
}

function text(language: SupportedLineLanguage, key: string, values: Record<string, string> = {}): string {
  const templates: Record<SupportedLineLanguage, Record<string, string>> = {
    th: {
      availability: "ช่วง {dateText} มีตัวเลือกว่างดังนี้ครับ",
      noAvailability: "ช่วง {dateText} ตอนนี้ยังไม่พบห้องว่างจากระบบครับ",
      price: "ราคาเริ่มต้นของห้องมีดังนี้ครับ",
      noPrice: "ตอนนี้ยังไม่มีข้อมูลราคาในระบบครับ ดูต่อได้ที่ {bookingUrl}",
      promo: "โปรโมชันที่มีตอนนี้ครับ",
      noPromo: "ตอนนี้ยังไม่พบโปรโมชันที่เปิดใช้งานครับ",
      paymentPromptPay: "ชำระผ่าน PromptPay/โอนเงินได้ครับ ชื่อบัญชี{accountName}",
      paymentGeneric: "ชำระผ่านการโอนเงินตามขั้นตอนในหน้าจองได้ครับ",
      slip: "หลังชำระเงินแล้วให้อัปโหลดสลิปในหน้าจองเพื่อให้ทีมงานตรวจสอบและยืนยันการจองครับ",
      bookingUrl: "จองต่อได้ที่ {bookingUrl}",
      phone: "โทร",
      email: "อีเมล",
      address: "ที่อยู่",
      noContact: "ตอนนี้ยังไม่มีข้อมูลติดต่อในระบบครับ",
      bookingSummary: "ข้อมูลจองที่จำไว้: {dateText}",
      bookingStart: "เริ่มจองผ่านหน้าเว็บได้เลยครับ",
      handoff: "เคสนี้ผมส่งต่อให้ทีมงานช่วยตรวจสอบให้นะครับ ({reason}) รบกวนแจ้งชื่อ/เบอร์ที่ใช้จอง และรายละเอียดสั้น ๆ เพิ่มได้เลยครับ",
    },
    en: {
      availability: "Available options for {dateText}:",
      noAvailability: "I couldn't find available rooms for {dateText} in the system.",
      price: "Starting room prices:",
      noPrice: "Room pricing is not available yet. You can check here: {bookingUrl}",
      promo: "Current promotions:",
      noPromo: "No active promotions are listed right now.",
      paymentPromptPay: "You can pay by PromptPay/bank transfer. Account name:{accountName}",
      paymentGeneric: "You can pay by bank transfer through the booking page.",
      slip: "After payment, please upload the slip on the booking page so the team can verify and confirm the booking.",
      bookingUrl: "Continue booking here: {bookingUrl}",
      phone: "Phone",
      email: "Email",
      address: "Address",
      noContact: "Contact details are not available in the system yet.",
      bookingSummary: "Saved booking details: {dateText}",
      bookingStart: "You can start booking on the website.",
      handoff: "I'll pass this to the team to review ({reason}). Please send the booking name/phone number and a short detail.",
    },
    zh: {
      availability: "{dateText} 可预订的房型：",
      noAvailability: "系统暂时没有找到 {dateText} 的空房。",
      price: "房价起价如下：",
      noPrice: "系统暂时没有房价资料，可在这里查看：{bookingUrl}",
      promo: "当前优惠：",
      noPromo: "目前系统没有启用中的优惠。",
      paymentPromptPay: "可以通过 PromptPay/银行转账付款。账户名:{accountName}",
      paymentGeneric: "可以在预订页面按步骤银行转账付款。",
      slip: "付款后请在预订页面上传付款凭证，团队会检查并确认预订。",
      bookingUrl: "继续预订：{bookingUrl}",
      phone: "电话",
      email: "邮箱",
      address: "地址",
      noContact: "系统暂时没有联系方式。",
      bookingSummary: "已记录的预订信息：{dateText}",
      bookingStart: "可以从网站开始预订。",
      handoff: "我会转给工作人员协助处理（{reason}）。请提供预订姓名/电话和简短说明。",
    },
    ja: {
      availability: "{dateText} の空室候補はこちらです：",
      noAvailability: "{dateText} はシステム上、空室が見つかりませんでした。",
      price: "客室の開始料金はこちらです：",
      noPrice: "料金情報はまだありません。こちらで確認できます：{bookingUrl}",
      promo: "現在のプロモーション：",
      noPromo: "現在有効なプロモーションはありません。",
      paymentPromptPay: "PromptPay/銀行振込でお支払いできます。口座名:{accountName}",
      paymentGeneric: "予約ページの手順に沿って銀行振込でお支払いできます。",
      slip: "支払い後、予約ページで明細をアップロードしてください。スタッフが確認後、予約を確定します。",
      bookingUrl: "予約はこちら：{bookingUrl}",
      phone: "電話",
      email: "メール",
      address: "住所",
      noContact: "連絡先情報はまだ登録されていません。",
      bookingSummary: "記録中の予約情報：{dateText}",
      bookingStart: "ウェブサイトから予約を開始できます。",
      handoff: "スタッフに確認を引き継ぎます（{reason}）。予約名/電話番号と簡単な詳細を送ってください。",
    },
    es: {
      availability: "Opciones disponibles para {dateText}:",
      noAvailability: "No encontré habitaciones disponibles para {dateText} en el sistema.",
      price: "Precios desde:",
      noPrice: "Aún no hay precios en el sistema. Puedes revisar aquí: {bookingUrl}",
      promo: "Promociones actuales:",
      noPromo: "Ahora mismo no hay promociones activas.",
      paymentPromptPay: "Puedes pagar por PromptPay/transferencia bancaria. Nombre de la cuenta:{accountName}",
      paymentGeneric: "Puedes pagar por transferencia bancaria desde la página de reserva.",
      slip: "Después del pago, sube el comprobante en la página de reserva para que el equipo lo revise y confirme.",
      bookingUrl: "Continúa la reserva aquí: {bookingUrl}",
      phone: "Teléfono",
      email: "Email",
      address: "Dirección",
      noContact: "Aún no hay datos de contacto en el sistema.",
      bookingSummary: "Datos guardados de la reserva: {dateText}",
      bookingStart: "Puedes empezar la reserva en la web.",
      handoff: "Voy a pasar este caso al equipo para revisarlo ({reason}). Envíanos el nombre/teléfono de la reserva y un breve detalle.",
    },
    ar: {
      availability: "الخيارات المتاحة لـ {dateText}:",
      noAvailability: "لم أجد غرفا متاحة لـ {dateText} في النظام.",
      price: "أسعار الغرف تبدأ من:",
      noPrice: "لا توجد أسعار في النظام حاليا. يمكنك التحقق هنا: {bookingUrl}",
      promo: "العروض الحالية:",
      noPromo: "لا توجد عروض نشطة حاليا.",
      paymentPromptPay: "يمكنك الدفع عبر PromptPay/تحويل بنكي. اسم الحساب:{accountName}",
      paymentGeneric: "يمكنك الدفع عبر التحويل البنكي من صفحة الحجز.",
      slip: "بعد الدفع، يرجى رفع إيصال التحويل في صفحة الحجز ليتمكن الفريق من المراجعة والتأكيد.",
      bookingUrl: "أكمل الحجز هنا: {bookingUrl}",
      phone: "الهاتف",
      email: "البريد",
      address: "العنوان",
      noContact: "لا توجد بيانات تواصل في النظام حاليا.",
      bookingSummary: "تفاصيل الحجز المحفوظة: {dateText}",
      bookingStart: "يمكنك بدء الحجز من الموقع.",
      handoff: "سأحوّل هذه الحالة إلى الفريق للمراجعة ({reason}). يرجى إرسال اسم/هاتف الحجز وتفاصيل قصيرة.",
    },
  };
  return Object.entries(values).reduce((line, [keyName, value]) => line.replaceAll(`{${keyName}}`, value), templates[language][key] ?? templates.th[key] ?? key);
}

function guestText(language: SupportedLineLanguage, guests: number): string {
  return {
    th: ` สำหรับ ${guests} ท่าน`,
    en: ` for ${guests} guest${guests > 1 ? "s" : ""}`,
    zh: `，${guests} 位客人`,
    ja: `、${guests}名様`,
    es: ` para ${guests} persona${guests > 1 ? "s" : ""}`,
    ar: ` لعدد ${guests} ضيف`,
  }[language];
}

function availableWord(language: SupportedLineLanguage): string {
  return { th: "ว่าง", en: "available", zh: "可订", ja: "空室", es: "disponible", ar: "متاح" }[language];
}

function fromWord(language: SupportedLineLanguage): string {
  return { th: "เริ่มต้น", en: "from", zh: "起价", ja: "開始", es: "desde", ar: "من" }[language];
}

function capacityWord(language: SupportedLineLanguage): string {
  return { th: "รองรับ", en: "up to", zh: "最多", ja: "定員", es: "hasta", ar: "حتى" }[language];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}
