import type { HotelAiKnowledge, HotelAiSettingsSummary, HotelAiTestcaseSummary, HotelFaqSummary, SupportedLineLanguage } from "@/types/line-ai.types";

type ServiceClient = Awaited<ReturnType<typeof import("../supabase/service").createServiceClient>>;

interface AiSettingRow {
  assistant_name: string;
  tone: string | null;
  supported_languages: unknown;
  booking_cta_policy: string | null;
  handoff_policy: string | null;
  fallback_policy: string | null;
  metadata: Record<string, unknown> | null;
}

interface FaqRow {
  question: string;
  answer: string;
  category: string | null;
  language: string;
  keywords: unknown;
}

interface TestcaseRow {
  user_message: string;
  expected_intent: string | null;
  expected_entities: Record<string, unknown> | null;
  expected_behavior: string | null;
  golden_reply: string | null;
  language: string;
  tags: unknown;
}

export async function fetchHotelAiKnowledge(
  supabase: ServiceClient,
  hotelId: string,
  language: SupportedLineLanguage = "th",
): Promise<HotelAiKnowledge> {
  const [settings, faqs, testcases] = await Promise.all([
    fetchAiSettings(supabase, hotelId),
    fetchFaqs(supabase, hotelId, language),
    fetchTestcases(supabase, hotelId, language),
  ]);

  return { settings, faqs, testcases };
}

export function formatHotelAiKnowledgePrompt(knowledge: HotelAiKnowledge | undefined): string {
  if (!knowledge) return ["AI settings:", "not configured", "FAQ examples from database:", "none", "Golden testcases from database:", "none"].join("\n");
  const settings = knowledge.settings
    ? [
        `assistantName: ${knowledge.settings.assistantName}`,
        knowledge.settings.tone ? `tone: ${knowledge.settings.tone}` : null,
        knowledge.settings.bookingCtaPolicy ? `bookingCtaPolicy: ${knowledge.settings.bookingCtaPolicy}` : null,
        knowledge.settings.handoffPolicy ? `handoffPolicy: ${knowledge.settings.handoffPolicy}` : null,
        knowledge.settings.fallbackPolicy ? `fallbackPolicy: ${knowledge.settings.fallbackPolicy}` : null,
        `supportedLanguages: ${knowledge.settings.supportedLanguages.join(", ") || "not configured"}`,
      ].filter(Boolean)
    : ["not configured"];

  const faqs = knowledge.faqs.map((faq, index) =>
    JSON.stringify({
      n: index + 1,
      category: faq.category,
      language: faq.language,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords,
    }),
  );

  const testcases = knowledge.testcases.map((testcase, index) =>
    JSON.stringify({
      n: index + 1,
      language: testcase.language,
      userMessage: testcase.userMessage,
      expectedIntent: testcase.expectedIntent,
      expectedEntities: testcase.expectedEntities,
      expectedBehavior: testcase.expectedBehavior,
      goldenReply: testcase.goldenReply,
      tags: testcase.tags,
    }),
  );

  return [
    "AI settings:",
    ...settings,
    "FAQ examples from database:",
    ...(faqs.length ? faqs : ["none"]),
    "Golden testcases from database:",
    ...(testcases.length ? testcases : ["none"]),
  ].join("\n");
}

async function fetchAiSettings(supabase: ServiceClient, hotelId: string): Promise<HotelAiSettingsSummary | null> {
  const { data, error } = await supabase
    .from("hotel_ai_settings")
    .select("assistant_name, tone, supported_languages, booking_cta_policy, handoff_policy, fallback_policy, metadata")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .maybeSingle()
    .returns<AiSettingRow | null>();

  if (error) {
    console.error("LINE AI settings fetch error:", error);
    return null;
  }
  if (!data) return null;

  return {
    assistantName: data.assistant_name,
    tone: data.tone,
    supportedLanguages: readStringArray(data.supported_languages),
    bookingCtaPolicy: data.booking_cta_policy,
    handoffPolicy: data.handoff_policy,
    fallbackPolicy: data.fallback_policy,
    metadata: data.metadata ?? {},
  };
}

async function fetchFaqs(supabase: ServiceClient, hotelId: string, language: SupportedLineLanguage): Promise<HotelFaqSummary[]> {
  const { data, error } = await supabase
    .from("hotel_faqs")
    .select("question, answer, category, language, keywords")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .in("language", [language, "all"])
    .order("sort_order", { ascending: true })
    .limit(8)
    .returns<FaqRow[]>();

  if (error) {
    console.error("LINE AI FAQ fetch error:", error);
    return [];
  }

  return (data ?? []).map((faq) => ({
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    language: faq.language,
    keywords: readStringArray(faq.keywords),
  }));
}

async function fetchTestcases(supabase: ServiceClient, hotelId: string, language: SupportedLineLanguage): Promise<HotelAiTestcaseSummary[]> {
  const { data, error } = await supabase
    .from("hotel_ai_testcases")
    .select("user_message, expected_intent, expected_entities, expected_behavior, golden_reply, language, tags")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .in("language", [language, "all"])
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<TestcaseRow[]>();

  if (error) {
    console.error("LINE AI testcase fetch error:", error);
    return [];
  }

  return (data ?? []).map((testcase) => ({
    userMessage: testcase.user_message,
    expectedIntent: testcase.expected_intent,
    expectedEntities: testcase.expected_entities ?? {},
    expectedBehavior: testcase.expected_behavior,
    goldenReply: testcase.golden_reply,
    language: testcase.language,
    tags: readStringArray(testcase.tags),
  }));
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
