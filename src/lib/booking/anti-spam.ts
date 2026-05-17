import { createHmac } from "crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export type BookingAttemptAction = "booking_create" | "promotion_validate";
export type BookingAttemptReason =
  | "allowed"
  | "blocked_rate_limit"
  | "duplicate"
  | "honeypot"
  | "invalid_promotion"
  | "too_fast";

interface BookingAttemptInsert {
  hotel_id: string;
  action: BookingAttemptAction;
  ip_hash: string | null;
  email_hash: string | null;
  phone_hash: string | null;
  room_type_id?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  success: boolean;
  reason: BookingAttemptReason;
  risk_score: number;
}

interface BookingAttemptContext {
  hotelId: string;
  action: BookingAttemptAction;
  ipHash: string | null;
  emailHash: string | null;
  phoneHash: string | null;
  roomTypeId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
}

interface RateLimitRule {
  field: "ip_hash" | "email_hash" | "phone_hash";
  hash: string | null;
  maxAttempts: number;
  windowMinutes: number;
  riskScore: number;
}

interface RateLimitResult {
  blocked: boolean;
  riskScore: number;
}

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

interface BookingAttemptCountQuery extends PromiseLike<{ count: number | null; error: { message?: string } | null }> {
  eq(column: string, value: string | boolean): BookingAttemptCountQuery;
  gte(column: string, value: string): BookingAttemptCountQuery;
}

interface BookingAttemptsCountTable {
  select(columns: string, options: { count: "exact"; head: true }): BookingAttemptCountQuery;
}

interface BookingAttemptsInsertTable {
  insert(value: BookingAttemptInsert): Promise<{ error: { message?: string } | null }>;
}

const DEFAULT_HASH_SECRET = "rentroom-booking-antispam-development-secret";

export const BOOKING_RATE_LIMIT_MESSAGE =
  "มีการทำรายการหลายครั้งในช่วงเวลาสั้น ๆ กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";

export function normalizeBookingIdentifier(value?: string | null): string {
  return (value || "").trim().toLowerCase().replace(/[\s-]/g, "");
}

export function hashBookingIdentifier(value?: string | null): string | null {
  const normalized = normalizeBookingIdentifier(value);
  if (!normalized) return null;

  const secret = process.env.BOOKING_ANTISPAM_SECRET || process.env.NEXTAUTH_SECRET || DEFAULT_HASH_SECRET;
  return createHmac("sha256", secret).update(normalized).digest("hex");
}

export async function getBookingClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") || "";
  const firstForwardedIp = forwardedFor.split(",")[0]?.trim();

  return (
    firstForwardedIp ||
    requestHeaders.get("cf-connecting-ip") ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

export async function buildBookingAttemptContext(input: {
  hotelId: string;
  action: BookingAttemptAction;
  email?: string | null;
  phone?: string | null;
  roomTypeId?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
}): Promise<BookingAttemptContext> {
  const clientIp = await getBookingClientIp();

  return {
    hotelId: input.hotelId,
    action: input.action,
    ipHash: hashBookingIdentifier(clientIp),
    emailHash: hashBookingIdentifier(input.email),
    phoneHash: hashBookingIdentifier(input.phone),
    roomTypeId: input.roomTypeId ?? null,
    checkInDate: input.checkInDate ?? null,
    checkOutDate: input.checkOutDate ?? null,
  };
}

export async function recordBookingAttempt(
  supabase: SupabaseClient,
  context: BookingAttemptContext,
  input: {
    success: boolean;
    reason: BookingAttemptReason;
    riskScore?: number;
  }
) {
  const attemptsTable = supabase.from("booking_attempts") as unknown as BookingAttemptsInsertTable;
  const { error } = await attemptsTable.insert({
    hotel_id: context.hotelId,
    action: context.action,
    ip_hash: context.ipHash,
    email_hash: context.emailHash,
    phone_hash: context.phoneHash,
    room_type_id: context.roomTypeId ?? null,
    check_in_date: context.checkInDate ?? null,
    check_out_date: context.checkOutDate ?? null,
    success: input.success,
    reason: input.reason,
    risk_score: input.riskScore ?? 0,
  });

  if (error) {
    console.error("recordBookingAttempt error:", error);
  }
}

export async function evaluateBookingRateLimit(
  supabase: SupabaseClient,
  context: BookingAttemptContext
): Promise<RateLimitResult> {
  return evaluateRateLimit(supabase, context, [
    { field: "ip_hash", hash: context.ipHash, maxAttempts: 5, windowMinutes: 10, riskScore: 30 },
    { field: "ip_hash", hash: context.ipHash, maxAttempts: 20, windowMinutes: 24 * 60, riskScore: 30 },
    { field: "email_hash", hash: context.emailHash, maxAttempts: 3, windowMinutes: 30, riskScore: 30 },
    { field: "email_hash", hash: context.emailHash, maxAttempts: 8, windowMinutes: 24 * 60, riskScore: 30 },
    { field: "phone_hash", hash: context.phoneHash, maxAttempts: 3, windowMinutes: 30, riskScore: 30 },
    { field: "phone_hash", hash: context.phoneHash, maxAttempts: 8, windowMinutes: 24 * 60, riskScore: 30 },
  ]);
}

export async function evaluatePromotionValidationRateLimit(
  supabase: SupabaseClient,
  context: BookingAttemptContext
): Promise<RateLimitResult> {
  return evaluateRateLimit(supabase, context, [
    { field: "ip_hash", hash: context.ipHash, maxAttempts: 10, windowMinutes: 10, riskScore: 30 },
    { field: "email_hash", hash: context.emailHash, maxAttempts: 8, windowMinutes: 30, riskScore: 30 },
    { field: "phone_hash", hash: context.phoneHash, maxAttempts: 8, windowMinutes: 30, riskScore: 30 },
  ], false);
}

async function evaluateRateLimit(
  supabase: SupabaseClient,
  context: BookingAttemptContext,
  rules: RateLimitRule[],
  includeSuccessfulAttempts = true
): Promise<RateLimitResult> {
  let riskScore = 0;

  for (const rule of rules) {
    if (!rule.hash) continue;

    const count = await countRecentBookingAttempts(supabase, context.action, rule.field, rule.hash, rule.windowMinutes, includeSuccessfulAttempts);
    if (count >= rule.maxAttempts) {
      riskScore += rule.riskScore;
    }
  }

  return {
    blocked: riskScore >= 30,
    riskScore,
  };
}

async function countRecentBookingAttempts(
  supabase: SupabaseClient,
  action: BookingAttemptAction,
  field: RateLimitRule["field"],
  hash: string,
  windowMinutes: number,
  includeSuccessfulAttempts: boolean
): Promise<number> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const attemptsTable = supabase.from("booking_attempts") as unknown as BookingAttemptsCountTable;
  let query = attemptsTable
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq(field, hash)
    .gte("created_at", since);

  if (!includeSuccessfulAttempts) {
    query = query.eq("success", false);
  }

  const { count, error } = await query;
  if (error) {
    console.error("countRecentBookingAttempts error:", error);
    return 0;
  }

  return count ?? 0;
}
