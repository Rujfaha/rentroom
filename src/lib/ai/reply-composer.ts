import type { AvailabilityRequest, HotelContext, LineConversationMemory, LineHandoffRequest, LineIntent } from "@/types/line-ai.types";

export interface LineResponsePlan {
  intents: LineIntent[];
  salesStage: "information" | "interest" | "booking_ready" | "handoff";
  requestedFacts: string[];
  missingBookingFields: Array<"checkIn" | "checkOut" | "guests">;
  canIncludeBookingUrl: boolean;
  bookingUrl: string;
  availabilityRequest: AvailabilityRequest | null;
  handoff: LineHandoffRequest | null;
}

export interface BuildLineResponsePlanInput {
  intents: LineIntent[];
  context: HotelContext;
  bookingUrl: string;
  memory: LineConversationMemory;
  availabilityRequest?: AvailabilityRequest | null;
  handoff?: LineHandoffRequest | null;
}

export function buildLineResponsePlan(input: BuildLineResponsePlanInput): LineResponsePlan {
  const intents = normalizeIntents(input.intents);
  const handoff = input.handoff?.required ? input.handoff : null;
  const missingBookingFields = getMissingBookingFields(input.memory);
  const isInterested = intents.some((i) =>
    i === "booking_ready" || i === "booking_intent" || i === "booking" || i === "availability_check"
  );
  const canIncludeBookingUrl = isInterested && !handoff;

  return {
    intents,
    salesStage: resolveSalesStage(intents, handoff),
    requestedFacts: resolveRequestedFacts(intents, input.context, Boolean(input.availabilityRequest)),
    missingBookingFields,
    canIncludeBookingUrl,
    bookingUrl: input.bookingUrl,
    availabilityRequest: input.availabilityRequest ?? null,
    handoff,
  };
}

function normalizeIntents(intents: LineIntent[]): LineIntent[] {
  const expanded = intents.flatMap((intent) => (intent === "availability_payment" ? (["availability", "payment"] as LineIntent[]) : [intent]));
  return Array.from(new Set(expanded.filter((intent) => intent !== "general")));
}

function resolveSalesStage(intents: LineIntent[], handoff: LineHandoffRequest | null): LineResponsePlan["salesStage"] {
  if (handoff) return "handoff";
  if (intents.includes("booking_ready")) return "booking_ready";
  if (intents.some((intent) => intent === "booking" || intent === "booking_intent" || intent === "room_specific_detail")) return "interest";
  return "information";
}

function resolveRequestedFacts(intents: LineIntent[], context: HotelContext, hasAvailabilityRequest: boolean): string[] {
  const facts = new Set<string>();
  if (intents.includes("room_overview")) facts.add("room_types");
  if (intents.includes("room_specific_detail") || intents.includes("room_detail")) facts.add("specific_room_type");
  if (intents.includes("price") || intents.includes("price_inquiry") || intents.includes("cheapest_room")) facts.add("room_prices");
  if (intents.includes("promotion")) facts.add("promotions");
  if (intents.includes("payment")) facts.add("payment");
  if (intents.includes("contact")) facts.add("contact");
  if (intents.includes("amenities_question")) facts.add("room_amenities");
  if (hasAvailabilityRequest || intents.includes("availability") || intents.includes("availability_check")) facts.add("availability");
  if (!facts.size && context.roomTypes.length) facts.add("hotel_overview");
  return [...facts];
}

function getMissingBookingFields(memory: LineConversationMemory): LineResponsePlan["missingBookingFields"] {
  const lead = memory.bookingLead;
  if (!lead) return ["checkIn", "checkOut", "guests"];
  const missing: LineResponsePlan["missingBookingFields"] = [];
  if (!lead.checkIn) missing.push("checkIn");
  if (!lead.checkOut) missing.push("checkOut");
  if (!lead.guests) missing.push("guests");
  return missing;
}
