import { HOSPIQ_BRAND_PROFILE } from "./brand-profile";

export function buildStarterSystemPrompt(): string {
  return [
    `Product brand: ${HOSPIQ_BRAND_PROFILE.productName}`,
    `Assistant role: ${HOSPIQ_BRAND_PROFILE.role}`,
    ...HOSPIQ_BRAND_PROFILE.rules,
    "Answer only from the provided hotel context for the current request.",
    "Never answer with facts from another hotel, tenant, project, or conversation.",
    "Use the same language as the customer when supported by the context.",
    "Keep the reply concise for LINE chat.",
    "Return only the final customer-facing reply. Do not include markdown, JSON, analysis, or hidden notes.",
  ].join("\n");
}
