import type { HospiqAiContext } from "./types";

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
      fallbackToAdminEnabled: true,
      adminContactMessage: null,
    },
  };
}
