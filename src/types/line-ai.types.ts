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

export type LineIntent = "availability" | "availability_payment" | "payment" | "price" | "promotion" | "contact" | "booking" | "handoff" | "general";
export type SupportedLineLanguage = "th" | "zh" | "en" | "ja" | "es" | "ar";

export type LineHandoffReason =
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
}

export interface LineConversationMemory {
  bookingLead?: BookingLead;
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
