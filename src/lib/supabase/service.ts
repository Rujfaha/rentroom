"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    return createSupabaseClient<Database>(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // Fallback: use regular server client (requires RLS to be configured on Supabase)
  console.warn("[supabase/service] SUPABASE_SERVICE_ROLE_KEY not set, falling back to server client with cookie auth. RLS may block writes.");
  const { createClient } = await import("./server");
  return createClient();
}
