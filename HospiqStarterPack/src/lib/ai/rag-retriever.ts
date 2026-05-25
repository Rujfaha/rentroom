import type { HospiqAiContext } from "./types";

export interface RagRetriever {
  retrieveFaqs(input: {
    hotelId: string;
    message: string;
    language: string;
    limit?: number;
  }): Promise<HospiqAiContext["faqs"]>;
}

export function selectKeywordFaqs(
  faqs: HospiqAiContext["faqs"],
  message: string,
  limit = 3,
): HospiqAiContext["faqs"] {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return [];

  return faqs
    .filter((faq) => faq.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .slice(0, limit);
}

export function retrieveRelevantFaqs(
  faqs: HospiqAiContext["faqs"],
  message: string,
  language: string,
  limit = 5,
): HospiqAiContext["faqs"] {
  const languageMatched = faqs.filter((faq) => faq.language === language);
  const source = languageMatched.length ? languageMatched : faqs;
  const keywordMatches = selectKeywordFaqs(source, message, limit);

  if (keywordMatches.length) return keywordMatches;
  return source.slice(0, limit);
}
