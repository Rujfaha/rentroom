import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const aiRepository = {
  async createFaqs(
    hotelId: string,
    faqs: Array<{
      question: string;
      answer: string;
      category?: string;
      language: string;
      keywords: string[];
    }>,
  ) {
    if (!faqs.length) return [];

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_faqs")
      .insert(
        faqs.map((faq, index) => ({
          hotel_id: hotelId,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          language: faq.language,
          keywords: faq.keywords,
          sort_order: index,
        })),
      )
      .select("*");

    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
