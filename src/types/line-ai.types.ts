export type AiProviderName = "gemini" | "openai" | "groq";

export interface LineTextMessage {
  type: "text";
  text: string;
}

export type LineReplyMessage = LineTextMessage;

export interface LineWebhookSource {
  type: "user" | "group" | "room";
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export interface LineWebhookMessage {
  id: string;
  type: string;
  text?: string;
}

export interface LineMessageEvent {
  type: "message";
  replyToken: string;
  source: LineWebhookSource;
  message: LineWebhookMessage;
}

export interface LineFollowEvent {
  type: "follow";
  replyToken: string;
  source: LineWebhookSource;
}

export type LineWebhookEvent = LineMessageEvent | LineFollowEvent | { type: string; replyToken?: string; source?: LineWebhookSource };

export interface LineWebhookPayload {
  destination?: string;
  events: LineWebhookEvent[];
}

export interface AvailabilityRequest {
  checkIn: string;
  checkOut: string;
  guests?: number;
}

export type LineIntent =
  | "availability"
  | "availability_payment"
  | "payment"
  | "price"
  | "promotion"
  | "contact"
  | "booking"
  | "handoff"
  | "general"
  | "greeting"
  | "room_overview"
  | "room_specific_detail"
  | "room_detail"
  | "room_recommendation"
  | "amenities_question"
  | "availability_check"
  | "price_inquiry"
  | "cheapest_room"
  | "group_booking"
  | "booking_ready"
  | "booking_intent"
  | "sales_handoff"
  | "handoff_required"
  | "fallback";
export type SupportedLineLanguage = "th" | "zh" | "en" | "ja" | "es" | "ar";

export type LineHandoffReason =
  | "admin_request"
  | "payment_issue"
  | "refund"
  | "complaint"
  | "cancellation"
  | "special_approval"
  | "group_booking"
  | "booking_ready";

export interface LineHandoffRequest {
  required: boolean;
  reason: LineHandoffReason;
  priority: "normal" | "high";
}

export interface AvailableRoomTypeSummary {
  id: string;
  name: string;
  basePrice: number;
  maxGuests: number;
  availableRooms: number;
  description?: string | null;
  amenities?: string[] | null;
  style?: string[];
  suitableFor?: string[];
  notSuitableFor?: string[];
}

export interface HotelContactSummary {
  type: string;
  label: string | null;
  value: string;
}

export interface HotelPromotionSummary {
  title: string;
  description: string | null;
  discountText: string | null;
  validUntil: string | null;
}

export interface HotelPaymentSummary {
  promptPayConfigured: boolean;
  accountName: string | null;
}

export interface HotelAiSettingsSummary {
  assistantName: string;
  tone: string | null;
  supportedLanguages: string[];
  bookingCtaPolicy: string | null;
  handoffPolicy: string | null;
  fallbackPolicy: string | null;
  metadata: Record<string, unknown>;
}

export interface HotelFaqSummary {
  question: string;
  answer: string;
  category: string | null;
  language: string;
  keywords: string[];
}

export interface HotelAiTestcaseSummary {
  userMessage: string;
  expectedIntent: string | null;
  expectedEntities: Record<string, unknown>;
  expectedBehavior: string | null;
  goldenReply: string | null;
  language: string;
  tags: string[];
}

export interface HotelAiKnowledge {
  settings: HotelAiSettingsSummary | null;
  faqs: HotelFaqSummary[];
  testcases: HotelAiTestcaseSummary[];
}

export interface HotelContext {
  hotelId: string;
  hotelName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contacts: HotelContactSummary[];
  payment: HotelPaymentSummary;
  roomTypes: AvailableRoomTypeSummary[];
  promotions: HotelPromotionSummary[];
  aiKnowledge: HotelAiKnowledge;
  availability?: {
    request: AvailabilityRequest;
    roomTypes: AvailableRoomTypeSummary[];
  };
}

export interface LineMessageHistoryItem {
  direction: "inbound" | "outbound";
  text: string;
  createdAt: string;
}

export interface BookingLead {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  roomTypeName?: string;
  guestName?: string;
  phone?: string;
  adults?: number;
  children?: number;
  roomPreference?: string[];
  dislikedFeatures?: string[];
  isGroupBooking?: boolean;
  leadScore?: "low" | "medium" | "high";
  source?: {
    roomId?: "customer" | "system_default" | "inferred";
    checkIn?: "customer" | "system_default" | "inferred";
    checkOut?: "customer" | "system_default" | "inferred";
    guests?: "customer" | "system_default" | "inferred";
  };
}

export interface LineConversationMemory {
  bookingLead?: BookingLead;
  handoffPending?: {
    reason: LineHandoffReason;
    priority: LineHandoffRequest["priority"];
    requestedAt: string;
    lastCustomerMessage?: string;
  };
}

export interface LineIntentEntities {
  roomTypeName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  guestName?: string;
  phone?: string;
  roomPreference?: string[];
  dislikedFeatures?: string[];
  isGroupBooking?: boolean;
  leadScore?: "low" | "medium" | "high";
}

export interface LineIntentEntityExtraction {
  language: SupportedLineLanguage;
  primaryIntent: LineIntent;
  intents: LineIntent[];
  entities: LineIntentEntities;
  handoff?: LineHandoffRequest | null;
}

export interface AiGenerateInput {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface AiGenerateResult {
  text: string;
  provider: AiProviderName;
  model: string;
}
