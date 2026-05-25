import { describe, expect, it } from "vitest";
import { retrieveRelevantFaqs } from "../rag-retriever";
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
  {
    id: "faq-2",
    question: "Breakfast",
    answer: "Breakfast available",
    category: "food",
    language: "en",
    keywords: ["breakfast"],
  },
  {
    id: "faq-3",
    question: "Thai parking",
    answer: "มีที่จอดรถ",
    category: "facility",
    language: "th",
    keywords: ["ที่จอดรถ"],
  },
];

describe("retrieveRelevantFaqs", () => {
  it("uses keyword fast-lane within the detected language", () => {
    expect(retrieveRelevantFaqs(faqs, "Do you have parking?", "en").map((faq) => faq.id)).toEqual(["faq-1"]);
  });

  it("falls back to language-matched FAQs when no keyword matches", () => {
    expect(retrieveRelevantFaqs(faqs, "hello", "th").map((faq) => faq.id)).toEqual(["faq-3"]);
  });
});
