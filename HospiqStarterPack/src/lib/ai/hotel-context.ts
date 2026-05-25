import type { HospiqAiContext, LineConversationMemory } from "./types";

export interface HotelContextRepository {
  loadContext(hotelId: string, lineUserId: string, lineSessionId?: string): Promise<HospiqAiContext>;
}

export function createEmptyMemory(): LineConversationMemory {
  return {
    bookingLead: {},
  };
}

export async function getHotelAIContext(hotelId: string): Promise<HospiqAiContext> {
  return {
    hotelId,
    hotelName: "Hospiq",
    hasWebbooking: false,
    webbookingUrl: null,
    roomtypes: [],
    faqs: [],
    aiSetting: {
      assistantName: "Hospiq",
      assistantGenderTone: "female_polite",
      supportedLanguages: ["th"],
      bookingCtaPolicy: {},
      handoffPolicy: {},
      fallbackPolicy: {},
      maxReplyLength: 700,
      fallbackToAdminEnabled: true,
      adminContactMessage: null,
    },
    memory: createEmptyMemory(),
  };
}
