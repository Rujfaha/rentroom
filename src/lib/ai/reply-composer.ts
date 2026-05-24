import type { HotelContext, LineConversationMemory, LineHandoffRequest, LineIntent, SupportedLineLanguage } from "@/types/line-ai.types";
import { HOSPIQ_ASSISTANT_PROFILE, buildAssistantGreeting } from "./assistant-profile";

interface ComposeLineReplyInput {
  language: SupportedLineLanguage;
  intents: LineIntent[];
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
  handoff?: LineHandoffRequest | null;
  isFirstInteraction?: boolean;
}

export function composeLineReply(input: ComposeLineReplyInput): string | null {
  const rawIntents = input.intents;
  const intents = normalizeIntents(input.intents);
  
  // A group booking handoff initially shouldn't show the generic handoff request
  // because we want to show the custom group recommendation/instructions first.
  const isInitialGroupBookingHandoff = input.handoff?.required && 
                                       input.handoff.reason === "group_booking" && 
                                       !input.memory.handoffPending;

  const handoffPart = (input.handoff?.required && !isInitialGroupBookingHandoff)
    ? handoffSection(input.language, input.handoff, input.memory)
    : null;

  const intro = input.isFirstInteraction
    ? buildAssistantGreeting(HOSPIQ_ASSISTANT_PROFILE, input.language, input.context)
    : HOSPIQ_ASSISTANT_PROFILE.openerByLanguage[input.language];

  if (handoffPart && input.handoff?.required && shouldUseHandoffOnly(input.handoff.reason)) {
    return joinParagraphs([intro, handoffPart]);
  }

  const parts: Array<string | null> = [handoffPart];

  // We check memory for isGroupBooking only if the current intents contain booking or availability inquiry.
  // This prevents triggering the group booking recommendation on greeting ("สวัสดีครับ") or unrelated questions.
  const hasGroupIntent = rawIntents.includes("group_booking") || 
                         (input.memory.bookingLead?.isGroupBooking && hasBookingOrAvailabilityIntent(rawIntents));

  if (hasGroupIntent) {
    const guests = input.memory.bookingLead?.guests || 10;
    const groupText = input.language === "th"
      ? `สำหรับ ${guests} ท่าน แนะนำเป็นการจองหลายห้องค่ะ โดยอาจจัดเป็นหลายห้องตามจำนวนผู้เข้าพักและรูปแบบการนอนที่ต้องการ\n\nรบกวนแจ้งวันที่เข้าพัก จำนวนผู้ใหญ่/เด็ก และสะดวกแยกหลายห้องไหมคะ เดี๋ยวช่วยประสานทีมงานเช็กห้องว่างและข้อเสนอสำหรับกรุ๊ปให้ค่ะ`
      : `For ${guests} guests, we recommend booking multiple rooms. Please provide your stay dates, guest breakdown (adults/children), and whether multiple rooms are suitable. We will coordinate with our team for group offers.`;
    parts.push(groupText);
  } else if (rawIntents.includes("cheapest_room")) {
    const cheapest = input.context.roomTypes.reduce((min, r) => r.basePrice < min.basePrice ? r : min, input.context.roomTypes[0]);
    if (cheapest) {
      const roomName = cheapest.name;
      const basePrice = cheapest.basePrice.toLocaleString("th-TH");
      const maxGuests = cheapest.maxGuests;
      const cheapText = input.language === "th"
        ? `ห้องที่ราคาถูกที่สุดตอนนี้คือ ${roomName} ค่ะ ราคาเริ่มต้น ${basePrice} บาท สำหรับ ${maxGuests} ท่าน\n\nเหมาะกับลูกค้าที่ต้องการห้องพักเริ่มต้น บรรยากาศเรียบง่าย และคุ้มค่าที่สุดค่ะ\n\nคุณลูกค้าต้องการเข้าพักวันไหน และเข้าพักกี่ท่านคะ เดี๋ยวช่วยดูความเหมาะสมให้ค่ะ`
        : `The most affordable room is ${roomName}, starting at ${basePrice} THB for ${maxGuests} guests. It is suitable for budget-conscious stays. Could you please specify your preferred check-in date and guest count?`;
      parts.push(cheapText);
    }
  } else if (rawIntents.includes("room_recommendation")) {
    const dislikes = input.memory.bookingLead?.dislikedFeatures || [];
    let candidates = input.context.roomTypes;
    if (dislikes.includes("wooden") || dislikes.includes("wooden-house")) {
      candidates = candidates.filter(r => !r.style?.includes("wooden-house"));
    }
    
    const recommended = candidates.find(r => r.style?.includes("nature") || r.style?.includes("photo-friendly")) || candidates[0];
    if (recommended) {
      const recText = input.language === "th"
        ? `ถ้าเน้นสวยและถ่ายรูปง่าย แนะนำ ${recommended.name} ค่ะ เพราะบรรยากาศดูโปร่ง เป็นธรรมชาติ และเหมาะกับคนที่อยากได้ห้องพักฟีลสบาย ๆ ค่ะ\n\nคุณลูกค้าเข้าพักกี่ท่าน และต้องการเข้าพักวันไหนคะ เดี๋ยวช่วยดูตัวเลือกที่เหมาะที่สุดให้ค่ะ`
        : `We highly recommend ${recommended.name} for a scenic and photogenic stay. How many guests and which dates are you planning to stay?`;
      parts.push(recText);
    } else {
      parts.push(input.language === "th" ? "จากข้อมูลห้องพักที่มีตอนนี้ ยังไม่พบตัวเลือกที่ตรงกับความต้องการของคุณลูกค้าค่ะ" : "We currently don't have matching room types.");
    }
  } else if (rawIntents.includes("amenities_question")) {
    const requestedRoomName = input.memory.bookingLead?.roomTypeName;
    const room = input.context.roomTypes.find(r => r.name.toLowerCase() === requestedRoomName?.toLowerCase());
    
    if (room) {
      const amenities = room.amenities && room.amenities.length > 0 ? room.amenities : null;
      if (amenities) {
        parts.push(input.language === "th"
          ? `${room.name} เป็นห้องพักยอดนิยมค่ะ ส่วนสิ่งอำนวยความสะดวกที่ยืนยันได้จากข้อมูลตอนนี้มีดังนี้ค่ะ:\n- ${amenities.join("\n- ")}\n\nส่วนเรื่องวันว่าง รบกวนแจ้งวันที่ต้องการเข้าพักและวันที่เช็กเอาต์ก่อนนะคะ เดี๋ยวช่วยตรวจสอบให้ค่ะ`
          : `${room.name} amenities include: ${amenities.join(", ")}. Please let us know your check-in and check-out dates to check availability.`);
      } else {
        parts.push(input.language === "th"
          ? `ตอนนี้ข้อมูลสิ่งอำนวยความสะดวกของ ${room.name} ในระบบยังไม่ครบค่ะ เดี๋ยวสามารถประสานทีมงานให้ตรวจสอบเพิ่มเติมได้ค่ะ\n\nส่วนเรื่องวันว่าง รบกวนแจ้งวันที่เข้าพักและวันที่เช็กเอาต์ก่อนนะคะ`
          : `Amenities information for ${room.name} is currently incomplete. We can verify this with our team.`);
      }
    } else {
      parts.push(input.language === "th"
        ? `ตอนนี้ข้อมูลสิ่งอำนวยความสะดวกในระบบยังไม่ครบค่ะ เดี๋ยวสามารถประสานทีมงานให้ตรวจสอบเพิ่มเติมได้ค่ะ\n\nรบกวนระบุห้องที่สนใจ และช่วงวันที่เข้าพักเพื่อให้แอดมินเช็กให้ค่ะ`
        : `Amenities details are currently unavailable. Please let us know which room you are interested in.`);
    }
  } else if (rawIntents.includes("room_detail") || rawIntents.includes("booking_intent")) {
    const requestedRoomName = input.memory.bookingLead?.roomTypeName;
    const room = input.context.roomTypes.find(r => r.name.toLowerCase() === requestedRoomName?.toLowerCase()) || input.context.roomTypes[0];
    
    if (room) {
      const lead = input.memory.bookingLead;
      const isUnconfident = lead?.source?.checkIn === "inferred" || lead?.source?.checkOut === "inferred";
      
      if (isUnconfident) {
        parts.push(input.language === "th"
          ? `รับทราบค่ะ คุณลูกค้าสนใจ ${room.name} โดยต้องการเข้าพักพรุ่งนี้ และเช็กเอาต์วันที่ 30 เดือนหน้าใช่ไหมคะ\n\nเพื่อความถูกต้อง รบกวนยืนยันวันที่เข้าพักเป็นรูปแบบวัน/เดือนให้อีกครั้งได้ไหมคะ และเข้าพักกี่ท่านคะ`
          : `Got it, you are interested in ${room.name} checking in tomorrow and checking out on the 30th of next month, right? Please confirm the dates and guest count.`);
      } else {
        const hasDates = lead?.checkIn && lead?.checkOut;
        const hasGuests = lead?.guests;
        
        if (hasDates && hasGuests) {
          parts.push(input.language === "th"
            ? `ได้เลยค่ะ สนใจ ${room.name} ในวันที่ ${lead.checkIn} ถึง ${lead.checkOut} สำหรับ ${hasGuests} ท่านนะคะ สามารถกดจองผ่านลิงก์ด้านล่างได้เลยค่ะ`
            : `Sure, you're interested in ${room.name} from ${lead.checkIn} to ${lead.checkOut} for ${hasGuests} guests. You can book using the link below.`);
        } else {
          parts.push(input.language === "th"
            ? `ได้เลยค่ะ ${room.name} เป็นห้องพักที่คุ้มค่าและน่าพักผ่อนมากค่ะ\n\nรบกวนแจ้งวันที่เข้าพัก วันที่เช็กเอาต์ และจำนวนผู้เข้าพักได้ไหมคะ เดี๋ยวช่วยดูข้อมูลให้ต่อค่ะ`
            : `Sure! ${room.name} is a great choice. Could you please let us know your check-in date, check-out date, and number of guests?`);
        }
      }
    }
  } else {
    if (intents.includes("availability")) {
      parts.push(availabilitySection(input.context, input.bookingUrl, input.language));
    }
    if (intents.includes("price") && !input.context.availability) {
      parts.push(priceSection(input.context, input.bookingUrl, input.language));
    }
    if (intents.includes("promotion")) {
      parts.push(promotionSection(input.context, input.language));
    }
    if (intents.includes("payment")) {
      parts.push(paymentSection(input.context, input.bookingUrl, input.language, !intents.includes("availability")));
    }
    if (intents.includes("contact")) {
      parts.push(contactSection(input.context, input.language));
    }
    if (intents.includes("booking") && !intents.includes("availability")) {
      parts.push(bookingSection(input.bookingUrl, input.memory, input.language));
    }
  }

  if (parts.filter(Boolean).length === 0) return null;
  return joinParagraphs([intro, ...parts]);
}

function joinParagraphs(parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(HOSPIQ_ASSISTANT_PROFILE.messagePolicy.paragraphBreak);
}

function handoffSection(language: SupportedLineLanguage, handoff: LineHandoffRequest, memory: LineConversationMemory): string {
  if (memory.handoffPending) return text(language, "handoffReceived");
  return text(language, "handoff");
}

function shouldUseHandoffOnly(reason: LineHandoffRequest["reason"]): boolean {
  return reason !== "booking_ready";
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
    .slice(0, HOSPIQ_ASSISTANT_PROFILE.messagePolicy.maxListedItems)
    .map((room) => `- ${room.name}: ${availableWord(language)} ${room.availableRooms}, ${fromWord(language)} ${formatCurrency(room.basePrice)}`);

  return [text(language, "availability", { dateText }), ...roomLines, text(language, "bookingUrl", { bookingUrl })].join("\n");
}

function priceSection(context: HotelContext, bookingUrl: string, language: SupportedLineLanguage): string {
  if (!context.roomTypes.length) return text(language, "noPrice", { bookingUrl });
  const roomLines = context.roomTypes
    .slice(0, HOSPIQ_ASSISTANT_PROFILE.messagePolicy.maxListedItems)
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

function text(language: SupportedLineLanguage, key: string, values: Record<string, string> = {}): string {
  const templates: Record<SupportedLineLanguage, Record<string, string>> = {
    th: {
      availability: "ช่วง {dateText} มีตัวเลือกว่างดังนี้ค่ะ",
      noAvailability: "ช่วง {dateText} ตอนนี้ยังไม่พบห้องว่างจากระบบค่ะ",
      price: "ราคาเริ่มต้นของห้องมีดังนี้ค่ะ",
      noPrice: "ตอนนี้ยังไม่มีข้อมูลราคาในระบบค่ะ ดูต่อได้ที่ {bookingUrl}",
      promo: "โปรโมชันที่มีตอนนี้ค่ะ",
      noPromo: "ตอนนี้ยังไม่พบโปรโมชันที่เปิดใช้งานค่ะ",
      paymentPromptPay: "ชำระผ่าน PromptPay/โอนเงินได้ค่ะ ชื่อบัญชี{accountName}",
      paymentGeneric: "ชำระผ่านการโอนเงินตามขั้นตอนในหน้าจองได้ค่ะ",
      slip: "หลังชำระเงินแล้วให้อัปโหลดสลิปในหน้าจองเพื่อให้ทีมงานตรวจสอบและยืนยันการจองค่ะ",
      bookingUrl: "จองต่อได้ที่ {bookingUrl}",
      phone: "โทร",
      email: "อีเมล",
      address: "ที่อยู่",
      noContact: "ตอนนี้ยังไม่มีข้อมูลติดต่อในระบบค่ะ",
      bookingSummary: "ข้อมูลจองที่จำไว้: {dateText}",
      bookingStart: "เริ่มจองผ่านหน้าเว็บได้เลยค่ะ",
      handoff: "เคสนี้จะส่งต่อให้ทีมงานช่วยตรวจสอบให้นะคะ รบกวนแจ้งชื่อ/เบอร์ที่ใช้จอง และรายละเอียดสั้น ๆ เพิ่มได้เลยค่ะ",
      handoffReceived: "รับข้อมูลแล้วค่ะ จะส่งต่อให้ทีมงานช่วยตรวจสอบเคสนี้ให้นะคะ",
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
      handoff: "I'll pass this to the team to review. Please send the booking name/phone number and a short detail.",
      handoffReceived: "Got it. I'll pass these details to the team for review.",
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
      handoff: "我会转给工作人员协助处理。请提供预订姓名/电话和简短说明。",
      handoffReceived: "已收到信息，我会转给工作人员协助处理。",
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
      handoff: "スタッフに確認を引き継ぎます。予約名/電話番号と簡単な詳細を送ってください。",
      handoffReceived: "情報を受け取りました。スタッフに確認を引き継ぎます。",
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
      handoff: "Voy a pasar este caso al equipo para revisarlo. Envíanos el nombre/teléfono de la reserva y un breve detalle.",
      handoffReceived: "Recibido. Pasaré estos datos al equipo para revisarlo.",
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
      handoff: "سأحوّل هذه الحالة إلى الفريق للمراجعة. يرجى إرسال اسم/هاتف الحجز وتفاصيل قصيرة.",
      handoffReceived: "تم استلام المعلومات. سأحوّلها إلى الفريق للمراجعة.",
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

function hasBookingOrAvailabilityIntent(intents: LineIntent[]): boolean {
  const targetIntents: LineIntent[] = ["availability", "booking", "price", "availability_check", "booking_intent", "group_booking"];
  return intents.some(intent => targetIntents.includes(intent));
}
