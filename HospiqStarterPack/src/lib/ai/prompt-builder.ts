import { createHospiqAiKnowledge, formatAiKnowledgeForPrompt } from "./ai-knowledge";
import type { HospiqAiContext, StarterAiIntent, StarterPromptPayload } from "./types";

export function buildStarterPromptPayload(
  context: HospiqAiContext,
  userMessage: string,
  intent: StarterAiIntent,
): StarterPromptPayload {
  const knowledge = context.knowledge ?? createHospiqAiKnowledge({
    aiSetting: context.aiSetting,
    faqs: context.faqs,
  });

  return {
    identity: {
      brandName: knowledge.brand.productName,
      hotelName: context.hotelName,
      role: knowledge.brand.role,
    },
    brandRules: knowledge.brand.rules,
    aiKnowledge: formatAiKnowledgeForPrompt(knowledge),
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
