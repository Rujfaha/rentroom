import type { HospiqAiContext } from "./types";

export function buildHotelPrompt(context: HospiqAiContext, userMessage: string): string {
  return JSON.stringify({
    hotelId: context.hotelId,
    hotelName: context.hotelName,
    roomtypes: context.roomtypes,
    faqs: context.faqs,
    userMessage,
  });
}
