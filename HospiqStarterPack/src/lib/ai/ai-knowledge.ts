import { HOSPIQ_BRAND_PROFILE } from "./brand-profile";
import type { HospiqAiContext, HospiqAiKnowledge } from "./types";

export function createHospiqAiKnowledge(input: {
  aiSetting: HospiqAiContext["aiSetting"];
  faqs: HospiqAiContext["faqs"];
  testcases?: HospiqAiKnowledge["testcases"];
}): HospiqAiKnowledge {
  return {
    brand: HOSPIQ_BRAND_PROFILE,
    settings: {
      supportedLanguages: input.aiSetting.supportedLanguages,
      bookingCtaPolicy: input.aiSetting.bookingCtaPolicy,
      handoffPolicy: input.aiSetting.handoffPolicy,
      fallbackPolicy: input.aiSetting.fallbackPolicy,
      maxReplyLength: input.aiSetting.maxReplyLength,
      fallbackToAdminEnabled: input.aiSetting.fallbackToAdminEnabled,
      adminContactMessage: input.aiSetting.adminContactMessage,
    },
    faqs: input.faqs,
    testcases: input.testcases ?? [],
  };
}

export function formatAiKnowledgeForPrompt(knowledge: HospiqAiKnowledge): Record<string, unknown> {
  return {
    brand: knowledge.brand,
    settings: knowledge.settings,
    faqExamples: knowledge.faqs.map((faq) => ({
      id: faq.id,
      category: faq.category,
      language: faq.language,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords,
      score: faq.score ?? null,
    })),
    goldenTestcaseExamples: knowledge.testcases.map((testcase) => ({
      id: testcase.id,
      language: testcase.language,
      userMessage: testcase.userMessage,
      expectedIntent: testcase.expectedIntent,
      expectedEntities: testcase.expectedEntities,
      expectedBehavior: testcase.expectedBehavior,
      goldenReply: testcase.goldenReply,
      tags: testcase.tags,
    })),
  };
}
