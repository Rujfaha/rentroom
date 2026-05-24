import type { AiGenerateResult, BookingLead, LineConversationMemory, LineHandoffReason, LineHandoffRequest, LineMessageHistoryItem } from "@/types/line-ai.types";

type ServiceClient = Awaited<ReturnType<typeof import("../supabase/service").createServiceClient>>;

interface ConversationIdRow {
  id: string;
}

interface ConversationMemoryRow {
  metadata: Record<string, unknown> | null;
}

interface RecentLineMessageRow {
  direction: string;
  text: string | null;
  created_at: string;
}

interface DbResult {
  error: { message?: string } | null;
}

interface SelectMaybeSingleTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          order(column: string, options: { ascending: boolean }): {
            limit(count: number): {
              maybeSingle(): Promise<{ data: TResult | null; error: { message?: string } | null }>;
            };
          };
        };
      };
    };
  };
}

interface InsertSelectSingleTable<TInsert, TResult> {
  insert(value: TInsert): {
    select(columns: string): {
      single(): Promise<{ data: TResult | null; error: { message?: string } | null }>;
    };
  };
}

interface InsertOnlyTable<TInsert> {
  insert(value: TInsert): Promise<DbResult>;
}

interface UpsertOnlyTable<TInsert> {
  upsert(value: TInsert, options: { onConflict: string }): Promise<DbResult>;
}

interface UpdateByIdTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): Promise<DbResult>;
  };
}

interface SelectConversationMemoryTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: TResult | null; error: { message?: string } | null }>;
    };
  };
}

interface SelectRecentMessagesTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options: { ascending: boolean }): {
        limit(count: number): Promise<{ data: TResult[] | null; error: { message?: string } | null }>;
      };
    };
  };
}

interface LineUserUpsert {
  hotel_id: string;
  line_user_id: string;
}

interface LineConversationInsert {
  hotel_id: string;
  line_user_id: string;
  status: string;
  last_message_at: string;
}

interface LineConversationUpdate {
  last_message_at: string;
  last_intent?: string | null;
  metadata?: Record<string, unknown>;
}

interface LineMessageInsert {
  hotel_id: string;
  line_user_id: string | null;
  conversation_id: string | null;
  direction: "inbound" | "outbound";
  message_type: string;
  line_message_id: string | null;
  text: string | null;
  ai_provider: string | null;
  ai_model: string | null;
  metadata: Record<string, unknown>;
}

interface LineHandoffEventInsert {
  hotel_id: string;
  line_user_id: string | null;
  conversation_id: string | null;
  reason: string;
  priority: string;
  status: string;
  source_message: string | null;
  metadata: Record<string, unknown>;
}

export interface LineMessageLogInput {
  hotelId: string;
  lineUserId: string | null;
  conversationId: string | null;
  direction: "inbound" | "outbound";
  messageType: string;
  lineMessageId?: string | null;
  text?: string | null;
  ai?: Pick<AiGenerateResult, "provider" | "model"> | null;
  metadata?: Record<string, unknown>;
}

export async function ensureLineConversation(
  supabase: ServiceClient,
  hotelId: string,
  lineUserId: string | null
): Promise<string | null> {
  if (!lineUserId) return null;

  const lineUsersTable = supabase.from("line_users") as unknown as UpsertOnlyTable<LineUserUpsert>;
  await lineUsersTable.upsert(
    {
      hotel_id: hotelId,
      line_user_id: lineUserId,
    },
    { onConflict: "hotel_id,line_user_id" }
  );

  const lineConversationsSelectTable = supabase.from("line_conversations") as unknown as SelectMaybeSingleTable<ConversationIdRow>;
  const { data: existing, error: existingError } = await lineConversationsSelectTable
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("line_user_id", lineUserId)
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingError && existing?.id) {
    await touchLineConversation(supabase, existing.id);
    return existing.id;
  }

  const lineConversationsInsertTable = supabase.from("line_conversations") as unknown as InsertSelectSingleTable<
    LineConversationInsert,
    ConversationIdRow
  >;
  const { data: created, error: createError } = await lineConversationsInsertTable
    .insert({
      hotel_id: hotelId,
      line_user_id: lineUserId,
      status: "open",
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("LINE conversation create error:", createError);
    return null;
  }

  return created.id;
}

export async function recordLineMessage(supabase: ServiceClient, input: LineMessageLogInput): Promise<void> {
  const lineMessagesTable = supabase.from("line_messages") as unknown as InsertOnlyTable<LineMessageInsert>;
  const { error } = await lineMessagesTable.insert({
    hotel_id: input.hotelId,
    line_user_id: input.lineUserId,
    conversation_id: input.conversationId,
    direction: input.direction,
    message_type: input.messageType,
    line_message_id: input.lineMessageId ?? null,
    text: input.text ?? null,
    ai_provider: input.ai?.provider ?? null,
    ai_model: input.ai?.model ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) console.error("LINE message log error:", error);
}

export async function recordLineHandoffEvent(
  supabase: ServiceClient,
  input: {
    hotelId: string;
    lineUserId: string | null;
    conversationId: string | null;
    handoff: LineHandoffRequest | null;
    sourceMessage: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  if (!input.handoff?.required) return;

  const handoffTable = supabase.from("line_handoff_events") as unknown as InsertOnlyTable<LineHandoffEventInsert>;
  const { error } = await handoffTable.insert({
    hotel_id: input.hotelId,
    line_user_id: input.lineUserId,
    conversation_id: input.conversationId,
    reason: input.handoff.reason,
    priority: input.handoff.priority,
    status: "open",
    source_message: input.sourceMessage.slice(0, 1000),
    metadata: input.metadata ?? {},
  });

  if (error) console.error("LINE handoff event log error:", error);
}

export async function getLineConversationMemory(supabase: ServiceClient, conversationId: string | null): Promise<LineConversationMemory> {
  if (!conversationId) return {};

  const conversationsTable = supabase.from("line_conversations") as unknown as SelectConversationMemoryTable<ConversationMemoryRow>;
  const { data, error } = await conversationsTable.select("metadata").eq("id", conversationId).maybeSingle();
  if (error || !data?.metadata) {
    if (error) console.error("LINE conversation memory fetch error:", error);
    return {};
  }

  return normalizeConversationMemory(data.metadata);
}

export async function updateLineConversationMemory(
  supabase: ServiceClient,
  conversationId: string | null,
  memory: LineConversationMemory,
  intent?: string
): Promise<void> {
  if (!conversationId) return;

  const lineConversationsUpdateTable = supabase.from("line_conversations") as unknown as UpdateByIdTable<LineConversationUpdate>;
  const { error } = await lineConversationsUpdateTable
    .update({
      metadata: memory as Record<string, unknown>,
      last_intent: intent ?? null,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) console.error("LINE conversation memory update error:", error);
}

export async function getRecentLineMessages(
  supabase: ServiceClient,
  conversationId: string | null,
  limit = 8
): Promise<LineMessageHistoryItem[]> {
  if (!conversationId) return [];

  const messagesTable = supabase.from("line_messages") as unknown as SelectRecentMessagesTable<RecentLineMessageRow>;
  const { data, error } = await messagesTable
    .select("direction, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("LINE recent messages fetch error:", error);
    return [];
  }

  return (data ?? [])
    .filter((item) => item.text?.trim())
    .reverse()
    .map((item) => ({
      direction: item.direction === "outbound" ? "outbound" : "inbound",
      text: item.text?.trim() ?? "",
      createdAt: item.created_at,
    }));
}

async function touchLineConversation(supabase: ServiceClient, conversationId: string): Promise<void> {
  const lineConversationsUpdateTable = supabase.from("line_conversations") as unknown as UpdateByIdTable<LineConversationUpdate>;
  const { error } = await lineConversationsUpdateTable
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) console.error("LINE conversation touch error:", error);
}

function normalizeConversationMemory(value: Record<string, unknown>): LineConversationMemory {
  const bookingLead = value.bookingLead;
  const handoffPending = value.handoffPending;
  if ((!bookingLead || typeof bookingLead !== "object") && (!handoffPending || typeof handoffPending !== "object")) return {};

  const memory: LineConversationMemory = {};
  if (handoffPending && typeof handoffPending === "object") {
    const pending = handoffPending as Record<string, unknown>;
    const reason = pending.reason;
    const priority = pending.priority;
    const requestedAt = pending.requestedAt;
    if (
      typeof reason === "string" &&
      typeof requestedAt === "string" &&
      (priority === "normal" || priority === "high")
    ) {
      memory.handoffPending = {
        reason: reason as LineHandoffReason,
        priority,
        requestedAt,
        ...(typeof pending.lastCustomerMessage === "string" ? { lastCustomerMessage: pending.lastCustomerMessage } : {}),
      };
    }
  }

  if (!bookingLead || typeof bookingLead !== "object") return memory;
  const lead = bookingLead as Record<string, unknown>;
  memory.bookingLead = {
    ...(typeof lead.checkIn === "string" ? { checkIn: lead.checkIn } : {}),
    ...(typeof lead.checkOut === "string" ? { checkOut: lead.checkOut } : {}),
    ...(typeof lead.guests === "number" ? { guests: lead.guests } : {}),
    ...(typeof lead.roomTypeName === "string" ? { roomTypeName: lead.roomTypeName } : {}),
    ...(typeof lead.guestName === "string" ? { guestName: lead.guestName } : {}),
    ...(typeof lead.phone === "string" ? { phone: lead.phone } : {}),
    ...(typeof lead.adults === "number" ? { adults: lead.adults } : {}),
    ...(typeof lead.children === "number" ? { children: lead.children } : {}),
    ...(Array.isArray(lead.roomPreference) ? { roomPreference: lead.roomPreference as string[] } : {}),
    ...(Array.isArray(lead.dislikedFeatures) ? { dislikedFeatures: lead.dislikedFeatures as string[] } : {}),
    ...(typeof lead.isGroupBooking === "boolean" ? { isGroupBooking: lead.isGroupBooking } : {}),
    ...(typeof lead.leadScore === "string" ? { leadScore: lead.leadScore as BookingLead["leadScore"] } : {}),
    ...(lead.source && typeof lead.source === "object" ? { source: lead.source as BookingLead["source"] } : {}),
  };
  return memory;
}
