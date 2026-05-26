import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAiProvider } from "@/lib/ai/provider";
import { toPgVector } from "@/lib/ai/pgvector";

interface CreateFaqInput {
  question: string;
  answer: string;
  category?: string;
  language: string;
  keywords: string[];
}

interface FaqEmbeddingProvider {
  embed(text: string): Promise<{ embedding: number[] }>;
}

export const aiRepository = {
  async listFaqs(hotelId: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_faqs")
      .select("*")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async createFaqs(
    hotelId: string,
    faqs: CreateFaqInput[],
    embeddingProvider = getFaqEmbeddingProvider(),
  ) {
    if (!faqs.length) return [];

    const supabase = createSupabaseAdminClient();
    const rows = await Promise.all(
      faqs.map(async (faq, index) => {
        const embedding = embeddingProvider
          ? await embeddingProvider.embed(buildFaqEmbeddingText(faq))
          : null;

        return {
          hotel_id: hotelId,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          language: faq.language,
          keywords: faq.keywords,
          sort_order: index,
          embedding: embedding?.embedding.length ? toPgVector(embedding.embedding) : null,
        };
      }),
    );

    const { data, error } = await supabase
      .from("ai_faqs")
      .insert(rows)
      .select("*");

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

function getFaqEmbeddingProvider(): FaqEmbeddingProvider | undefined {
  const provider = getAiProvider();
  if (!provider.embed) return undefined;
  return { embed: provider.embed.bind(provider) };
}

function buildFaqEmbeddingText(faq: CreateFaqInput) {
  const keywords = faq.keywords.length ? `\nKeywords: ${faq.keywords.join(", ")}` : "";
  const category = faq.category ? `\nCategory: ${faq.category}` : "";
  return `Question: ${faq.question}\nAnswer: ${faq.answer}\nLanguage: ${faq.language}${category}${keywords}`;
}
