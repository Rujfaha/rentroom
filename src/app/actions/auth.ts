"use server";

import { createClient } from "@/lib/supabase/server";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types/database.types";

export type ActionState = {
  error?: string;
  success?: boolean;
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

  const user = data as any;

  // Validate with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return { error: "รหัสผ่านไม่ถูกต้อง" };
  }

  const role = user.role as UserRole;
  let hotelId = null;
  let hotelName = null;

  if (role !== "super_admin") {
    const userHotel = user.user_hotels?.[0];
    if (!userHotel) {
      return { error: "ผู้ใช้งานนี้ยังไม่ได้ผูกกับโรงแรมใดๆ" };
    }
    hotelId = userHotel.hotel_id;
    hotelName = userHotel.hotels?.name;
  }

  // Create JWT session
  await createSession({
    userId: user.id,
    role,
    hotelId,
    hotelName,
    fullName: user.full_name,
  });

  // Redirect based on role
  if (role === "super_admin") {
    redirect("/superadmin");
  } else if (role === "staff") {
    redirect("/admin/rooms/housekeeping");
  } else {
    redirect("/admin");
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
