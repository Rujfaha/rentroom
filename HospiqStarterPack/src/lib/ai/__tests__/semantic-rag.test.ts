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
    keywords: [],
  },
];

describe("retrieveFaqsWithSemanticFallback", () => {
  it("uses semantic search when keyword retrieval has no keyword match", async () => {
    const result = await retrieveFaqsWithSemanticFallback({
      hotelId: "hotel-1",
      faqs,
      message: "Where can I park?",
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
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("semantic-1");
    expect(result[0]?.score).toBe(0.91);
  });
});
