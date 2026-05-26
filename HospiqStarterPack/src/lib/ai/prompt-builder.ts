import { createHospiqAiKnowledge, formatAiKnowledgeForPrompt } from "./ai-knowledge";
import { HOSPIQ_PERSONA_POLICY } from "./persona-policy";
import { buildHospitalitySalesPolicy } from "./sales-policy";
import type { HospiqAiContext, StarterAiIntent, StarterPromptPayload } from "./types";

export function buildStarterPromptPayload(
  context: HospiqAiContext,
  userMessage: string,
  intent: StarterAiIntent,
  policy?: { canOfferBookingLink: boolean; shouldHandoff: boolean },
): StarterPromptPayload {
  const knowledge = context.knowledge ?? createHospiqAiKnowledge({
    aiSetting: context.aiSetting,
    faqs: context.faqs,
  });
  const hospitalitySales = buildHospitalitySalesPolicy({
    intent,
    canOfferBookingLink: policy?.canOfferBookingLink ?? Boolean(context.hasWebbooking && context.webbookingUrl),
    shouldHandoff: policy?.shouldHandoff ?? false,
    memory: context.memory,
    roomtypes: context.roomtypes,
  });

  return {
    identity: {
      brandName: knowledge.brand.productName,
      hotelName: context.hotelName,
      role: knowledge.brand.role,
    },
    brandRules: knowledge.brand.rules,
    persona: HOSPIQ_PERSONA_POLICY,
    hospitalitySales,
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
