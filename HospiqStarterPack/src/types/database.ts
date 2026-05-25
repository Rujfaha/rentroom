export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface StarterPackDatabase {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_role: "super_admin" | "hotel_admin";
      account_status: "active" | "inactive" | "pending";
      hotel_status: "active" | "inactive" | "setup_required";
      booking_status: "lead" | "pending" | "confirmed" | "cancelled" | "rejected" | "completed";
      booking_source: "line_ai" | "manual_admin" | "webbooking" | "other";
      line_role: "guest" | "hotel_admin" | "unknown";
      chat_direction: "incoming" | "outgoing";
      hotel_image_type: "banner" | "showcase" | "gallery";
    };
  };
}
