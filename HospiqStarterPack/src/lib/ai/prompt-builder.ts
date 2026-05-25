import type { HospiqAiContext, StarterAiIntent, StarterPromptPayload } from "./types";

export function buildStarterPromptPayload(
  context: HospiqAiContext,
  userMessage: string,
  intent: StarterAiIntent,
): StarterPromptPayload {
  return {
    identity: {
      assistantName: context.aiSetting.assistantName,
      hotelName: context.hotelName,
      tone: context.aiSetting.assistantGenderTone,
    },
    hotelData: {
      hasWebbooking: context.hasWebbooking,
      webbookingUrl: context.webbookingUrl,
      roomtypes: context.roomtypes,
    },
    retrievedFaqs: context.faqs,
    policies: {
      supportedLanguages: context.aiSetting.supportedLanguages,
      bookingCtaPolicy: context.aiSetting.bookingCtaPolicy,
      handoffPolicy: context.aiSetting.handoffPolicy,
      fallbackPolicy: context.aiSetting.fallbackPolicy,
      maxReplyLength: context.aiSetting.maxReplyLength,
    },
    memory: context.memory,
    userMessage,
    intent,
  };
}
