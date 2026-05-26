export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          hotel_id: string | null
          id: string
          role: Database["public"]["Enums"]["account_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          hotel_id?: string | null
          id: string
          role: Database["public"]["Enums"]["account_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          hotel_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["account_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          embedding: string | null
          hotel_id: string
          id: string
          is_active: boolean
          keywords: Json
          language: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          embedding?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          keywords?: Json
          language?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          embedding?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          keywords?: Json
          language?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_faqs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          admin_contact_message: string | null
          assistant_gender_tone: string
          assistant_name: string
          booking_cta_policy: string | null
          created_at: string
          fallback_policy: string | null
          fallback_to_admin_enabled: boolean
          handoff_policy: string | null
          hotel_id: string
          id: string
          language: string
          max_reply_length: number
          sale_mode_enabled: boolean
          supported_languages: Json
          system_prompt: string | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          admin_contact_message?: string | null
          assistant_gender_tone?: string
          assistant_name?: string
          booking_cta_policy?: string | null
          created_at?: string
          fallback_policy?: string | null
          fallback_to_admin_enabled?: boolean
          handoff_policy?: string | null
          hotel_id: string
          id?: string
          language?: string
          max_reply_length?: number
          sale_mode_enabled?: boolean
          supported_languages?: Json
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          admin_contact_message?: string | null
          assistant_gender_tone?: string
          assistant_name?: string
          booking_cta_policy?: string | null
          created_at?: string
          fallback_policy?: string | null
          fallback_to_admin_enabled?: boolean
          handoff_policy?: string | null
          hotel_id?: string
          id?: string
          language?: string
          max_reply_length?: number
          sale_mode_enabled?: boolean
          supported_languages?: Json
          system_prompt?: string | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_testcases: {
        Row: {
          created_at: string
          expected_behavior: string | null
          expected_entities: Json
          expected_intent: string | null
          golden_reply: string | null
          hotel_id: string
          id: string
          is_active: boolean
          language: string
          tags: Json
          updated_at: string
          user_message: string
        }
        Insert: {
          created_at?: string
          expected_behavior?: string | null
          expected_entities?: Json
          expected_intent?: string | null
          golden_reply?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          language?: string
          tags?: Json
          updated_at?: string
          user_message: string
        }
        Update: {
          created_at?: string
          expected_behavior?: string | null
          expected_entities?: Json
          expected_intent?: string | null
          golden_reply?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          language?: string
          tags?: Json
          updated_at?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_testcases_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          admin_note: string | null
          ai_summary: string | null
          checkin_date: string | null
          checkout_date: string | null
          conversation_summary: string | null
          created_at: string
          guest_count: number
          guest_line_user_id: string | null
          guest_name: string | null
          guest_phone: string | null
          hotel_id: string
          id: string
          lead_status: Database["public"]["Enums"]["lead_status"]
          line_session_id: string | null
          note: string | null
          preferred_contact_channel: string | null
          room_count: number
          roomtype_id: string | null
          source: Database["public"]["Enums"]["booking_source"]
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          webbooking_redirected_at: string | null
        }
        Insert: {
          admin_note?: string | null
          ai_summary?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          conversation_summary?: string | null
          created_at?: string
          guest_count?: number
          guest_line_user_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          hotel_id: string
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"]
          line_session_id?: string | null
          note?: string | null
          preferred_contact_channel?: string | null
          room_count?: number
          roomtype_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          webbooking_redirected_at?: string | null
        }
        Update: {
          admin_note?: string | null
          ai_summary?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          conversation_summary?: string | null
          created_at?: string
          guest_count?: number
          guest_line_user_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          hotel_id?: string
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"]
          line_session_id?: string | null
          note?: string | null
          preferred_contact_channel?: string | null
          room_count?: number
          roomtype_id?: string | null
          source?: Database["public"]["Enums"]["booking_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          webbooking_redirected_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_line_session_id_fkey"
            columns: ["line_session_id"]
            isOneToOne: false
            referencedRelation: "line_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_roomtype_id_fkey"
            columns: ["roomtype_id"]
            isOneToOne: false
            referencedRelation: "roomtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_images: {
        Row: {
          alt_text: string | null
          created_at: string
          hotel_id: string
          id: string
          image_type: Database["public"]["Enums"]["hotel_image_type"]
          image_url: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          image_type: Database["public"]["Enums"]["hotel_image_type"]
          image_url: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          image_type?: Database["public"]["Enums"]["hotel_image_type"]
          image_url?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_images_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          admin_verify_code: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          facebook_url: string | null
          has_webbooking: boolean
          id: string
          line_oa_id: string | null
          map_url: string | null
          name: string
          onboarding_completed: boolean
          slug: string
          status: Database["public"]["Enums"]["hotel_status"]
          updated_at: string
          webbooking_url: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          admin_verify_code: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          has_webbooking?: boolean
          id?: string
          line_oa_id?: string | null
          map_url?: string | null
          name: string
          onboarding_completed?: boolean
          slug: string
          status?: Database["public"]["Enums"]["hotel_status"]
          updated_at?: string
          webbooking_url?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          admin_verify_code?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          facebook_url?: string | null
          has_webbooking?: boolean
          id?: string
          line_oa_id?: string | null
          map_url?: string | null
          name?: string
          onboarding_completed?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["hotel_status"]
          updated_at?: string
          webbooking_url?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      line_chat_history: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          ai_response_source: string | null
          created_at: string
          direction: Database["public"]["Enums"]["chat_direction"]
          hotel_id: string
          id: string
          intent: string | null
          line_session_id: string | null
          line_user_id: string | null
          message_text: string | null
          message_type: string
          raw_payload: Json
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          ai_response_source?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["chat_direction"]
          hotel_id: string
          id?: string
          intent?: string | null
          line_session_id?: string | null
          line_user_id?: string | null
          message_text?: string | null
          message_type?: string
          raw_payload?: Json
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          ai_response_source?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["chat_direction"]
          hotel_id?: string
          id?: string
          intent?: string | null
          line_session_id?: string | null
          line_user_id?: string | null
          message_text?: string | null
          message_type?: string
          raw_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "line_chat_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_chat_history_line_session_id_fkey"
            columns: ["line_session_id"]
            isOneToOne: false
            referencedRelation: "line_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      line_configs: {
        Row: {
          channel_access_token: string | null
          channel_id: string | null
          channel_secret: string | null
          created_at: string
          hotel_id: string
          id: string
          is_configured: boolean
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          channel_access_token?: string | null
          channel_id?: string | null
          channel_secret?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          is_configured?: boolean
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          channel_access_token?: string | null
          channel_id?: string | null
          channel_secret?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          is_configured?: boolean
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_configs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      line_handoff_events: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          line_session_id: string | null
          line_user_id: string | null
          metadata: Json
          priority: string
          reason: string
          resolved_at: string | null
          source_message: string | null
          status: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          line_session_id?: string | null
          line_user_id?: string | null
          metadata?: Json
          priority?: string
          reason: string
          resolved_at?: string | null
          source_message?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          line_session_id?: string | null
          line_user_id?: string | null
          metadata?: Json
          priority?: string
          reason?: string
          resolved_at?: string | null
          source_message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_handoff_events_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_handoff_events_line_session_id_fkey"
            columns: ["line_session_id"]
            isOneToOne: false
            referencedRelation: "line_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      line_sessions: {
        Row: {
          admin_verified_at: string | null
          created_at: string
          display_name: string | null
          hotel_id: string
          id: string
          last_intent: string | null
          last_seen_at: string
          line_user_id: string
          memory: Json
          role_in_line: Database["public"]["Enums"]["line_role"]
          status: Database["public"]["Enums"]["line_session_status"]
          updated_at: string
        }
        Insert: {
          admin_verified_at?: string | null
          created_at?: string
          display_name?: string | null
          hotel_id: string
          id?: string
          last_intent?: string | null
          last_seen_at?: string
          line_user_id: string
          memory?: Json
          role_in_line?: Database["public"]["Enums"]["line_role"]
          status?: Database["public"]["Enums"]["line_session_status"]
          updated_at?: string
        }
        Update: {
          admin_verified_at?: string | null
          created_at?: string
          display_name?: string | null
          hotel_id?: string
          id?: string
          last_intent?: string | null
          last_seen_at?: string
          line_user_id?: string
          memory?: Json
          role_in_line?: Database["public"]["Enums"]["line_role"]
          status?: Database["public"]["Enums"]["line_session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_sessions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          hotel_id: string
          id: string
          is_active: boolean
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          floor: string | null
          hotel_id: string
          id: string
          is_active: boolean
          notes: string | null
          room_number: string
          roomtype_id: string
          status: Database["public"]["Enums"]["starter_room_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          floor?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          room_number: string
          roomtype_id: string
          status?: Database["public"]["Enums"]["starter_room_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          floor?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          room_number?: string
          roomtype_id?: string
          status?: Database["public"]["Enums"]["starter_room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_roomtype_id_fkey"
            columns: ["roomtype_id"]
            isOneToOne: false
            referencedRelation: "roomtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      roomtype_amenities: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          name: string
          roomtype_id: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          name: string
          roomtype_id: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          name?: string
          roomtype_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roomtype_amenities_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roomtype_amenities_roomtype_id_fkey"
            columns: ["roomtype_id"]
            isOneToOne: false
            referencedRelation: "roomtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      roomtype_images: {
        Row: {
          alt_text: string | null
          created_at: string
          hotel_id: string
          id: string
          image_url: string
          is_cover: boolean
          roomtype_id: string
          sort_order: number
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          image_url: string
          is_cover?: boolean
          roomtype_id: string
          sort_order?: number
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          image_url?: string
          is_cover?: boolean
          roomtype_id?: string
          sort_order?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roomtype_images_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roomtype_images_roomtype_id_fkey"
            columns: ["roomtype_id"]
            isOneToOne: false
            referencedRelation: "roomtypes"
            referencedColumns: ["id"]
          },
        ]
      }
      roomtypes: {
        Row: {
          base_price: number
          bed_size: string | null
          bed_type: string | null
          created_at: string
          description: string | null
          extra_bed_price: number
          hotel_id: string
          id: string
          is_active: boolean
          is_featured: boolean
          max_capacity: number
          max_extra_beds: number
          mood_description: string | null
          name: string
          pet_policy: string | null
          price_note: string | null
          room_size: string | null
          sort_order: number
          standard_capacity: number
          total_rooms: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          bed_size?: string | null
          bed_type?: string | null
          created_at?: string
          description?: string | null
          extra_bed_price?: number
          hotel_id: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_capacity?: number
          max_extra_beds?: number
          mood_description?: string | null
          name: string
          pet_policy?: string | null
          price_note?: string | null
          room_size?: string | null
          sort_order?: number
          standard_capacity?: number
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          bed_size?: string | null
          bed_type?: string | null
          created_at?: string
          description?: string | null
          extra_bed_price?: number
          hotel_id?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_capacity?: number
          max_extra_beds?: number
          mood_description?: string | null
          name?: string
          pet_policy?: string | null
          price_note?: string | null
          room_size?: string | null
          sort_order?: number
          standard_capacity?: number
          total_rooms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roomtypes_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_ai_faqs: {
        Args: {
          match_count?: number
          match_hotel_id: string
          match_language: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          answer: string
          category: string
          id: string
          keywords: Json
          language: string
          question: string
          score: number
        }[]
      }
    }
    Enums: {
      account_role: "super_admin" | "hotel_admin"
      account_status: "active" | "inactive" | "pending"
      booking_source: "line_ai" | "manual_admin" | "webbooking" | "other"
      booking_status:
        | "lead"
        | "pending"
        | "confirmed"
        | "cancelled"
        | "rejected"
        | "completed"
      chat_direction: "incoming" | "outgoing"
      hotel_image_type: "banner" | "showcase" | "gallery"
      hotel_status: "active" | "inactive" | "setup_required"
      lead_status: "new" | "contacted" | "converted" | "lost"
      line_role: "guest" | "hotel_admin" | "unknown"
      line_session_status: "open" | "handoff" | "closed"
      starter_room_status: "available" | "occupied" | "maintenance" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_role: ["super_admin", "hotel_admin"],
      account_status: ["active", "inactive", "pending"],
      booking_source: ["line_ai", "manual_admin", "webbooking", "other"],
      booking_status: [
        "lead",
        "pending",
        "confirmed",
        "cancelled",
        "rejected",
        "completed",
      ],
      chat_direction: ["incoming", "outgoing"],
      hotel_image_type: ["banner", "showcase", "gallery"],
      hotel_status: ["active", "inactive", "setup_required"],
      lead_status: ["new", "contacted", "converted", "lost"],
      line_role: ["guest", "hotel_admin", "unknown"],
      line_session_status: ["open", "handoff", "closed"],
      starter_room_status: ["available", "occupied", "maintenance", "inactive"],
    },
  },
} as const
