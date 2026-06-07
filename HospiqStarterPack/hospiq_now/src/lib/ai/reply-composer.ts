import type { AiUsage, LineConversationMemory, StarterAiIntent, StarterPromptPayload } from "./types";
import type { AiProvider } from "./provider";
import { getAiProvider } from "./provider";
import { buildStarterSystemPrompt } from "./system-prompt";

/**
 * The customer is "locked onto" a chosen room only when THIS turn is actually
 * about that room or finalizing the booking — not when they pivot to browsing,
 * availability, amenities, location, or another topic. Gating the room-facts
 * narrowing (and the "answer about THAT room only" rule) on the current intent
 * stops the assistant from staying stuck on an old room after the conversation
 * has moved on.
 */
const CHOSEN_ROOM_FOCUS_INTENTS: ReadonlySet<StarterAiIntent> = new Set([
  "room_detail",
  "price_inquiry",
  "booking_intent",
  "booking_ready",
  "payment",
]);

function shouldFocusOnChosenRoom(payload: StarterPromptPayload): boolean {
  const lead = payload.memory.bookingLead;
  return Boolean(
    lead?.roomTypeName &&
      lead?.checkIn &&
      lead?.checkOut &&
      CHOSEN_ROOM_FOCUS_INTENTS.has(payload.intent),
  );
}

export interface AiReplyDraft {
  reply: string;
  memoryUpdate: Partial<LineConversationMemory>;
  source: string;
  provider: string | null;
  model: string | null;
  usage?: AiUsage | null;
}

export interface ReplyComposer {
  compose(payload: StarterPromptPayload): Promise<AiReplyDraft>;
}

export function createNotConfiguredReplyComposer(): ReplyComposer {
  return {
    async compose(payload) {
      return {
        reply: payload.retrievedFaqs[0]?.answer ?? "",
        memoryUpdate: payload.memory,
        source: "not_configured",
        provider: null,
        model: null,
      };
    },
  };
}

export function createModelBackedReplyComposer(provider: AiProvider = getAiProvider()): ReplyComposer {
  return {
    async compose(payload) {
      const promptStr = buildGroundedReplyPrompt(payload);

      const result = await provider.generate({
        system: buildStarterSystemPrompt(),
        prompt: promptStr,
        maxOutputTokens: Math.ceil(payload.policies.maxReplyLength / 3),
      });

      return {
        reply: result.text,
        memoryUpdate: payload.memory,
        source: "model",
        provider: result.provider,
        model: result.model,
        usage: result.usage ?? null,
      };
    },
  };
}

export function buildGroundedReplyPrompt(payload: StarterPromptPayload): string {
  return [
    `Customer message:\n${payload.userMessage}`,
    "",
    "Mandatory grounding brief:",
    buildGroundingBrief(payload),
    "",
    "Booking summary facts:",
    buildBookingSummaryFacts(payload),
    "",
    "Intent:",
    payload.intent,
    "",
    "Current hotel identity:",
    `Role: ${payload.identity.role} at ${payload.identity.hotelName} (Brand: ${payload.identity.brandName})`,
    "",
    "Conversation memory:",
    `Booking Lead: ${JSON.stringify(payload.memory.bookingLead)}`,
    `Current topic: ${payload.memory.currentTopic || "Not specified"}`,
    `Language: ${payload.memory.language || "Not specified"}`,
    "Use this memory only to avoid re-asking for details the customer already gave (interested room, dates, guests). ALWAYS prioritize the customer's latest message: if this message asks about something else or changes the topic, follow the new message and answer THAT — do not stay anchored to a previously chosen room or an old topic.",
    "",
    "Recent chat history (for context):",
    payload.chatHistory && payload.chatHistory.length > 0
      ? payload.chatHistory.map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.text}`).join("\n")
      : "No recent history.",
    "",
    "Core response rules:",
    ...buildDynamicRules(payload),
  ].join("\n");
}

function buildDynamicRules(payload: StarterPromptPayload): string[] {
  const isBookingRelated = [
    "room_inquiry", "room_overview", "room_detail", "room_recommendation",
    "availability", "availability_check", "price_inquiry", "cheapest_room",
    "booking_intent", "booking_ready", "group_booking"
  ].includes(payload.intent);
  const isAmenitiesQuestion = payload.intent === "amenities_question";
  const isPromotionQuestion = payload.intent === "promotion";
  
  const rules: string[] = [
    "- First decide what concrete facts the customer asked for, then answer those facts directly.",
    "- Do NOT use or mention FAQ facts unless the customer's message explicitly asks about that specific topic.",
    "- Use only the hotel facts, FAQ examples, memory, and policies provided.",
    "- Do not use data from any other hotel. If a requested fact is missing, do not guess.",
    "- Only mention room types by name that appear in the Room facts provided above. Do not reference any room that is not in the current Room facts — even if the customer mentioned it earlier or memory contains it.",
    ...payload.persona.styleRules.map(rule => `- ${rule}`),
    ...payload.persona.avoidRules.map(rule => `- AVOID: ${rule}`),
    "- For multi-part customer messages, answer each part in the same reply.",
    "- Do not respond with a generic greeting or ask what the customer wants when the customer already asked a concrete question.",
    "- Do NOT mention contacting the admin or provide the hotel's phone number/LINE in every turn. Provide contact channels only during the first greeting, the final handoff, or when the customer explicitly asks for a contact channel (phone, LINE, or email) — in which case answer their request directly.",
    "- Do NOT provide overly detailed room descriptions in every turn. ONLY provide full room details the first time a room is introduced. For subsequent turns, use a short summary or just the room name.",
    "- Read the recent chat history before replying. Do NOT repeat a greeting, the same room list, the same prices, or sentences you already sent. Every reply must add new information and directly answer the customer's latest message.",
    "- Answer the exact question the customer asked. If it is a yes/no or confirmation question (e.g. 'ว่างทุกวันไหม'), answer it directly and briefly instead of restarting the room presentation.",
    "- For room-interest messages, keep the reply to 1-2 short paragraphs: acknowledge briefly, give key price/capacity facts, and ask for only the next missing detail.",
    "- Be concise: answer in as few sentences as the question genuinely needs. On LINE most replies are about 1-3 short sentences. Keep it natural and warm, but do not pad, repeat, or over-explain.",
    "- Reply length must fit the question, NOT a character budget. The character limit is only a hard safety ceiling, never a target — short, complete answers are preferred.",
    "- If the customer refers to a specific room (e.g. 'that room', 'เอาห้องนั้น') but the booking summary facts do not specify a room type, you MUST ask the customer to clarify which room type they mean instead of assuming one.",
  ];

  if (isBookingRelated) {
    rules.push(
      "- Do NOT include room image markdown when listing or comparing multiple rooms — those are shown to the customer as visual cards. Only include a single room's Image markdown if the customer explicitly asks to see that specific room's photos.",
      "- When recommending rooms for specific dates, check if any roomtypes are fully booked (i.e., Available rooms is 0). Do not recommend or list fully booked roomtypes.",
      "- If a roomtype is fully booked for requested dates but the customer specifically asks about it, acknowledge briefly without excessive apology, then immediately pivot to recommend the best available alternative as a positive option — keep the pivot warm and natural, like a helpful friend suggesting a good swap, not a formal refusal.",
      "- Help the customer choose before sending booking links.",
      "- Follow the CTA strategy from hospitalitySales. Do not include booking links for handoff-only requests, unless a webbooking link is available and can be offered - in which case you must provide the webbooking link and invite them to complete the booking online, while also letting them know you are forwarding their details to the staff.",
      "- If hospitalitySales.memorySummary.shouldSummarize is true, Summarize known booking details when customer has already provided booking details.",
      "- When summarizing booking details, put EACH item on its own line as 'label: value' (room type, check-in, check-out, guests, room count if > 1, name, phone, and estimated cost if available). Leave a line break before any closing sentence so the summary is easy to read.",
      "- Label cost as an estimate or starting price when prices may vary.",
      "- If check-in and check-out dates are already known, do not include generic price-by-date variation caveats.",
      "- If there is a promotion with 'Activation: auto' in the Promotion facts, you MUST automatically apply this discount to the Base price of ALL eligible room types. Eligibility is strictly determined by the 'Target room types' field. If 'Target room types' is 'All room types', the promotion applies to EVERY room, even if the promotion 'Description' says otherwise (ALWAYS trust 'Target room types' over the description). When presenting the room price, format it exactly as '[Discounted Price] บาท/คืน (ราคาปกติ [Base Price] บาท)'. You must also naturally mention the promotion name. Do not invent promotions if none are listed.",
      "- Do NOT tell the customer that rooms are limited unless the 'Available rooms' for the requested dates is 2 or less, or exactly matches their requested room count.",
      "- If the requested room count or guest count is higher than the currently available rooms, politely inform them about the remaining availability and offer alternatives before considering a handoff.",
      "- When calculating extra beds or checking capacity, ALWAYS sum the total allowed capacity (Standard guests + Extra beds) across all requested rooms. If the total capacity is strictly less than the requested guest count, politely warn the customer that the rooms cannot fit everyone and recommend booking an additional room before discussing prices.",
      ...(payload.hotelData.roomtypes.some((rt) => rt.allowsExtraBed)
        ? ["- When the customer's guest count exceeds standard capacity, upsell the extra bed service using the room's concrete extra bed price (e.g. 'บริการเสริมเตียงเสริมราคา X บาทต่อคืน/ท่าน'). Do not use generic 'ราคาอาจเปลี่ยนแปลงตามจำนวนผู้เข้าพัก'."]
        : []),
      "- Do not provide the webbookingUrl or rush the customer to book unless they have explicitly confirmed they want to book, or the CTA strategy is 'booking_ready'.",
      `- If a booking link can be offered, use: ${payload.hotelData.roomWebbookingUrl || payload.hotelData.webbookingUrl || "No URL available"}`,
      `- CTA strategy: ${payload.hospitalitySales.ctaStrategy}.`
    );
  }

  // Booking collection rules (step-by-step data gathering)
  if (payload.hospitalitySales?.bookingCollectionRules?.length) {
    rules.push(
      "",
      "Booking information collection rules:",
      ...payload.hospitalitySales.bookingCollectionRules.map((r) => `- ${r}`),
    );
  }

  // Variant flow: customer mentions specific room type first
  if (isBookingRelated && payload.memory.bookingLead?.roomTypeName && !payload.memory.bookingLead?.checkIn) {
    rules.push(
      "- The customer has already expressed interest in a specific room type. Confirm their choice and ask for stay dates and other missing details.",
    );
  }

  // Variant flow: customer provides dates/guests first but no room choice yet
  if (isBookingRelated && payload.memory.bookingLead?.checkIn && !payload.memory.bookingLead?.roomTypeName) {
    rules.push(
      "- The customer has already provided stay dates. Recommend suitable available rooms based on their dates and guest count, then continue collecting any missing booking details.",
    );
  }

  // Variant flow: customer has chosen a specific room AND provided stay dates AND
  // this turn is still about that room/booking (not a pivot to browsing/another topic).
  if (shouldFocusOnChosenRoom(payload)) {
    rules.push(
      "- The customer has already chosen a specific room and given stay dates. Answer about THAT room only: confirm its availability for those dates using the Room facts, then continue collecting any missing booking details. Do not list or describe other rooms unless the chosen room is fully booked — only then offer alternatives.",
    );
  }

  if (payload.hospitalitySales?.hospitalityRules) {
    rules.push(...payload.hospitalitySales.hospitalityRules.map((r) => `- ${r}`));
  }

  rules.push(
    `- If the user asks about the hotel's location or map, provide the Google Maps URL: ${payload.hotelData.mapUrl || "Not available"}. If missing, apologize and say you'll contact staff.`,
    `- If the user asks about nearby places, use the hotel's address (${payload.hotelData.address}) and general knowledge. Remind them to verify exact routes.`,
    `- If a handoff or contact to admin is required, generate a natural contact message yourself using Phone: ${payload.hotelData.contactPhone || "-"} and Email: ${payload.hotelData.contactEmail || "-"}.`
  );

  // When the customer is asking to browse/see rooms (not one specific room), room
  // visuals (image bubbles or cards) may be shown right after this message. For
  // browse intents only, keep the text a short lead-in; availability/price/other
  // questions get a full text answer (handled by the rules above).
  const isRoomBrowse =
    ["room_overview", "room_inquiry", "room_recommendation", "cheapest_room", "group_booking"].includes(payload.intent) &&
    !payload.memory.bookingLead?.roomTypeName &&
    !asksForRoomFacts(payload.userMessage);
  if (isAmenitiesQuestion) {
    rules.push(
      "- This is an amenities/facilities/services question. Answer it COMPLETELY first — use both the amenities listed in each room's amenity field AND any relevant FAQ facts. Cover what the property offers warmly and positively.",
      "- Do not skip or shorten the amenities answer to pivot to booking. Finish the answer, THEN at most offer one gentle next step if it naturally follows the conversation.",
      "- Do NOT push booking or ask for reservation details after an amenities question unless the customer has explicitly signaled they want to book.",
    );
  }

  if (isPromotionQuestion) {
    rules.push(
      "- This is a promotion question. Answer only from Promotion facts. Include the promotion title, discount, code requirement when present, date window when present, and targeted room types when present.",
      "- If Promotion facts is None, say there is no active promotion information in the current hotel data and invite the customer to ask about room options or booking dates. Do not invent discounts, packages, promo codes, or campaign names.",
    );
  }

  if (isBookingRelated && asksForRoomFacts(payload.userMessage)) {
    rules.push(
      "- When the customer asks for room names, prices, capacity, or comparisons, answer with the matching room names and values from Room facts directly in text. Keep it concise and do not rely on visual cards as the only place where those facts appear.",
    );
  }

  if (isRoomBrowse) {
    const hasAutoPromo = (payload.hotelData.promotions ?? []).some(p => p.activationType === "auto");
    const promoInstruction = hasAutoPromo 
      ? " You MUST naturally mention the active promotion in this intro sentence."
      : "";
    const roomtypeCount = payload.hotelData.roomtypeCount ?? payload.hotelData.roomtypes.length;
    
    rules.push(
      `- The active room type count from the database snapshot is ${roomtypeCount}. Use this exact count when saying how many room types the hotel has.`,
      `- Room photos and detail cards will follow this message automatically. Your text is ONLY a brief intro: state how many room types are available in one short sentence (e.g. 'ทางเรามีห้องพัก ${payload.hotelData.roomtypes.length} ประเภทดังนี้ค่ะ').${promoInstruction} Do NOT list room names, prices, capacity, or descriptions — the cards already carry all that detail. Keep it to 1 sentence maximum.`,
      "- If room options were already shown earlier this conversation, do NOT list them again. Just answer the new question in 1-2 sentences and offer the next helpful step.",
    );
  }

  return rules;
}

function asksForRoomFacts(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;

  return [
    "price",
    "cost",
    "rate",
    "how much",
    "room type",
    "room name",
    "capacity",
    "person",
    "people",
    "compare",
    "ราคา",
    "เท่าไหร่",
    "กี่บาท",
    "ชื่อห้อง",
    "ประเภทห้อง",
    "ห้องอะไร",
    "พักได้",
    "กี่คน",
    "ความจุ",
    "เปรียบเทียบ",
  ].some((term) => normalized.includes(term));
}

function buildBookingSummaryFacts(payload: StarterPromptPayload): string {
  const summary = payload.hospitalitySales.memorySummary;
  if (!summary.shouldSummarize) return "No booking summary is needed yet.";

  return [
    `Known Details: ${JSON.stringify(summary.knownDetails)}`,
    `estimatedCost: ${summary.estimatedCost ? JSON.stringify(summary.estimatedCost) : "None"}`,
    "Instruction: When replying about booking-ready details, summarize these known details in natural language before the CTA."
  ].join("\n");
}

function buildGroundingBrief(payload: StarterPromptPayload): string {
  const hotelFacts = [
    payload.hotelData.address ? `Address: ${payload.hotelData.address}` : null,
    payload.hotelData.mapUrl ? `Map URL: ${payload.hotelData.mapUrl}` : null,
    payload.hotelData.contactPhone ? `Contact phone: ${payload.hotelData.contactPhone}` : null,
    payload.hotelData.contactEmail ? `Contact email: ${payload.hotelData.contactEmail}` : null,
    payload.hotelData.checkInTime ? `Check-in time: ${payload.hotelData.checkInTime}` : null,
    payload.hotelData.checkOutTime ? `Check-out time: ${payload.hotelData.checkOutTime}` : null,
  ].filter(Boolean);

  const faqFacts = payload.retrievedFaqs
    .slice(0, 3)
    .map((faq, index) => `${index + 1}. FAQ: ${faq.question}\nAnswer: ${faq.answer}`);

  const lead = payload.memory.bookingLead;
  const chosenName = lead?.roomTypeName;
  const focusOnChosen = shouldFocusOnChosenRoom(payload);
  let briefRooms = payload.hotelData.roomtypes;
  if (focusOnChosen && chosenName) {
    const target = normalizeRoomName(chosenName);
    const matched = briefRooms.filter((rt) => {
      const name = normalizeRoomName(rt.name);
      return name === target || name.includes(target) || target.includes(name);
    });
    const chosenFullyBooked = matched.length > 0 && matched.every((rt) => rt.availableRooms === 0);
    if (matched.length && !chosenFullyBooked) briefRooms = matched;
  }

  const roomFacts = briefRooms
    .map((roomtype, index) => {
      const availability = roomtype.availableRooms === null ? "not calculated" : String(roomtype.availableRooms);
      return [
        `${index + 1}. Room: ${roomtype.name}`,
        `Base price: ${roomtype.basePrice}`,
        `Main beds: ${roomtype.mainBeds.map((b) => `${b.count} ${b.type}`).join(", ")}`,
        `Included guests in base price: ${roomtype.standardCapacity}`,
        `Max capacity: ${roomtype.maxCapacity}`,
        roomtype.allowsExtraBed && roomtype.maxExtraBeds > 0 ? `Max extra beds: ${roomtype.maxExtraBeds}` : null,
        roomtype.allowsExtraBed && roomtype.extraBedPrice > 0 ? `Extra bed price: ${roomtype.extraBedPrice}` : null,
        `Available rooms: ${availability}`,
        roomtype.description ? `Description: ${roomtype.description}` : null,
        roomtype.imageUrls && roomtype.imageUrls.length > 0
          ? roomtype.imageUrls.map((url, idx) => `Image ${idx + 1}: ![${roomtype.name}](${url})`).join("\n")
          : (roomtype.imageUrl ? `Image: ![${roomtype.name}](${roomtype.imageUrl})` : null),
      ].filter(Boolean).join("\n");
    });

  const promotionFacts = (payload.hotelData.promotions ?? [])
    .slice(0, 10)
    .map((promotion, index) => {
      const targetRooms = promotion.roomtypeNames.length ? promotion.roomtypeNames.join(", ") : "All room types";
      return [
        `${index + 1}. Promotion: ${promotion.title}`,
        promotion.description ? `Description: ${promotion.description}` : null,
        `Rule type: ${promotion.ruleType}`,
        promotion.minNights != null ? `Min nights: ${promotion.minNights}` : null,
        promotion.minAdvanceDays != null ? `Min advance days: ${promotion.minAdvanceDays}` : null,
        promotion.maxAdvanceDays != null ? `Max advance days: ${promotion.maxAdvanceDays}` : null,
        promotion.minBookingAmount != null ? `Min booking amount: ${promotion.minBookingAmount}` : null,
        `Discount type: ${promotion.discountType}`,
        `Discount value: ${promotion.discountValue}`,
        promotion.maxDiscountAmount != null ? `Max discount amount: ${promotion.maxDiscountAmount}` : null,
        `Activation: ${promotion.activationType}`,
        promotion.promoCode ? `Promo code: ${promotion.promoCode}` : null,
        promotion.startDate ? `Start date: ${promotion.startDate}` : null,
        promotion.endDate ? `End date: ${promotion.endDate}` : null,
        `Target room types: ${targetRooms}`,
      ].filter(Boolean).join("\n");
    });

  return [
    "Only use facts that are directly relevant to the customer's question. Do not volunteer unrelated facts.",
    "Hotel facts:",
    hotelFacts.length ? hotelFacts.join("\n") : "None",
    "FAQ facts:",
    faqFacts.length ? faqFacts.join("\n") : "None",
    "Room facts:",
    `Total active room types: ${payload.hotelData.roomtypeCount ?? payload.hotelData.roomtypes.length}`,
    "Use this exact count for any room-type count you mention.",
    roomFacts.length ? roomFacts.join("\n") : "None",
    "Promotion facts:",
    promotionFacts.length ? promotionFacts.join("\n") : "None",
  ].join("\n");
}

function normalizeRoomName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
