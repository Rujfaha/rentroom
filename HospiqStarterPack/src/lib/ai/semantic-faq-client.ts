import { createSupabaseAdminClient } from "../supabase/admin";
import { toPgVector } from "./pgvector";
import type { SemanticFaqClient, SemanticFaqRow } from "./rag-retriever";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function createSupabaseSemanticFaqClient(
  createClient: () => SupabaseAdminClient = createSupabaseAdminClient,
): SemanticFaqClient {
  return {
    async searchFaqs(input) {
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("match_ai_faqs", {
          query_embedding: toPgVector(input.embedding),
          match_hotel_id: input.hotelId,
          match_language: input.language,
          match_threshold: input.matchThreshold,
          match_count: input.matchCount,
        });

      if (error) throw new Error(error.message);
      return (data ?? []) as SemanticFaqRow[];
    },
  };
}
