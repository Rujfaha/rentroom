"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { evaluatePromotions } from "@/lib/promotions/promotion-engine";
import {
  BOOKING_RATE_LIMIT_MESSAGE,
  buildBookingAttemptContext,
  evaluatePromotionValidationRateLimit,
  recordBookingAttempt,
} from "@/lib/booking/anti-spam";
import type { BookingChannel, PromotionBenefit, PromotionCondition, PromotionEvaluationInput, PromotionEvaluationResult, PromotionRow } from "@/lib/promotions/types";

type ActionResult = { success?: boolean; error?: string };
type DbError = { message?: string; code?: string; details?: string; hint?: string } | null;
type MutationResult = Promise<{ error: DbError }>;

interface PromotionPayload {
  hotel_id: string;
  title: string;
  description: string | null;
  image_url: null;
  discount_text: string | null;
  discount_code: string | null;
  valid_until: string | null;
  is_active: boolean;
  promotion_type: "automatic" | "code_required";
  starts_at: string | null;
  ends_at: string | null;
  stay_start_date: string | null;
  stay_end_date: string | null;
  priority: number;
  stackable: boolean;
  exclusive: boolean;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  applies_to_all_room_types: boolean;
  discount_type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
}

interface LegacyPromotionPayload {
  hotel_id: string;
  title: string;
  description: string | null;
  image_url: null;
  discount_text: string | null;
  discount_code: string | null;
  valid_until: string | null;
  is_active: boolean;
  discount_type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
}

interface PromotionRulePayload {
  promotion_id: string;
  conditions_json: Record<string, unknown>;
  benefits_json: Record<string, unknown>;
}

interface PromotionCodePayload {
  promotion_id: string;
  code: string;
  max_uses: number | null;
  is_active: boolean;
}

interface PromotionRoomTypePayload {
  promotion_id: string;
  room_type_id: string;
}

interface PromotionRowsQuery extends PromiseLike<{ data: PromotionRow[] | null; error: DbError }> {
  eq(column: string, value: string): PromotionRowsQuery;
  neq(column: string, value: string): PromotionRowsQuery;
  order(column: string, options: { ascending: boolean }): PromotionRowsQuery;
}

interface PromotionRowsTable {
  select(columns: string): PromotionRowsQuery;
}

interface LegacyPromotionRow {
  id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_percentage: number | string | null;
  discount_amount: number | string | null;
  discount_code: string | null;
  discount_text: string | null;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number | null;
}

interface LegacyPromotionRowsQuery extends PromiseLike<{ data: LegacyPromotionRow[] | null; error: DbError }> {
  eq(column: string, value: string | boolean): LegacyPromotionRowsQuery;
  order(column: string, options: { ascending: boolean }): LegacyPromotionRowsQuery;
}

interface LegacyPromotionRowsTable {
  select(columns: string): LegacyPromotionRowsQuery;
}

interface PromotionMutationTable {
  update(value: PromotionPayload): {
    eq(column: string, value: string): {
      eq(column: string, value: string): MutationResult;
    };
  };
  insert(value: PromotionPayload): {
    select(columns: string): {
      single(): Promise<{ data: { id: string } | null; error: DbError }>;
    };
  };
  delete(): {
    eq(column: string, value: string): {
      eq(column: string, value: string): MutationResult;
    };
  };
}

interface LegacyPromotionMutationTable {
  update(value: LegacyPromotionPayload): {
    eq(column: string, value: string): {
      eq(column: string, value: string): MutationResult;
    };
  };
  insert(value: LegacyPromotionPayload): {
    select(columns: string): {
      single(): Promise<{ data: { id: string } | null; error: DbError }>;
    };
  };
}

interface DeleteByPromotionTable {
  delete(): {
    eq(column: string, value: string): MutationResult;
  };
}

interface InsertOnlyTable<TPayload> {
  insert(value: TPayload | TPayload[]): MutationResult;
}

interface PromotionUsageCustomerRow {
  promotion_id: string;
}

interface PromotionUsageCustomerQuery extends PromiseLike<{ data: PromotionUsageCustomerRow[] | null; error: DbError }> {
  eq(column: string, value: string): PromotionUsageCustomerQuery;
  or(filters: string): PromotionUsageCustomerQuery;
}

interface PromotionUsageCustomerTable {
  select(columns: string): PromotionUsageCustomerQuery;
}

function getDbErrorMessage(error: DbError): string {
  if (!error) return "";
  return [error.message, error.details, error.hint].filter(Boolean).join(" ");
}

function getPromotionEngineSetupError(error: DbError): string | null {
  const message = getDbErrorMessage(error).toLowerCase();
  const code = error?.code || "";
  const isSchemaError = code === "PGRST200"
    || code === "PGRST204"
    || code === "42P01"
    || code === "42703"
    || message.includes("schema cache")
    || message.includes("could not find")
    || message.includes("does not exist");

  if (!isSchemaError) return null;
  return "ยังไม่สามารถบันทึก promotion engine ได้ เพราะฐานข้อมูลยังไม่ได้อัปเดต migration หรือ Supabase schema cache ยังไม่ refresh ให้รัน migrations/add_promotion_engine.sql แล้ว refresh schema cache";
}

function logDbError(label: string, error: DbError) {
  console.error(label, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  });
}

function escapeSupabaseFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/\)/g, "\\)");
}

function normalizeCustomerFilterValue(value?: string): string {
  return (value || "").trim();
}

const BENEFIT_TYPES = ["percent", "fixed", "per_night", "stay_x_pay_y", "fixed_price", "tiered_percent"];
const BOOKING_CHANNELS: BookingChannel[] = ["website", "admin", "walk_in", "partner"];

async function getAdminSession() {
  const session = await getSession();
  if (!session?.hotelId) return null;
  if (session.role !== "admin" && session.role !== "super_admin") return null;
  return session;
}

function cleanText(value: FormDataEntryValue | null): string {
  return String(value || "").trim();
}

function cleanNullableDate(value: FormDataEntryValue | null): string | null {
  const date = cleanText(value);
  return date ? new Date(date).toISOString().split("T")[0] : null;
}

function cleanNullableTimestamp(value: FormDataEntryValue | null, endOfDay?: boolean): string | null {
  const date = cleanText(value);
  if (!date) return null;
  return new Date(date + (endOfDay ? "T23:59:59" : "T00:00:00")).toISOString();
}

function cleanNumber(value: FormDataEntryValue | null): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function cleanInt(value: FormDataEntryValue | null): number | null {
  const numberValue = Math.floor(Number(value));
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function parseConditions(formData: FormData): PromotionCondition {
  const channels = formData
    .getAll("booking_channels")
    .map((item) => String(item))
    .filter((item): item is BookingChannel => BOOKING_CHANNELS.includes(item as BookingChannel));
  const days = formData.getAll("days_of_week").map((item) => String(item));

  return {
    min_nights: cleanInt(formData.get("min_nights")),
    max_nights: cleanInt(formData.get("max_nights")),
    min_subtotal: cleanNumber(formData.get("min_subtotal")),
    max_subtotal: cleanNumber(formData.get("max_subtotal")),
    days_of_week: days,
    booking_channels: channels,
    guest_count: {
      min: cleanInt(formData.get("min_guests")),
      max: cleanInt(formData.get("max_guests")),
    },
  };
}

function parseBenefits(formData: FormData): PromotionBenefit {
  const rawType = cleanText(formData.get("benefit_type"));
  const type = BENEFIT_TYPES.includes(rawType) ? rawType as PromotionBenefit["type"] : "percent";
  const tiersRaw = cleanText(formData.get("tiers_json"));
  let tiers: PromotionBenefit["tiers"] = [];

  if (tiersRaw) {
    try {
      const parsed = JSON.parse(tiersRaw) as unknown;
      if (Array.isArray(parsed)) {
        tiers = parsed
          .map((item) => item && typeof item === "object" ? item as { min_nights?: unknown; discount_percent?: unknown } : null)
          .filter((item): item is { min_nights?: unknown; discount_percent?: unknown } => Boolean(item))
          .map((item) => ({ min_nights: Number(item.min_nights) || 0, discount_percent: Number(item.discount_percent) || 0 }))
          .filter((item) => item.min_nights > 0 && item.discount_percent > 0);
      }
    } catch {
      tiers = [];
    }
  }

  return {
    type,
    discount_percent: cleanNumber(formData.get("discount_percent")),
    discount_amount: cleanNumber(formData.get("discount_amount")),
    per_night_amount: cleanNumber(formData.get("per_night_amount")),
    stay_nights: cleanInt(formData.get("stay_nights")),
    pay_nights: cleanInt(formData.get("pay_nights")),
    fixed_price: cleanNumber(formData.get("fixed_price")),
    tiers,
    max_discount_amount: cleanNumber(formData.get("max_discount_amount")),
  };
}

function getLegacyDiscountFields(benefit: PromotionBenefit) {
  if (benefit.type === "fixed") {
    return {
      discount_type: "fixed",
      discount_percentage: null,
      discount_amount: benefit.discount_amount || 0,
    };
  }

  return {
    discount_type: "percent",
    discount_percentage: benefit.discount_percent || 0,
    discount_amount: null,
  };
}

function mapLegacyPromotionRows(rows: LegacyPromotionRow[]): PromotionRow[] {
  return rows.map((row) => {
    const promotionType = row.discount_code ? "code_required" : "automatic";
    const benefitType = row.discount_type === "fixed" ? "fixed" : "percent";

    return {
      id: row.id,
      hotel_id: row.hotel_id,
      title: row.title,
      description: row.description,
      discount_type: row.discount_type,
      discount_percentage: row.discount_percentage,
      discount_amount: row.discount_amount,
      discount_code: row.discount_code,
      discount_text: row.discount_text,
      valid_until: row.valid_until,
      is_active: row.is_active,
      promotion_type: promotionType,
      starts_at: null,
      ends_at: row.valid_until ? row.valid_until + "T23:59:59.000Z" : null,
      stay_start_date: null,
      stay_end_date: null,
      priority: row.sort_order || 0,
      stackable: false,
      exclusive: false,
      max_uses: null,
      used_count: 0,
      max_uses_per_customer: null,
      applies_to_all_room_types: true,
      promotion_rules: [
        {
          id: row.id,
          conditions_json: {},
          benefits_json: {
            type: benefitType,
            discount_percent: benefitType === "percent" ? Number(row.discount_percentage) || 0 : null,
            discount_amount: benefitType === "fixed" ? Number(row.discount_amount) || 0 : null,
          },
        },
      ],
      promotion_codes: row.discount_code
        ? [
            {
              id: row.id,
              code: row.discount_code.toUpperCase(),
              max_uses: null,
              used_count: 0,
              is_active: true,
            },
          ]
        : [],
      promotion_room_types: [],
    };
  });
}

async function getLegacyPromotionRows(hotelId: string): Promise<PromotionRow[]> {
  const supabase = await createServiceClient();
  const legacyPromotionsTable = supabase.from("promotions") as unknown as LegacyPromotionRowsTable;
  const { data, error } = await legacyPromotionsTable
    .select("id, hotel_id, title, description, discount_type, discount_percentage, discount_amount, discount_code, discount_text, valid_until, is_active, sort_order")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("getPromotionEngineRows legacy fallback failed");
    return [];
  }

  return mapLegacyPromotionRows(data || []);
}

export async function getPromotionEngineRows(hotelId: string, options?: { includePrivate?: boolean }): Promise<PromotionRow[]> {
  if (!hotelId) return [];
  const supabase = await createServiceClient();
  const promotionsTable = supabase.from("promotions") as unknown as PromotionRowsTable;
  let query = promotionsTable
    .select(`
      id,
      hotel_id,
      title,
      description,
      discount_type,
      discount_percentage,
      discount_amount,
      discount_code,
      discount_text,
      valid_until,
      is_active,
      promotion_type,
      starts_at,
      ends_at,
      stay_start_date,
      stay_end_date,
      priority,
      stackable,
      exclusive,
      max_uses,
      used_count,
      max_uses_per_customer,
      applies_to_all_room_types,
      promotion_rules(id, conditions_json, benefits_json),
      promotion_codes(id, code, max_uses, used_count, is_active),
      promotion_room_types(room_type_id)
    `)
    .eq("hotel_id", hotelId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (!options?.includePrivate) {
    query = query.neq("promotion_type", "private");
  }

  const { data, error } = await query;
  if (error) {
    return getLegacyPromotionRows(hotelId);
  }

  return (data || []) as PromotionRow[];
}

export async function evaluateBookingPromotion(input: PromotionEvaluationInput): Promise<PromotionEvaluationResult> {
  const shouldRateLimit = input.bookingChannel === "website" && Boolean(input.promotionCode?.trim());
  const supabase = shouldRateLimit ? await createServiceClient() : null;
  const attemptContext = shouldRateLimit
    ? await buildBookingAttemptContext({
        hotelId: input.hotelId,
        action: "promotion_validate",
        email: input.customer?.email,
        phone: input.customer?.phone,
        roomTypeId: input.roomTypeId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
      })
    : null;

  if (supabase && attemptContext) {
    const rateLimit = await evaluatePromotionValidationRateLimit(supabase, attemptContext);
    if (rateLimit.blocked) {
      await recordBookingAttempt(supabase, attemptContext, {
        success: false,
        reason: "blocked_rate_limit",
        riskScore: rateLimit.riskScore,
      });
      return {
        valid: false,
        code: input.promotionCode?.trim().toUpperCase() || "",
        eligiblePromotions: [],
        selectedPromotion: null,
        discountAmount: 0,
        finalTotal: input.subtotal,
        message: BOOKING_RATE_LIMIT_MESSAGE,
      };
    }
  }

  const rows = await getPromotionEngineRows(input.hotelId);
  const customerUsageByPromotionId = await getCustomerUsageByPromotionId(input);
  const result = evaluatePromotions(rows, { ...input, customerUsageByPromotionId });

  if (supabase && attemptContext) {
    await recordBookingAttempt(supabase, attemptContext, {
      success: result.valid,
      reason: result.valid ? "allowed" : "invalid_promotion",
      riskScore: result.valid ? 0 : 20,
    });
  }

  return result;
}

async function getCustomerUsageByPromotionId(input: PromotionEvaluationInput): Promise<Record<string, number>> {
  const phone = normalizeCustomerFilterValue(input.customer?.phone);
  const email = normalizeCustomerFilterValue(input.customer?.email).toLowerCase();
  if (!input.hotelId || (!phone && !email)) return {};

  const supabase = await createServiceClient();
  const usageTable = supabase.from("promotion_usages") as unknown as PromotionUsageCustomerTable;
  const filters = [
    phone ? "customer_phone.eq." + escapeSupabaseFilterValue(phone) : "",
    email ? "customer_email.eq." + escapeSupabaseFilterValue(email) : "",
  ].filter(Boolean).join(",");
  const { data, error } = await usageTable
    .select("promotion_id")
    .or(filters);

  if (error) {
    logDbError("get promotion customer usage error:", error);
    return {};
  }

  return (data || []).reduce<Record<string, number>>((counts, row) => {
    counts[row.promotion_id] = (counts[row.promotion_id] || 0) + 1;
    return counts;
  }, {});
}

export async function upsertPromotionEngine(formData: FormData): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = cleanText(formData.get("id"));
  const title = cleanText(formData.get("title"));
  const description = cleanText(formData.get("description"));
  const promotionType = cleanText(formData.get("promotion_type")) === "code_required" ? "code_required" : "automatic";
  const code = cleanText(formData.get("code")).toUpperCase();
  const benefit = parseBenefits(formData);
  const conditions = parseConditions(formData);
  const appliesToAllRoomTypes = formData.get("applies_to_all_room_types") === "true";
  const roomTypeIds = formData.getAll("room_type_ids").map((item) => String(item)).filter(Boolean);
  const legacyDiscount = getLegacyDiscountFields(benefit);

  if (!title) return { error: "กรุณากรอกชื่อโปรโมชั่น" };
  if (promotionType === "code_required" && !code) return { error: "กรุณากรอก code ส่วนลด" };
  if (!benefit.type) return { error: "กรุณาเลือกรูปแบบส่วนลด" };
  if (!appliesToAllRoomTypes && roomTypeIds.length === 0) return { error: "กรุณาเลือกประเภทห้องหรือเลือกใช้ได้ทุกประเภทห้อง" };

  const supabase = await createServiceClient();
  const promotionsTable = supabase.from("promotions") as unknown as PromotionMutationTable;
  const legacyPromotionsTable = supabase.from("promotions") as unknown as LegacyPromotionMutationTable;
  const promotionRulesDeleteTable = supabase.from("promotion_rules") as unknown as DeleteByPromotionTable;
  const promotionRulesInsertTable = supabase.from("promotion_rules") as unknown as InsertOnlyTable<PromotionRulePayload>;
  const promotionCodesDeleteTable = supabase.from("promotion_codes") as unknown as DeleteByPromotionTable;
  const promotionCodesInsertTable = supabase.from("promotion_codes") as unknown as InsertOnlyTable<PromotionCodePayload>;
  const promotionRoomTypesDeleteTable = supabase.from("promotion_room_types") as unknown as DeleteByPromotionTable;
  const promotionRoomTypesInsertTable = supabase.from("promotion_room_types") as unknown as InsertOnlyTable<PromotionRoomTypePayload>;
  const payload: PromotionPayload = {
    hotel_id: session.hotelId,
    title,
    description: description || null,
    image_url: null,
    discount_text: cleanText(formData.get("discount_text")) || null,
    discount_code: promotionType === "code_required" ? code : null,
    valid_until: cleanNullableDate(formData.get("ends_at")),
    is_active: formData.get("is_active") === "true",
    promotion_type: promotionType,
    starts_at: cleanNullableTimestamp(formData.get("starts_at")),
    ends_at: cleanNullableTimestamp(formData.get("ends_at"), true),
    stay_start_date: cleanNullableDate(formData.get("stay_start_date")),
    stay_end_date: cleanNullableDate(formData.get("stay_end_date")),
    priority: Number(formData.get("priority")) || 0,
    stackable: false,
    exclusive: formData.get("exclusive") === "true",
    max_uses: cleanInt(formData.get("max_uses")),
    max_uses_per_customer: cleanInt(formData.get("max_uses_per_customer")),
    applies_to_all_room_types: appliesToAllRoomTypes,
    ...legacyDiscount,
  };
  const legacyPayload: LegacyPromotionPayload = {
    hotel_id: payload.hotel_id,
    title: payload.title,
    description: payload.description,
    image_url: payload.image_url,
    discount_text: payload.discount_text,
    discount_code: payload.discount_code,
    valid_until: payload.valid_until,
    is_active: payload.is_active,
    discount_type: payload.discount_type,
    discount_percentage: payload.discount_percentage,
    discount_amount: payload.discount_amount,
  };

  const promotionId = id && id !== "new" ? id : "";
  let savedId = promotionId;
  let savedWithLegacySchema = false;

  if (savedId) {
    const { error } = await promotionsTable
      .update(payload)
      .eq("id", savedId)
      .eq("hotel_id", session.hotelId);
    if (error) {
      logDbError("update promotion engine error:", error);
      if (getPromotionEngineSetupError(error)) {
        const { error: legacyError } = await legacyPromotionsTable
          .update(legacyPayload)
          .eq("id", savedId)
          .eq("hotel_id", session.hotelId);
        if (legacyError) {
          logDbError("update legacy promotion fallback error:", legacyError);
          return { error: "ไม่สามารถบันทึกโปรโมชั่นได้: " + (legacyError.message || "ไม่ทราบสาเหตุ") };
        }
        savedWithLegacySchema = true;
      } else {
        return { error: "ไม่สามารถบันทึกโปรโมชั่นได้: " + (error.message || "ไม่ทราบสาเหตุ") };
      }
    }
  } else {
    const { data, error } = await promotionsTable
      .insert(payload)
      .select("id")
      .single();
    if (error || !data?.id) {
      logDbError("create promotion engine error:", error);
      if (getPromotionEngineSetupError(error)) {
        const { data: legacyData, error: legacyError } = await legacyPromotionsTable
          .insert(legacyPayload)
          .select("id")
          .single();
        if (legacyError || !legacyData?.id) {
          logDbError("create legacy promotion fallback error:", legacyError);
          return { error: "ไม่สามารถสร้างโปรโมชั่นได้: " + (legacyError?.message || "ไม่ทราบสาเหตุ") };
        }
        savedId = legacyData.id;
        savedWithLegacySchema = true;
      } else {
        return { error: "ไม่สามารถสร้างโปรโมชั่นได้: " + (error?.message || "ไม่ทราบสาเหตุ") };
      }
    } else {
      savedId = data.id;
    }
  }

  if (savedWithLegacySchema) {
    revalidatePath("/admin/promotions");
    revalidatePath("/admin/cms/promotions");
    revalidatePath("/booking");
    revalidatePath("/");
    return { success: true };
  }

  const { error: ruleDeleteError } = await promotionRulesDeleteTable.delete().eq("promotion_id", savedId);
  if (ruleDeleteError) logDbError("delete promotion_rules error:", ruleDeleteError);
  const { error: ruleError } = await promotionRulesInsertTable.insert({
    promotion_id: savedId,
    conditions_json: conditions as unknown as Record<string, unknown>,
    benefits_json: benefit as unknown as Record<string, unknown>,
  });
  if (ruleError) {
    logDbError("upsert promotion_rules error:", ruleError);
    return { error: getPromotionEngineSetupError(ruleError) || "ไม่สามารถบันทึกเงื่อนไขโปรโมชั่นได้: " + (ruleError.message || "ไม่ทราบสาเหตุ") };
  }

  await promotionCodesDeleteTable.delete().eq("promotion_id", savedId);
  if (promotionType === "code_required") {
    const { error: codeError } = await promotionCodesInsertTable.insert({
      promotion_id: savedId,
      code,
      max_uses: cleanInt(formData.get("code_max_uses")),
      is_active: true,
    });
    if (codeError) {
      logDbError("upsert promotion_codes error:", codeError);
      return { error: getPromotionEngineSetupError(codeError) || "ไม่สามารถบันทึก code โปรโมชั่นได้: " + (codeError.message || "ไม่ทราบสาเหตุ") };
    }
  }

  await promotionRoomTypesDeleteTable.delete().eq("promotion_id", savedId);
  if (!appliesToAllRoomTypes && roomTypeIds.length) {
    const { error: roomTypesError } = await promotionRoomTypesInsertTable.insert(
      roomTypeIds.map((roomTypeId) => ({ promotion_id: savedId, room_type_id: roomTypeId }))
    );
    if (roomTypesError) {
      logDbError("upsert promotion_room_types error:", roomTypesError);
      return { error: getPromotionEngineSetupError(roomTypesError) || "ไม่สามารถบันทึกประเภทห้องของโปรโมชั่นได้: " + (roomTypesError.message || "ไม่ทราบสาเหตุ") };
    }
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/booking");
  revalidatePath("/");
  return { success: true };
}

export async function deletePromotionEngine(id: string): Promise<ActionResult> {
  const session = await getAdminSession();
  if (!session?.hotelId) return { error: "Unauthorized" };
  if (!id) return { error: "ไม่พบโปรโมชั่นที่ต้องการลบ" };

  const supabase = await createServiceClient();
  const promotionsTable = supabase.from("promotions") as unknown as PromotionMutationTable;
  const { error } = await promotionsTable
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) {
    console.error("delete promotion engine error:", error);
    return { error: "ไม่สามารถลบโปรโมชั่นได้ หากมี booking ใช้แล้วให้ปิดใช้งานแทน" };
  }

  revalidatePath("/admin/promotions");
  revalidatePath("/booking");
  return { success: true };
}
