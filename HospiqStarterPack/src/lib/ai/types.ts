export type StarterAiIntent =
  | "empty"
  | "room_inquiry"
  | "room_overview"
  | "room_detail"
  | "room_recommendation"
  | "availability"
  | "availability_check"
  | "price_inquiry"
  | "cheapest_room"
  | "booking_intent"
  | "booking_ready"
  | "group_booking"
  | "policy_question"
  | "payment"
  | "promotion"
  | "contact"
  | "amenities_question"
  | "greeting"
  | "handoff_request"
  | "handoff_required"
  | "general";

export interface LineConversationMemory {
  bookingLead: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomTypeName?: string;
    guestName?: string;
    phone?: string;
    roomPreference?: string[];
    dislikedFeatures?: string[];
    isGroupBooking?: boolean;
    leadScore?: "low" | "medium" | "high";
  };
  handoffPending?: boolean;
  language?: string;
}

export interface HospiqAiContext {
  hotelId: string;
  hotelName: string;
  hasWebbooking: boolean;
  webbookingUrl: string | null;
  roomtypes: Array<{
    id: string;
    name: string;
    description: string | null;
    moodDescription: string | null;
    basePrice: number;
    standardCapacity: number;
    maxCapacity: number;
    availableRooms: number | null;
    totalRooms: number;
    maxExtraBeds: number;
    extraBedPrice: number;
    priceNote: string | null;
    amenities: string[];
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
    language: string;
    keywords: string[];
    score?: number;
  }>;
  aiSetting: {
    assistantName: string;
    assistantGenderTone: string;
    supportedLanguages: string[];
    bookingCtaPolicy: Record<string, unknown>;
    handoffPolicy: Record<string, unknown>;
    fallbackPolicy: Record<string, unknown>;
    maxReplyLength: number;
    fallbackToAdminEnabled: boolean;
    adminContactMessage: string | null;
  };
  memory: LineConversationMemory;
  knowledge?: HospiqAiKnowledge;
}

export interface HospiqBrandProfile {
  productName: "Hospiq";
  role: "hotel_saas_assistant";
  rules: string[];
}

export interface HospiqAiKnowledge {
  brand: HospiqBrandProfile;
  settings: {
    supportedLanguages: string[];
    bookingCtaPolicy: Record<string, unknown>;
    handoffPolicy: Record<string, unknown>;
    fallbackPolicy: Record<string, unknown>;
    maxReplyLength: number;
    fallbackToAdminEnabled: boolean;
    adminContactMessage: string | null;
  };
  faqs: HospiqAiContext["faqs"];
  testcases: Array<{
    id: string;
    userMessage: string;
    expectedIntent: string | null;
    expectedEntities: Record<string, unknown>;
    expectedBehavior: string | null;
    goldenReply: string | null;
    language: string;
    tags: string[];
  }>;
}

export interface StarterPromptPayload {
  identity: {
    brandName: string;
    hotelName: string;
    role: string;
  };
  brandRules: string[];
  persona: {
    identity: string;
    styleRules: string[];
    avoidRules: string[];
  };
  hospitalitySales: {
    hospitalityRules: string[];
    salesRules: string[];
    ctaStrategy: string;
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
  };
  aiKnowledge: Record<string, unknown>;
  hotelData: {
    hasWebbooking: boolean;
    webbookingUrl: string | null;
    roomtypes: HospiqAiContext["roomtypes"];
  };
  retrievedFaqs: HospiqAiContext["faqs"];
  policies: {
    supportedLanguages: string[];
    bookingCtaPolicy: Record<string, unknown>;
    handoffPolicy: Record<string, unknown>;
    fallbackPolicy: Record<string, unknown>;
    maxReplyLength: number;
  };
  memory: LineConversationMemory;
  userMessage: string;
  intent: StarterAiIntent;
}

export interface GenerateHospiqReplyInput {
  hotelId: string;
  lineUserId: string;
  message: string;
  lineSessionId?: string;
  context?: HospiqAiContext;
}

export interface GenerateHospiqReplyResult {
  reply: string;
  intent: StarterAiIntent;
  aiResponseSource: string;
  aiProvider: string | null;
  aiModel: string | null;
  prompt: StarterPromptPayload;
  handoffRequired: boolean;
  handoffReason: StarterHandoffRequest["reason"] | null;
  handoffPriority: StarterHandoffRequest["priority"] | null;
  memoryUpdate: Partial<LineConversationMemory>;
  language: string;
  entities: StarterIntentEntities;
}

export interface AiGenerateInput {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}

export interface AiGenerateResult {
  provider: string;
  model: string;
  text: string;
}

export interface AiEmbeddingResult {
  provider: string;
  model: string;
  embedding: number[];
}

export interface StarterIntentEntities {
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

export interface StarterHandoffRequest {
  required: boolean;
  reason:
    | "admin_request"
    | "payment_issue"
    | "refund"
    | "complaint"
    | "cancellation"
    | "special_approval"
    | "group_booking"
    | "booking_ready";
  priority: "normal" | "high";
}

export interface StarterIntentEntityExtraction {
  language: string;
  primaryIntent: StarterAiIntent;
  intents: StarterAiIntent[];
  entities: StarterIntentEntities;
  handoff: StarterHandoffRequest | null;
  provider?: string;
  model?: string;
}
