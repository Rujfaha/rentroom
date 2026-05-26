import { describe, expect, it } from "vitest";
import { retrieveFaqsWithSemanticFallback } from "../rag-retriever";
import type { HospiqAiContext } from "../types";

const faqs: HospiqAiContext["faqs"] = [
  {
    id: "faq-1",
    question: "Parking",
    answer: "Parking available",
    category: "facility",
    language: "en",
    keywords: ["parking"],
  },
];

describe("retrieveFaqsWithSemanticFallback", () => {
  it("uses semantic search before keyword fallback", async () => {
    const result = await retrieveFaqsWithSemanticFallback({
      hotelId: "hotel-1",
      faqs,
      message: "parking near the hotel",
      language: "en",
      embeddingProvider: {
        async embed() {
          return { embedding: [0.1, 0.2] };
        },
      },
      semanticClient: {
        async searchFaqs() {
          return [
            {
              id: "semantic-1",
              question: "Car park",
              answer: "There is a car park.",
              category: "facility",
              language: "en",
              keywords: ["car"],
              score: 0.91,
            },
          ];
        },
      },
      limit: 1,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("semantic-1");
    expect(result[0]?.score).toBe(0.91);
  });

  it("falls back to local FAQ retrieval when semantic search is unavailable", async () => {
    const result = await retrieveFaqsWithSemanticFallback({
      hotelId: "hotel-1",
      faqs,
      message: "parking",
      language: "en",
      embeddingProvider: {
        async embed() {
          return { embedding: [0.1, 0.2] };
        },
      },
      semanticClient: {
        async searchFaqs() {
          throw new Error("RPC is not available");
        },
      },
    });

    expect(result.map((faq) => faq.id)).toEqual(["faq-1"]);
  });
});
