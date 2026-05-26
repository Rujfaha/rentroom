import type { HospiqAiContext } from "./types";

export interface RagRetriever {
  retrieveFaqs(input: {
    hotelId: string;
    message: string;
    language: string;
    limit?: number;
  }): Promise<HospiqAiContext["faqs"]>;
}

export interface SemanticFaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  language: string;
  keywords: unknown;
  score: number;
}

export interface SemanticFaqClient {
  searchFaqs(input: {
    hotelId: string;
    language: string;
    embedding: number[];
    matchThreshold: number;
    matchCount: number;
  }): Promise<SemanticFaqRow[]>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<{ embedding: number[] }>;
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

export async function retrieveFaqsWithSemanticFallback(input: {
  hotelId: string;
  faqs: HospiqAiContext["faqs"];
  message: string;
  language: string;
  embeddingProvider?: EmbeddingProvider;
  semanticClient?: SemanticFaqClient;
  limit?: number;
  threshold?: number;
}): Promise<HospiqAiContext["faqs"]> {
  const limit = input.limit ?? 5;
  const languageMatched = input.faqs.filter((faq) => faq.language === input.language);
  const localSource = languageMatched.length ? languageMatched : input.faqs;
  const keywordMatches = selectKeywordFaqs(localSource, input.message, limit);

  if (!input.embeddingProvider || !input.semanticClient) {
    return retrieveRelevantFaqs(input.faqs, input.message, input.language, limit);
  }

  try {
    const embedding = await input.embeddingProvider.embed(input.message);
    if (!embedding.embedding.length) {
      return retrieveRelevantFaqs(input.faqs, input.message, input.language, limit);
    }

    const semanticRows = await input.semanticClient.searchFaqs({
      hotelId: input.hotelId,
      language: input.language,
      embedding: embedding.embedding,
      matchThreshold: input.threshold ?? 0.5,
      matchCount: limit,
    });

    const semanticFaqs = semanticRows.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category,
      language: row.language,
      keywords: parseStringArray(row.keywords),
      score: row.score,
    }));

    return mergeFaqResults(semanticFaqs, keywordMatches, localSource, limit);
  } catch {
    return retrieveRelevantFaqs(input.faqs, input.message, input.language, limit);
  }
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value));
    } catch {
      return value.trim() ? [value.trim()] : [];
    }
  }
  return [];
}

function mergeFaqResults(
  semanticFaqs: HospiqAiContext["faqs"],
  keywordMatches: HospiqAiContext["faqs"],
  fallbackFaqs: HospiqAiContext["faqs"],
  limit: number,
) {
  const byId = new Map<string, HospiqAiContext["faqs"][number]>();

  for (const faq of [...semanticFaqs, ...keywordMatches, ...fallbackFaqs]) {
    if (!byId.has(faq.id)) byId.set(faq.id, faq);
    if (byId.size >= limit) break;
  }

  return Array.from(byId.values());
}
