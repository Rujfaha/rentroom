import { describe, expect, it } from "vitest";
import { createSupabaseSemanticFaqClient } from "../semantic-faq-client";

describe("createSupabaseSemanticFaqClient", () => {
  it("calls match_ai_faqs RPC", async () => {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const client = createSupabaseSemanticFaqClient(() => ({
      rpc(name: string, args: Record<string, unknown>) {
        calls.push({ name, args });
        return Promise.resolve({
          data: [
            {
              id: "faq-1",
              question: "Parking",
              answer: "Parking available",
              category: "facility",
              language: "en",
              keywords: ["parking"],
              score: 0.92,
            },
          ],
          error: null,
        });
      },
    } as ReturnType<typeof import("../../supabase/admin").createSupabaseAdminClient>));

    const rows = await client.searchFaqs({
      hotelId: "hotel-1",
      language: "en",
      embedding: [0.1, 0.2],
      matchThreshold: 0.75,
      matchCount: 5,
    });

    expect(rows[0]?.id).toBe("faq-1");
    expect(rows[0]?.score).toBe(0.92);
    expect(calls[0]).toMatchObject({
      name: "match_ai_faqs",
      args: {
        match_hotel_id: "hotel-1",
        match_language: "en",
        match_threshold: 0.75,
        match_count: 5,
      },
    });
  });
});
