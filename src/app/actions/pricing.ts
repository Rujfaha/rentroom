"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { DayType } from "@/types/database.types";

type ActionResult = { success?: boolean; error?: string };
type MutationResult = Promise<{ error: { message?: string } | null }>;

interface SeasonPayload {
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PricingRulePayload {
  room_type_id: string;
  season_id: string | null;
  day_type: DayType;
  price: number;
  is_active: boolean;
}

interface InsertTable<TPayload> {
  insert(value: TPayload): MutationResult;
}

interface UpdateByHotelTable<TPayload> {
  update(value: TPayload): {
    eq(column: string, value: string): {
      eq(column: string, value: string): MutationResult;
    };
  };
}

interface DeleteByHotelTable {
  delete(): {
    eq(column: string, value: string): {
      eq(column: string, value: string): MutationResult;
    };
  };
}

const DAY_TYPES: DayType[] = ["weekday", "weekend", "holiday", "special"];

async function getAdminSession() {
  const session = await getSession();
  if (!session?.hotelId) return null;
  if (session.role !== "admin" && session.role !== "super_admin") return null;
  return session;
}

function cleanDate(value: FormDataEntryValue | null) {
  const date = String(value || "").trim();
  return date ? new Date(date).toISOString().split("T")[0] : "";
}

export async function upsertSeason(formData: FormData): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const start_date = cleanDate(formData.get("start_date"));
  const end_date = cleanDate(formData.get("end_date"));
  const is_active = formData.get("is_active") === "true";

  if (!name) return { error: "กรุณากรอกชื่อฤดูกาล" };
  if (!start_date || !end_date) return { error: "กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด" };
  if (new Date(end_date).getTime() < new Date(start_date).getTime()) {
    return { error: "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น" };
  }

  const supabase = await createServiceClient();
  const payload = { name, start_date, end_date, is_active };
  const seasonsTable = supabase.from("seasons") as unknown as InsertTable<SeasonPayload & { hotel_id: string }> & UpdateByHotelTable<SeasonPayload>;
  const { error } = id === "new" || !id
    ? await seasonsTable.insert({ ...payload, hotel_id: session.hotelId })
    : await seasonsTable.update(payload).eq("id", id).eq("hotel_id", session.hotelId);
  if (error) {
    console.error("upsertSeason error:", error);
    return { error: "ไม่สามารถบันทึกฤดูกาลได้" };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/booking");
  revalidatePath("/");
  return { success: true };
}

export async function deleteSeason(id: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createServiceClient();
  const seasonsTable = supabase.from("seasons") as unknown as DeleteByHotelTable;
  const { error } = await seasonsTable
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) {
    console.error("deleteSeason error:", error);
    return { error: "ไม่สามารถลบฤดูกาลได้ อาจมีกฎราคาที่อ้างอิงอยู่" };
  }

  revalidatePath("/admin/pricing");
  return { success: true };
}

export async function upsertPricingRule(formData: FormData): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = String(formData.get("id") || "");
  const room_type_id = String(formData.get("room_type_id") || "");
  const seasonValue = String(formData.get("season_id") || "");
  const season_id = seasonValue === "base" ? null : seasonValue;
  const day_type = String(formData.get("day_type") || "weekday") as DayType;
  const price = Number(formData.get("price"));
  const is_active = formData.get("is_active") === "true";

  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (!DAY_TYPES.includes(day_type)) return { error: "ประเภทวันไม่ถูกต้อง" };
  if (!Number.isFinite(price) || price <= 0) return { error: "ราคาต้องมากกว่า 0" };

  const supabase = await createServiceClient();
  const payload = { room_type_id, season_id, day_type, price, is_active };
  const pricingTable = supabase.from("pricing_rules") as unknown as InsertTable<PricingRulePayload & { hotel_id: string }> & UpdateByHotelTable<PricingRulePayload>;

  const { error } = id === "new" || !id
    ? await pricingTable.insert({ ...payload, hotel_id: session.hotelId })
    : await pricingTable.update(payload).eq("id", id).eq("hotel_id", session.hotelId);
  if (error) {
    console.error("upsertPricingRule error:", error);
    return { error: "ไม่สามารถบันทึกกฎราคาได้ อาจมีกฎซ้ำสำหรับห้อง ฤดูกาล และประเภทวันเดียวกัน" };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/booking");
  revalidatePath("/");
  return { success: true };
}

export async function deletePricingRule(id: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createServiceClient();
  const pricingTable = supabase.from("pricing_rules") as unknown as DeleteByHotelTable;
  const { error } = await pricingTable
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) {
    console.error("deletePricingRule error:", error);
    return { error: "ไม่สามารถลบกฎราคาได้" };
  }

  revalidatePath("/admin/pricing");
  revalidatePath("/booking");
  revalidatePath("/");
  return { success: true };
}
