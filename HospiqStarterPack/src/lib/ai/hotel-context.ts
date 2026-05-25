import { createSupabaseAdminClient } from "../supabase/admin";
import type { HospiqAiContext, LineConversationMemory } from "./types";

interface HotelRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  has_webbooking: boolean;
  webbooking_url: string | null;
}

interface RoomtypeRow {
  id: string;
  name: string;
  description: string | null;
  mood_description: string | null;
  base_price: number | string | null;
  standard_capacity: number | null;
  max_capacity: number | null;
  total_rooms: number | null;
  room_size: string | null;
  is_featured: boolean | null;
  price_note: string | null;
}

interface RoomAmenityRow {
  roomtype_id: string;
  name: string;
}

interface RoomInventoryRow {
  roomtype_id: string;
  status: string;
}

interface AiSettingRow {
  assistant_name: string | null;
  assistant_gender_tone: string | null;
  supported_languages: unknown;
  booking_cta_policy: unknown;
  handoff_policy: unknown;
  fallback_policy: unknown;
  max_reply_length: number | null;
  fallback_to_admin_enabled: boolean | null;
  admin_contact_message: string | null;
}

interface AiFaqRow {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  language: string | null;
  keywords: unknown;
}

interface LineSessionRow {
  memory: unknown;
}

export interface HotelContextRepository {
  loadContext(hotelId: string, lineUserId: string, lineSessionId?: string): Promise<HospiqAiContext>;
}

export function createEmptyMemory(): LineConversationMemory {
  return {
    bookingLead: {},
  };
}

export async function getHotelAIContext(
  hotelId: string,
  lineUserId = "",
  lineSessionId?: string,
): Promise<HospiqAiContext> {
  const supabase = createSupabaseAdminClient();
  const hotel = await fetchHotel(supabase, hotelId);
  const [roomtypes, amenities, rooms, aiSetting, faqs, session] = await Promise.all([
    fetchRoomtypes(supabase, hotelId),
    fetchRoomAmenities(supabase, hotelId),
    fetchRoomInventory(supabase, hotelId),
    fetchAiSetting(supabase, hotelId),
    fetchAiFaqs(supabase, hotelId),
    fetchLineSession(supabase, hotelId, lineUserId, lineSessionId),
  ]);

  return createHotelAiContextFromRows({
    hotel,
    roomtypes,
    amenities,
    rooms,
    aiSetting,
    faqs,
    memory: parseMemory(session?.memory),
  });
}

export function createHotelAiContextFromRows(input: {
  hotel: HotelRow;
  roomtypes: RoomtypeRow[];
  amenities: RoomAmenityRow[];
  rooms: RoomInventoryRow[];
  aiSetting: AiSettingRow | null;
  faqs: AiFaqRow[];
  memory?: LineConversationMemory;
}): HospiqAiContext {
  const amenityNamesByRoomtype = groupAmenityNames(input.amenities);
  const activeRoomCountsByType = countActiveRoomsByType(input.rooms);

  return {
    hotelId: input.hotel.id,
    hotelName: input.hotel.name,
    hasWebbooking: input.hotel.has_webbooking,
    webbookingUrl: input.hotel.webbooking_url,
    roomtypes: input.roomtypes.map((roomtype) => {
      const totalRooms = roomtype.total_rooms ?? 0;
      const activeRoomCount = activeRoomCountsByType.get(roomtype.id);

      return {
        id: roomtype.id,
        name: roomtype.name,
        description: roomtype.description,
        moodDescription: roomtype.mood_description,
        basePrice: Number(roomtype.base_price ?? 0),
        availableRooms: activeRoomCount ?? totalRooms,
        totalRooms,
        amenities: amenityNamesByRoomtype.get(roomtype.id) ?? [],
      };
    }),
    faqs: input.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      language: faq.language ?? "th",
      keywords: parseStringArray(faq.keywords),
    })),
    aiSetting: {
      assistantName: input.aiSetting?.assistant_name || "Hospiq",
      assistantGenderTone: input.aiSetting?.assistant_gender_tone || "female_polite",
      supportedLanguages: parseStringArray(input.aiSetting?.supported_languages, ["th"]),
      bookingCtaPolicy: parsePolicy(input.aiSetting?.booking_cta_policy),
      handoffPolicy: parsePolicy(input.aiSetting?.handoff_policy),
      fallbackPolicy: parsePolicy(input.aiSetting?.fallback_policy),
      maxReplyLength: input.aiSetting?.max_reply_length ?? 700,
      fallbackToAdminEnabled: input.aiSetting?.fallback_to_admin_enabled ?? true,
      adminContactMessage: input.aiSetting?.admin_contact_message ?? null,
    },
    memory: input.memory ?? createEmptyMemory(),
  };
}

async function fetchHotel(supabase: ReturnType<typeof createSupabaseAdminClient>, hotelId: string): Promise<HotelRow> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, description, address, contact_phone, contact_email, has_webbooking, webbooking_url")
    .eq("id", hotelId)
    .single()
    .returns<HotelRow>();

  if (error || !data) throw new Error(`Hotel not found: ${error?.message ?? "empty result"}`);
  return data;
}

async function fetchRoomtypes(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
): Promise<RoomtypeRow[]> {
  const { data, error } = await supabase
    .from("roomtypes")
    .select("id, name, description, mood_description, base_price, standard_capacity, max_capacity, total_rooms, room_size, is_featured, price_note")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("base_price", { ascending: true })
    .returns<RoomtypeRow[]>();

  if (error) throw new Error(`Roomtypes fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchRoomAmenities(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
): Promise<RoomAmenityRow[]> {
  const { data, error } = await supabase
    .from("roomtype_amenities")
    .select("roomtype_id, name")
    .eq("hotel_id", hotelId)
    .returns<RoomAmenityRow[]>();

  if (error) throw new Error(`Room amenities fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchRoomInventory(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
): Promise<RoomInventoryRow[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("roomtype_id, status")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .in("status", ["available", "occupied"])
    .returns<RoomInventoryRow[]>();

  if (error) throw new Error(`Room inventory fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchAiSetting(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
): Promise<AiSettingRow | null> {
  const { data, error } = await supabase
    .from("ai_settings")
    .select("assistant_name, assistant_gender_tone, supported_languages, booking_cta_policy, handoff_policy, fallback_policy, max_reply_length, fallback_to_admin_enabled, admin_contact_message")
    .eq("hotel_id", hotelId)
    .maybeSingle()
    .returns<AiSettingRow | null>();

  if (error) throw new Error(`AI setting fetch failed: ${error.message}`);
  return data ?? null;
}

async function fetchAiFaqs(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
): Promise<AiFaqRow[]> {
  const { data, error } = await supabase
    .from("ai_faqs")
    .select("id, question, answer, category, language, keywords")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(20)
    .returns<AiFaqRow[]>();

  if (error) throw new Error(`AI FAQs fetch failed: ${error.message}`);
  return data ?? [];
}

async function fetchLineSession(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  hotelId: string,
  lineUserId: string,
  lineSessionId?: string,
): Promise<LineSessionRow | null> {
  let query = supabase
    .from("line_sessions")
    .select("memory")
    .eq("hotel_id", hotelId)
    .limit(1);

  query = lineSessionId ? query.eq("id", lineSessionId) : query.eq("line_user_id", lineUserId);

  const { data, error } = await query.maybeSingle().returns<LineSessionRow | null>();

  if (error) throw new Error(`LINE session fetch failed: ${error.message}`);
  return data ?? null;
}

function groupAmenityNames(rows: RoomAmenityRow[]): Map<string, string[]> {
  return rows.reduce((groups, row) => {
    const next = groups.get(row.roomtype_id) ?? [];
    next.push(row.name);
    groups.set(row.roomtype_id, next);
    return groups;
  }, new Map<string, string[]>());
}

function countActiveRoomsByType(rows: RoomInventoryRow[]): Map<string, number> {
  return rows.reduce((counts, row) => {
    counts.set(row.roomtype_id, (counts.get(row.roomtype_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function parseMemory(value: unknown): LineConversationMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return createEmptyMemory();
  const source = value as Partial<LineConversationMemory>;
  return {
    bookingLead: source.bookingLead && typeof source.bookingLead === "object" ? source.bookingLead : {},
    handoffPending: source.handoffPending === true,
    language: typeof source.language === "string" ? source.language : undefined,
  };
}

function parseStringArray(value: unknown, fallback: string[] = []): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parseStringArray(parsed, fallback);
    } catch {
      return value.trim() ? [value.trim()] : fallback;
    }
  }
  return fallback;
}

function parsePolicy(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
