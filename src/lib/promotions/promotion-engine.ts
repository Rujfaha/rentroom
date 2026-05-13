import type {
  BookingChannel,
  PromotionBenefit,
  PromotionBreakdown,
  PromotionCondition,
  PromotionEvaluationInput,
  PromotionEvaluationResult,
  PromotionRow,
} from "./types";

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeCode(code?: string): string {
  return (code || "").trim().toUpperCase();
}

function asObject<T>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return value as T;
}

function getStayDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");

  while (cursor.getTime() < end.getTime()) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getDayKey(date: string): string {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(date + "T00:00:00").getDay()] || "";
}

function normalizeBenefit(row: PromotionRow, rawBenefit: PromotionBenefit): PromotionBenefit {
  if (rawBenefit.type) return rawBenefit;

  const legacyType = row.discount_type === "fixed" ? "fixed" : "percent";
  return {
    type: legacyType,
    discount_percent: legacyType === "percent" ? toNumber(row.discount_percentage) : null,
    discount_amount: legacyType === "fixed" ? toNumber(row.discount_amount) : null,
  };
}

function isActiveForNow(row: PromotionRow, now: Date): boolean {
  if (!row.is_active) return false;

  const nowTime = now.getTime();
  if (row.starts_at && new Date(row.starts_at).getTime() > nowTime) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() < nowTime) return false;

  const today = now.toISOString().split("T")[0];
  if (row.valid_until && row.valid_until < today) return false;

  if (row.max_uses !== null && row.max_uses !== undefined) {
    if ((row.used_count || 0) >= row.max_uses) return false;
  }

  return true;
}

function overlapsStayRange(row: PromotionRow, input: PromotionEvaluationInput): boolean {
  const dates = getStayDates(input.checkInDate, input.checkOutDate);
  if (!dates.length) return true;
  if (row.stay_start_date && dates.every((date) => date < row.stay_start_date!)) return false;
  if (row.stay_end_date && dates.every((date) => date > row.stay_end_date!)) return false;
  return true;
}

function matchesRoomType(row: PromotionRow, input: PromotionEvaluationInput): boolean {
  if (row.applies_to_all_room_types !== false) return true;
  const roomTypeIds = row.promotion_room_types?.map((item) => item.room_type_id) || [];
  return roomTypeIds.includes(input.roomTypeId);
}

function matchesCode(row: PromotionRow, inputCode: string): { matched: boolean; codeId?: string; code?: string } {
  const promotionType = row.promotion_type || (row.discount_code ? "code_required" : "automatic");
  if (promotionType !== "code_required") return { matched: !inputCode };
  if (!inputCode) return { matched: false };

  const codeRows = row.promotion_codes || [];
  const matchedCode = codeRows.find((item) => {
    if (!item.is_active) return false;
    if ((item.max_uses ?? null) !== null && (item.used_count || 0) >= Number(item.max_uses)) return false;
    return item.code.toUpperCase() === inputCode;
  });

  if (matchedCode) return { matched: true, codeId: matchedCode.id, code: matchedCode.code.toUpperCase() };
  if (!codeRows.length && row.discount_code && row.discount_code.toUpperCase() === inputCode) return { matched: true, code: inputCode };
  return { matched: false };
}

function matchesCustomerUsageLimit(row: PromotionRow, input: PromotionEvaluationInput): boolean {
  if (row.max_uses_per_customer === null || row.max_uses_per_customer === undefined) return true;
  const currentUsage = input.customerUsageByPromotionId?.[row.id] || 0;
  return currentUsage < row.max_uses_per_customer;
}

function matchesConditions(condition: PromotionCondition, input: PromotionEvaluationInput): boolean {
  if (condition.min_nights !== null && condition.min_nights !== undefined && input.nights < condition.min_nights) return false;
  if (condition.max_nights !== null && condition.max_nights !== undefined && input.nights > condition.max_nights) return false;
  if (condition.min_subtotal !== null && condition.min_subtotal !== undefined && input.subtotal < condition.min_subtotal) return false;
  if (condition.max_subtotal !== null && condition.max_subtotal !== undefined && input.subtotal > condition.max_subtotal) return false;

  const guestCount = condition.guest_count;
  if (guestCount?.min !== null && guestCount?.min !== undefined && input.guests < guestCount.min) return false;
  if (guestCount?.max !== null && guestCount?.max !== undefined && input.guests > guestCount.max) return false;

  const channels = condition.booking_channels || [];
  if (channels.length && !channels.includes(input.bookingChannel as BookingChannel)) return false;

  const daysOfWeek = condition.days_of_week || [];
  if (daysOfWeek.length) {
    const normalized = daysOfWeek.map((day) => day.toLowerCase());
    const stayDates = getStayDates(input.checkInDate, input.checkOutDate);
    if (!stayDates.some((date) => normalized.includes(getDayKey(date)))) return false;
  }

  return true;
}

function calculateDiscount(benefit: PromotionBenefit, input: PromotionEvaluationInput): { amount: number; value: number } {
  let discount = 0;
  let value = 0;

  if (benefit.type === "fixed") {
    value = toNumber(benefit.discount_amount);
    discount = value;
  } else if (benefit.type === "percent") {
    value = Math.min(Math.max(toNumber(benefit.discount_percent), 0), 100);
    discount = input.subtotal * value / 100;
  } else if (benefit.type === "per_night") {
    value = toNumber(benefit.per_night_amount || benefit.discount_amount);
    discount = value * input.nights * Math.max(1, input.quantity);
  } else if (benefit.type === "stay_x_pay_y") {
    const stayNights = Math.max(1, Math.floor(toNumber(benefit.stay_nights)));
    const payNights = Math.max(0, Math.floor(toNumber(benefit.pay_nights)));
    if (stayNights > payNights && input.nights >= stayNights) {
      const averageNight = input.subtotal / input.nights;
      const freeNights = Math.floor(input.nights / stayNights) * (stayNights - payNights);
      value = freeNights;
      discount = averageNight * freeNights;
    }
  } else if (benefit.type === "fixed_price") {
    value = toNumber(benefit.fixed_price);
    if (value > 0) {
      discount = input.subtotal - value * input.nights * Math.max(1, input.quantity);
    }
  } else if (benefit.type === "tiered_percent") {
    const tiers = [...(benefit.tiers || [])]
      .filter((tier) => input.nights >= Number(tier.min_nights))
      .sort((a, b) => Number(b.min_nights) - Number(a.min_nights));
    value = Math.min(Math.max(toNumber(tiers[0]?.discount_percent), 0), 100);
    discount = input.subtotal * value / 100;
  }

  if (benefit.max_discount_amount !== null && benefit.max_discount_amount !== undefined) {
    discount = Math.min(discount, Math.max(0, toNumber(benefit.max_discount_amount)));
  }

  return {
    amount: Math.min(input.subtotal, Math.max(0, roundMoney(discount))),
    value,
  };
}

export function evaluatePromotions(rows: PromotionRow[], input: PromotionEvaluationInput): PromotionEvaluationResult {
  const code = normalizeCode(input.promotionCode);
  const now = new Date();
  const eligiblePromotions: PromotionBreakdown[] = [];

  for (const row of rows) {
    if (!isActiveForNow(row, now)) continue;
    if (!overlapsStayRange(row, input)) continue;
    if (!matchesRoomType(row, input)) continue;
    if (!matchesCustomerUsageLimit(row, input)) continue;

    const promotionType = row.promotion_type || (row.discount_code ? "code_required" : "automatic");
    if (promotionType === "private") continue;
    if (code && promotionType !== "code_required") continue;
    if (!code && promotionType === "code_required") continue;

    const codeMatch = matchesCode(row, code);
    if (!codeMatch.matched) continue;

    const rule = row.promotion_rules?.[0];
    const conditions = asObject<PromotionCondition>(rule?.conditions_json, {});
    const benefits = normalizeBenefit(row, asObject<PromotionBenefit>(rule?.benefits_json, {} as PromotionBenefit));
    if (!matchesConditions(conditions, input)) continue;

    const discount = calculateDiscount(benefits, input);
    if (discount.amount <= 0) continue;

    eligiblePromotions.push({
      promotionId: row.id,
      promotionName: row.title,
      promotionCodeId: codeMatch.codeId,
      promotionCode: codeMatch.code || code || undefined,
      discountType: benefits.type,
      discountValue: discount.value,
      discountAmount: discount.amount,
      conditionsSnapshot: conditions,
      benefitsSnapshot: benefits,
    });
  }

  const selectedPromotion = eligiblePromotions.sort((a, b) => {
    const priorityA = rows.find((row) => row.id === a.promotionId)?.priority || 0;
    const priorityB = rows.find((row) => row.id === b.promotionId)?.priority || 0;
    if (priorityA !== priorityB) return priorityB - priorityA;
    return b.discountAmount - a.discountAmount;
  })[0] || null;

  const discountAmount = selectedPromotion?.discountAmount || 0;

  return {
    valid: Boolean(selectedPromotion),
    code,
    eligiblePromotions,
    selectedPromotion,
    discountAmount,
    finalTotal: Math.max(0, roundMoney(input.subtotal - discountAmount)),
    message: selectedPromotion ? undefined : code ? "code ส่วนลดไม่ถูกต้องหรือไม่เข้าเงื่อนไข" : undefined,
  };
}
