import type { LineConversationMemory } from "../../lib/ai/types";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import type { Json } from "../../lib/supabase/database.types";

export interface LineConfigRecord {
  channelSecret: string | null;
  channelAccessToken: string | null;
  isConfigured: boolean;
}

export interface LineSessionRecord {
  id: string;
  memory: LineConversationMemory;
}

export interface SaveLineChatHistoryInput {
  hotelId: string;
  lineSessionId: string | null;
  lineUserId: string;
  direction: "incoming" | "outgoing";
  messageType: string;
  messageText?: string | null;
  intent?: string | null;
  aiResponseSource?: string | null;
  aiProvider?: string | null;
  aiModel?: string | null;
  rawPayload?: Record<string, unknown>;
}

export interface UpdateLineSessionInput {
  hotelId: string;
  lineSessionId: string;
  status: "open" | "handoff" | "closed";
  lastIntent?: string | null;
  memory: Partial<LineConversationMemory>;
}

export interface CreateLineHandoffEventInput {
  hotelId: string;
  lineSessionId: string;
  lineUserId: string;
  reason: string;
  priority: "normal" | "high";
  sourceMessage: string;
  metadata?: Record<string, unknown>;
}

export const lineRepository = {
  async getAdminVerifyCode(hotelId: string): Promise<string | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("hotels")
      .select("admin_verify_code")
      .eq("id", hotelId)
      .maybeSingle()
      .returns<{ admin_verify_code: string | null } | null>();

    if (error) throw new Error(error.message);
    return data?.admin_verify_code ?? null;
  },

  async getLineConfig(hotelId: string): Promise<LineConfigRecord | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("line_configs")
      .select("channel_secret, channel_access_token, is_configured")
      .eq("hotel_id", hotelId)
      .maybeSingle()
      .returns<{
        channel_secret: string | null;
        channel_access_token: string | null;
        is_configured: boolean;
      } | null>();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      channelSecret: data.channel_secret,
      channelAccessToken: data.channel_access_token,
      isConfigured: data.is_configured,
    };
  },

  async upsertLineSession(hotelId: string, lineUserId: string, displayName?: string | null): Promise<LineSessionRecord> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("line_sessions")
      .upsert(
        {
          hotel_id: hotelId,
          line_user_id: lineUserId,
          display_name: displayName,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "hotel_id,line_user_id" },
      )
      .select("id, memory")
      .single()
      .returns<{ id: string; memory: unknown }>();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      memory: parseMemory(data.memory),
    };
  },

  async updateLineSession(input: UpdateLineSessionInput) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("line_sessions")
      .update({
        status: input.status,
        last_intent: input.lastIntent,
        memory: input.memory,
        last_seen_at: new Date().toISOString(),
      })
      .eq("hotel_id", input.hotelId)
      .eq("id", input.lineSessionId);

    if (error) throw new Error(error.message);
  },

  async markSessionAdminVerified(hotelId: string, lineSessionId: string) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("line_sessions")
      .update({
        role_in_line: "hotel_admin",
        admin_verified_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("hotel_id", hotelId)
      .eq("id", lineSessionId);

    if (error) throw new Error(error.message);
  },

  async insertChatHistory(input: SaveLineChatHistoryInput) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("line_chat_history")
      .insert({
        hotel_id: input.hotelId,
        line_session_id: input.lineSessionId,
        line_user_id: input.lineUserId,
        direction: input.direction,
        message_type: input.messageType,
        message_text: input.messageText,
        intent: input.intent,
        ai_response_source: input.aiResponseSource,
        ai_provider: input.aiProvider,
        ai_model: input.aiModel,
        raw_payload: (input.rawPayload ?? {}) as Json,
      });

    if (error) throw new Error(error.message);
  },

  async createHandoffEvent(input: CreateLineHandoffEventInput) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("line_handoff_events")
      .insert({
        hotel_id: input.hotelId,
        line_session_id: input.lineSessionId,
        line_user_id: input.lineUserId,
        reason: input.reason,
        priority: input.priority,
        source_message: input.sourceMessage,
        metadata: (input.metadata ?? {}) as Json,
      });

    if (error) throw new Error(error.message);
  },
};

function parseMemory(value: unknown): LineConversationMemory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { bookingLead: {} };
  const source = value as Partial<LineConversationMemory>;
  return {
    bookingLead: source.bookingLead && typeof source.bookingLead === "object" ? source.bookingLead : {},
    handoffPending: source.handoffPending === true,
    language: typeof source.language === "string" ? source.language : undefined,
  };
}
