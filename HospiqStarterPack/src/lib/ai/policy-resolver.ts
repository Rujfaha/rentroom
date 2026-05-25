import type { HospiqAiContext, StarterAiIntent } from "./types";

export interface ResolvedAiPolicy {
  supportedLanguages: string[];
  maxReplyLength: number;
  shouldHandoff: boolean;
  canOfferBookingLink: boolean;
}

function getBooleanPolicy(policy: Record<string, unknown>, key: string, fallback: boolean) {
  const value = policy[key];
  return typeof value === "boolean" ? value : fallback;
}

export function resolveAiPolicy(context: HospiqAiContext, intent: StarterAiIntent): ResolvedAiPolicy {
  const handoffByIntent = intent === "handoff_request";
  const handoffByPolicy = getBooleanPolicy(context.aiSetting.handoffPolicy, "always_handoff", false);
  const canOfferBookingLink =
    context.hasWebbooking &&
    Boolean(context.webbookingUrl) &&
    getBooleanPolicy(context.aiSetting.bookingCtaPolicy, "enabled", true);

  return {
    supportedLanguages: context.aiSetting.supportedLanguages,
    maxReplyLength: context.aiSetting.maxReplyLength,
    shouldHandoff: handoffByIntent || handoffByPolicy,
    canOfferBookingLink,
  };
}
