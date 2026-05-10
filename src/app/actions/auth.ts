"use server";

import { createClient } from "@/lib/supabase/server";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { User, UserRole } from "@/types/database.types";

export type ActionState = {
  error?: string;
  success?: boolean;
};

type LoginUser = User & {
  user_hotels?: Array<{
    hotel_id: string;
    hotels?: { name: string } | null;
  }>;
};

type UsersUpdateQuery = {
  update(values: Partial<User>): {
    eq(column: string, value: string): Promise<unknown>;
  };
};

export async function loginAction(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState | undefined> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*, user_hotels(hotel_id, hotels(name))")
    .eq("email", username) // we use email column to store username
    .single();

  if (error || !data) {
    return { error: "ไม่พบผู้ใช้งาน หรือ ข้อมูลไม่ถูกต้อง" };
  }

  const user = data as LoginUser;

  if (!user.is_active) {
    return { error: "บัญชีผู้ใช้งานนี้ถูกปิดการใช้งาน" };
  }

  // Validate with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  const role = user.role as UserRole;
  let hotelId: string | null = null;
  let hotelName: string | null = null;

  if (role !== "super_admin") {
    const userHotel = user.user_hotels?.[0];
    if (!userHotel) {
      return { error: "ผู้ใช้งานนี้ยังไม่ได้ผูกกับโรงแรมใดๆ" };
    }
    hotelId = userHotel.hotel_id;
    hotelName = userHotel.hotels?.name ?? null;
  }

  // Create JWT session
  await createSession({
    userId: user.id,
    role,
    hotelId,
    hotelName,
    fullName: user.full_name,
  });

  await (supabase.from("users") as unknown as UsersUpdateQuery)
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  // Redirect based on role
  if (role === "super_admin") {
    redirect("/superadmin");
  } else if (role === "staff") {
    redirect("/admin/rooms");
  } else {
    redirect("/admin");
  }
}

export async function expireSessionAction() {
  await deleteSession();
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
