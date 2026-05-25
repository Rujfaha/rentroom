import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError } from "../http/api-error";
import type { CurrentAccount } from "./types";

interface AccountRow {
  id: string;
  email: string;
  full_name: string | null;
  role: CurrentAccount["role"];
  hotel_id: string | null;
  status: CurrentAccount["status"];
}

export async function getCurrentAccount(): Promise<CurrentAccount> {
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("id, email, full_name, role, hotel_id, status")
    .eq("id", authData.user.id)
    .single();

  if (error || !data) {
    throw new AppError("Account profile not found", 401, "ACCOUNT_NOT_FOUND");
  }

  const account = data as AccountRow;

  return {
    id: account.id,
    email: account.email,
    fullName: account.full_name,
    role: account.role,
    hotelId: account.hotel_id,
    status: account.status,
  };
}
