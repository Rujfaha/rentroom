import type { HospiqAiContext, LineConversationMemory, StarterAiIntent } from "./types";

export type StarterCtaStrategy =
  | "assist_only"
  | "suggest_next_question"
  | "recommend_room"
  | "booking_ready"
  | "handoff";

export interface HospitalitySalesPolicy {
  hospitalityRules: string[];
  salesRules: string[];
  ctaStrategy: StarterCtaStrategy;
  memorySummary: {
    shouldSummarize: boolean;
    knownDetails: Record<string, string | number>;
    estimatedCost: {
      roomTypeName: string;
      nights: number;
      basePrice: number;
      total: number;
      note: string | null;
    } | null;
  };
}

export function buildHospitalitySalesPolicy(input: {
  intent: StarterAiIntent;
  canOfferBookingLink: boolean;
  shouldHandoff: boolean;
  memory: LineConversationMemory;
  roomtypes?: HospiqAiContext["roomtypes"];
}): HospitalitySalesPolicy {
  return {
    hospitalityRules: [
      "Lead with what the hotel can support, then mention soft caveats only when needed.",
      "Do not lead with limitations or make normal operational notes feel like problems.",
      "Do not repeat caveats from FAQ unless operationally necessary; if needed, place them after the helpful answer as support guidance.",
      "Use Hospiq for AI support and reserve admin for human handoff.",
      "Use hotel vocabulary such as guests staying, check-in date, check-out date, and guests rather than generic travel wording.",
      "When the customer asks about options, summarize useful choices before asking a follow-up question.",
      "Ask at most one helpful next question unless the customer is booking-ready.",
    ],
    salesRules: [
      "Help the customer choose before sending booking links.",
      "Recommend the best-fit room using guest count, availability, price, and room descriptions from the provided context.",
      "Suggest an extra bed as a polite upsell/option when a room standard capacity is below the guest count but max capacity allows extra guests.",
      "Avoid general disclaimers about room prices changing by dates if check-in and check-out dates are already known.",
      "Use a light sales assistance style: helpful, confident, and not pushy.",
      "Only include a booking link when the CTA strategy allows it and the hotel has a booking link.",
    ],
    ctaStrategy: chooseCtaStrategy(input.intent, input.canOfferBookingLink, input.shouldHandoff),
    memorySummary: buildMemorySummary(input.memory, input.roomtypes ?? [], input.intent),
  };
}

function chooseCtaStrategy(
  intent: StarterAiIntent,
  canOfferBookingLink: boolean,
  shouldHandoff: boolean,
): StarterCtaStrategy {
  if (shouldHandoff || intent === "handoff_request" || intent === "handoff_required") return "handoff";
  if (intent === "booking_ready") return canOfferBookingLink ? "booking_ready" : "suggest_next_question";
  if (intent === "room_recommendation" || intent === "cheapest_room") return "recommend_room";
  if (intent === "availability" || intent === "availability_check" || intent === "room_inquiry") {
    return "suggest_next_question";
  }
  return "assist_only";
}

function buildMemorySummary(
  memory: LineConversationMemory,
  roomtypes: HospiqAiContext["roomtypes"],
  intent?: StarterAiIntent,
): HospitalitySalesPolicy["memorySummary"] {
  const lead = memory.bookingLead ?? {};
  const knownDetails: Record<string, string | number> = {};

  if (lead.roomTypeName) knownDetails.roomTypeName = lead.roomTypeName;
  if (lead.checkIn) knownDetails.checkIn = lead.checkIn;
  if (lead.checkOut) knownDetails.checkOut = lead.checkOut;
  if (lead.guests) knownDetails.guests = lead.guests;
  if (lead.guestName) knownDetails.guestName = lead.guestName;
  if (lead.phone) knownDetails.phone = lead.phone;

  const hasBookingIntent = intent === "booking_ready" || intent === "booking_intent";
  const hasContactInfo = Boolean(lead.guestName || lead.phone);
  const shouldSummarize = Object.keys(knownDetails).length >= 2 && (hasBookingIntent || hasContactInfo);

  return {
    shouldSummarize,
    knownDetails,
    estimatedCost: estimateCost(lead, roomtypes),
  };
}

function estimateCost(
  lead: LineConversationMemory["bookingLead"],
  roomtypes: HospiqAiContext["roomtypes"],
): HospitalitySalesPolicy["memorySummary"]["estimatedCost"] {
  if (!lead.roomTypeName || !lead.checkIn || !lead.checkOut) return null;
  const roomtype = findRoomtype(lead.roomTypeName, roomtypes);
  if (!roomtype) return null;
  const nights = calculateNights(lead.checkIn, lead.checkOut);
  if (!nights) return null;

  return {
    roomTypeName: roomtype.name,
    nights,
    basePrice: roomtype.basePrice,
    total: roomtype.basePrice * nights,
    note: roomtype.priceNote,
  };
}

function findRoomtype(name: string, roomtypes: HospiqAiContext["roomtypes"]) {
  const normalized = normalizeText(name);
  return roomtypes.find((roomtype) => normalizeText(roomtype.name) === normalized)
    ?? roomtypes.find((roomtype) => normalizeText(roomtype.name).includes(normalized) || normalized.includes(normalizeText(roomtype.name)));
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 86400000);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
