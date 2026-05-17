"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { evaluateBookingPromotion } from "@/app/actions/promotion-engine";
import { sendBookingStatusEmail, type BookingEmailData } from "@/lib/email/booking-notifications";
import {
  BOOKING_RATE_LIMIT_MESSAGE,
  buildBookingAttemptContext,
  evaluateBookingRateLimit,
  recordBookingAttempt,
} from "@/lib/booking/anti-spam";
import {
  isValidBookingDateRange,
  isValidFormTiming,
  normalizeGuestInfo,
  validateWebsiteBookingInput,
  type NormalizedGuestInfo,
} from "@/lib/booking/validation";
import type { BookingSource, PaymentMethod, RoomStatus } from "@/types/database.types";
import type { BookingStatus, PaymentStatus } from "@/types/database.types";
import type { GuestInfo, RoomAmenity, RoomTypeDisplay } from "@/types/landing.types";
import type { PromotionBreakdown } from "@/lib/promotions/types";

type BlockingBookingStatus = "pending" | "confirmed" | "checked_in";

interface HotelBookingConfig {
  id: string;
  name: string;
}

interface RoomTypeImageRow {
  image_url: string;
  is_cover: boolean;
  sort_order: number | null;
}

interface RoomTypeRow {
  id: string;
  name: string;
  description: string | null;
  base_price: number | string | null;
  max_guests: number | null;
  bed_type?: string | null;
  room_size?: number | string | null;
  amenities: unknown[] | null;
  is_active: boolean;
  room_type_images: RoomTypeImageRow[] | null;
}

interface RoomRow {
  id: string;
  room_type_id: string;
  status: RoomStatus;
  is_active: boolean;
}

interface BookingRow {
  room_id: string;
}

interface SeasonPricingRow {
  id: string;
  start_date: string;
  end_date: string;
}

interface PricingRuleRow {
  room_type_id: string;
  season_id: string | null;
  day_type: "weekday" | "weekend" | "holiday" | "special";
  price: number | string;
}

interface PublicBookingLookupRow {
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  total_amount: number | string | null;
  net_amount: number | string | null;
  created_at: string;
  customers: {
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
  rooms: {
    room_number: string;
    room_types: {
      name: string;
    } | null;
  } | null;
  payments: {
    status: PaymentStatus;
    amount: number | string | null;
    slip_image_url: string | null;
    created_at: string;
  }[] | null;
}

export interface PublicBookingLookup {
  bookingRef: string;
  roomName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  slipUrl: string | null;
  createdAt: string;
}

interface BookingRoomSearchInput {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

interface CreateWebsiteBookingInput {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  guest: GuestInfo;
  slipUrl: string;
  promotionCode?: string;
  antiSpam?: {
    companyName?: string;
    formStartedAt?: number;
  };
}

export interface AdminBookingRoomOption {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
}

export interface AdminBookingRoomTypeOption {
  id: string;
  name: string;
  basePrice: number;
  maxGuests: number;
  rooms: AdminBookingRoomOption[];
}

export interface AdminCreateBookingState {
  success: boolean;
  error?: string;
  bookingNumber?: string;
}

interface BookingDuplicateRow {
  id: string;
  booking_number: string;
}

interface AtomicBookingRpcParams {
  p_hotel_id: string;
  p_room_type_id: string;
  p_preferred_room_id: string | null;
  p_booking_number: string;
  p_check_in_date: string;
  p_check_out_date: string;
  p_num_guests: number;
  p_source: BookingSource;
  p_total_amount: number;
  p_discount_amount: number;
  p_net_amount: number;
  p_customer_full_name: string;
  p_customer_phone: string | null;
  p_customer_email: string | null;
  p_customer_notes: string | null;
  p_special_requests: string | null;
  p_booking_notes: string | null;
  p_created_by: string | null;
  p_payment_amount: number | null;
  p_payment_method: PaymentMethod | null;
  p_payment_status: PaymentStatus;
  p_slip_image_url: string | null;
  p_transaction_ref: string | null;
  p_payment_notes: string | null;
}

interface AtomicBookingRpcRow {
  booking_id: string;
  booking_number: string;
  room_id: string;
}

interface AtomicBookingRpcClient {
  rpc(
    fn: "create_booking_atomic",
    params: AtomicBookingRpcParams
  ): Promise<{ data: AtomicBookingRpcRow[] | null; error: { message?: string; code?: string } | null }>;
}

interface BookingPromotionInsert {
  booking_id: string;
  promotion_id: string;
  promotion_name: string;
  promotion_code: string | null;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  conditions_snapshot: Record<string, unknown>;
  benefits_snapshot: Record<string, unknown>;
}

interface PromotionUsageInsert {
  promotion_id: string;
  promotion_code_id: string | null;
  booking_id: string;
  customer_phone: string;
  customer_email: string;
  discount_amount: number;
}

interface UpdateResult {
  error: { message?: string } | null;
}

interface SelectSingleResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

interface InsertOnlyTable<TInsert> {
  insert(value: TInsert): Promise<{ error: { message?: string } | null }>;
}

interface UpdateScopedTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<UpdateResult>;
    };
  };
}

interface SelectScopedSingleTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        single(): Promise<SelectSingleResult<TResult>>;
      };
    };
  };
}

interface SelectListTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string | boolean): {
      eq(column: string, value: string | boolean): {
        ilike(column: string, pattern: string): Promise<{ data: TResult[] | null; error: { message?: string } | null }>;
      };
    };
  };
}

interface SelectMaybeSingleTable<TResult> {
  select(columns: string): {
    eq(column: string, value: string): {
      ilike(column: string, pattern: string): {
        maybeSingle(): Promise<{ data: TResult | null; error: { message?: string } | null }>;
      };
    };
  };
}

interface SelectPromotionCountTable {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: { used_count: number | string | null } | null; error: { message?: string } | null }>;
    };
  };
}

interface UpdatePromotionCountTable {
  update(value: { used_count: number }): {
    eq(column: string, value: string): Promise<UpdateResult>;
  };
}

interface SelectPromotionCodeCountTable {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: { used_count: number | string | null } | null; error: { message?: string } | null }>;
    };
  };
}

interface UpdatePromotionCodeCountTable {
  update(value: { used_count: number }): {
    eq(column: string, value: string): Promise<UpdateResult>;
  };
}

interface BookingAdminUpdate {
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  confirmed_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

interface PaymentAdminUpdate {
  status: "verified" | "rejected";
  verified_by: string;
  verified_at: string;
}

interface RoomAdminUpdate {
  status: RoomStatus;
}

interface BookingAdminRow {
  id: string;
  room_id: string;
  status: BlockingBookingStatus | "cancelled" | "checked_out" | "no_show";
}

interface BookingEmailLookupRow {
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  net_amount: number | string | null;
  total_amount: number | string | null;
  customers: {
    full_name: string;
    email: string | null;
  } | null;
  rooms: {
    room_number: string;
    room_types: {
      name: string;
    } | null;
  } | null;
  payments: {
    status: PaymentStatus;
    created_at: string;
  }[] | null;
}

interface BookingPageData {
  hotel: HotelBookingConfig | null;
  roomTypes: RoomTypeDisplay[];
}

interface PromotionDiscountRow {
  id: string;
  title: string;
  discount_type: "percent" | "fixed" | null;
  discount_percentage: number | string | null;
  discount_amount: number | string | null;
  discount_code: string | null;
  discount_text: string | null;
  valid_until: string | null;
}

interface PromotionDiscountResult {
  valid: boolean;
  code: string;
  title?: string;
  discountType?: "percent" | "fixed";
  discountValue?: number;
  discountAmount: number;
  message?: string;
}

const BLOCKING_BOOKING_STATUSES: BlockingBookingStatus[] = ["pending", "confirmed", "checked_in"];
const BOOKABLE_ROOM_STATUSES: RoomStatus[] = ["available", "occupied"];
const DUPLICATE_BOOKING_WINDOW_MINUTES = 30;

const amenityIconMap: Record<string, string> = {
  WiFi: "wifi",
  "Wi-Fi": "wifi",
  "แอร์": "ac",
  "เครื่องปรับอากาศ": "ac",
  TV: "tv",
  "ตู้เย็น": "minibar",
  "ระเบียง": "balcony",
  "อ่างอาบน้ำ": "bath",
  "เครื่องทำน้ำอุ่น": "bath",
  "ไดร์เป่าผม": "ac",
  "ตู้นิรภัย": "minibar",
  "โต๊ะทำงาน": "minibar",
  "กาแฟ": "coffee",
  "จากุซซี่": "jacuzzi",
  "สระส่วนตัว": "jacuzzi",
};

export async function getBookingPageData(
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number
): Promise<BookingPageData> {
  const supabase = await createServiceClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("id, name")
    .eq("is_active", true)
    .limit(1)
    .single();
  const hotel = hotelData as HotelBookingConfig | null;

  if (!hotel) {
    return { hotel: null, roomTypes: [] };
  }

  const roomTypes = await searchAvailableRoomTypes({
    hotelId: hotel.id,
    checkIn,
    checkOut,
    adults,
    children,
  });

  return { hotel, roomTypes };
}

export async function searchAvailableRoomTypes(input: BookingRoomSearchInput): Promise<RoomTypeDisplay[]> {
  if (!input.hotelId || !isValidBookingDateRange(input.checkIn, input.checkOut)) {
    return [];
  }

  const totalGuests = Math.max(1, input.adults + input.children);
  const supabase = await createServiceClient();

  const { data: roomTypesData, error: roomTypesError } = await supabase
    .from("room_types")
    .select(`
      *,
      room_type_images (*)
    `)
    .eq("hotel_id", input.hotelId)
    .eq("is_active", true)
    .gte("max_guests", totalGuests)
    .order("created_at", { ascending: false })
    .returns<RoomTypeRow[]>();

  if (roomTypesError || !roomTypesData?.length) {
    if (roomTypesError) console.error("searchAvailableRoomTypes room_types error:", roomTypesError);
    return [];
  }

  const [
    { data: roomsData, error: roomsError },
    pricing,
    { data: bookingsData, error: bookingsError },
  ] = await Promise.all([
    supabase
      .from("rooms")
      .select("id, room_type_id, status, is_active")
      .eq("hotel_id", input.hotelId)
      .eq("is_active", true)
      .in("status", BOOKABLE_ROOM_STATUSES)
      .returns<RoomRow[]>(),
    getPricingContext(input.hotelId),
    supabase
      .from("bookings")
      .select("room_id")
      .eq("hotel_id", input.hotelId)
      .in("status", BLOCKING_BOOKING_STATUSES)
      .lt("check_in_date", input.checkOut)
      .gt("check_out_date", input.checkIn)
      .returns<BookingRow[]>(),
  ]);

  if (roomsError || !roomsData?.length) {
    if (roomsError) console.error("searchAvailableRoomTypes rooms error:", roomsError);
    return roomTypesData.map((roomType) => {
      const stayTotal = getStayTotal(roomType, input.checkIn, input.checkOut, pricing);
      return toRoomTypeDisplay(roomType, 0, getAverageNightlyPrice(roomType, input.checkIn, input.checkOut, pricing), stayTotal);
    });
  }

  if (bookingsError) {
    console.error("searchAvailableRoomTypes bookings error:", bookingsError);
  }

  const blockedRoomIds = new Set((bookingsData ?? []).map((booking) => booking.room_id));
  const availableCounts = roomsData.reduce<Record<string, number>>((counts, room) => {
    if (!blockedRoomIds.has(room.id)) {
      counts[room.room_type_id] = (counts[room.room_type_id] || 0) + 1;
    }

    return counts;
  }, {});

  return roomTypesData.map((roomType) => {
    const stayTotal = getStayTotal(roomType, input.checkIn, input.checkOut, pricing);
    return toRoomTypeDisplay(
      roomType,
      availableCounts[roomType.id] || 0,
      getAverageNightlyPrice(roomType, input.checkIn, input.checkOut, pricing),
      stayTotal
    );
  });
}

export async function createWebsiteBooking(input: CreateWebsiteBookingInput): Promise<{
  success: boolean;
  bookingNumber?: string;
  error?: string;
}> {
  const normalizedGuest = normalizeGuestInfo(input.guest);
  const validationError = validateWebsiteBookingInput(input, normalizedGuest);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createServiceClient();
  const attemptContext = await buildBookingAttemptContext({
    hotelId: input.hotelId,
    action: "booking_create",
    email: normalizedGuest.email,
    phone: normalizedGuest.phone,
    roomTypeId: input.roomTypeId,
    checkInDate: input.checkIn,
    checkOutDate: input.checkOut,
  });

  if (input.antiSpam?.companyName?.trim()) {
    await recordBookingAttempt(supabase, attemptContext, { success: false, reason: "honeypot", riskScore: 100 });
    return { success: false, error: "กรุณาตรวจสอบข้อมูลการจองอีกครั้ง" };
  }

  if (!isValidFormTiming(input.antiSpam?.formStartedAt)) {
    await recordBookingAttempt(supabase, attemptContext, { success: false, reason: "too_fast", riskScore: 50 });
    return { success: false, error: "กรุณาตรวจสอบข้อมูลการจองอีกครั้ง" };
  }

  if (!input.hotelId || !input.roomTypeId || !isValidBookingDateRange(input.checkIn, input.checkOut)) {
    return { success: false, error: "ข้อมูลการจองไม่ครบถ้วน" };
  }

  const hasDuplicateBooking = await findRecentDuplicateBooking(supabase, {
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guest: normalizedGuest,
  });

  if (hasDuplicateBooking) {
    await recordBookingAttempt(supabase, attemptContext, { success: false, reason: "duplicate", riskScore: 40 });
    return { success: false, error: "พบรายการจองที่คล้ายกันแล้ว กรุณาตรวจสอบสถานะการจอง หรือรอสักครู่ก่อนทำรายการใหม่" };
  }

  const rateLimit = await evaluateBookingRateLimit(supabase, attemptContext);
  if (rateLimit.blocked) {
    await recordBookingAttempt(supabase, attemptContext, {
      success: false,
      reason: "blocked_rate_limit",
      riskScore: rateLimit.riskScore,
    });
    return { success: false, error: BOOKING_RATE_LIMIT_MESSAGE };
  }

  const availableRoomId = await findAvailableRoomId({
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  if (!availableRoomId) {
    return { success: false, error: "ขออภัย ห้องพักประเภทนี้เต็มแล้ว กรุณาเลือกห้องหรือวันที่อื่น" };
  }

  const roomType = await getRoomTypeForPricing(input.hotelId, input.roomTypeId);
  if (!roomType) {
    return { success: false, error: "ไม่พบประเภทห้องพักที่เลือก" };
  }

  const pricing = await getPricingContext(input.hotelId);
  const totalAmount = getStayTotal(roomType, input.checkIn, input.checkOut, pricing);
  const promotion = await evaluateBookingPromotion({
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkInDate: input.checkIn,
    checkOutDate: input.checkOut,
    nights: calculateNights(input.checkIn, input.checkOut),
    quantity: 1,
    guests: Math.max(1, input.adults + input.children),
    subtotal: totalAmount,
    bookingChannel: "website",
    promotionCode: input.promotionCode || "",
    customer: {
      phone: normalizedGuest.phone,
      email: normalizedGuest.email,
    },
  });
  if (input.promotionCode?.trim() && !promotion.valid) {
    await recordBookingAttempt(supabase, attemptContext, { success: false, reason: "invalid_promotion", riskScore: 20 });
    return { success: false, error: promotion.message || "code ส่วนลดไม่ถูกต้อง" };
  }
  const selectedPromotion = promotion.selectedPromotion;
  const discountAmount = selectedPromotion ? promotion.discountAmount : 0;
  const netAmount = Math.max(0, totalAmount - discountAmount);
  const booking = await createAtomicBooking(supabase, {
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    preferredRoomId: null,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    totalGuests: Math.max(1, input.adults + input.children),
    source: "website",
    totalAmount,
    discountAmount,
    netAmount,
    guest: normalizedGuest,
    customerNotes: normalizedGuest.specialRequests || null,
    specialRequests: normalizedGuest.specialRequests || null,
    bookingNotes: null,
    createdBy: null,
    payment: {
      amount: netAmount,
      method: "promptpay",
      status: "pending",
      slipUrl: input.slipUrl || null,
      transactionRef: null,
      notes: null,
    },
  });

  if (!booking.success) {
    return { success: false, error: booking.error };
  }

  if (selectedPromotion) {
    await recordPromotionUsage(
      supabase,
      booking.bookingId,
      selectedPromotion,
      normalizedGuest.phone,
      normalizedGuest.email
    );
  }

  await sendBookingStatusEmailForBooking(supabase, booking.bookingId, input.hotelId, "createWebsiteBooking");
  await recordBookingAttempt(supabase, attemptContext, { success: true, reason: "allowed", riskScore: rateLimit.riskScore });

  return { success: true, bookingNumber: booking.bookingNumber };
}

interface AtomicBookingInput {
  hotelId: string;
  roomTypeId: string;
  preferredRoomId: string | null;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  source: BookingSource;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  guest: NormalizedGuestInfo;
  customerNotes: string | null;
  specialRequests: string | null;
  bookingNotes: string | null;
  createdBy: string | null;
  payment: {
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    slipUrl: string | null;
    transactionRef: string | null;
    notes: string | null;
  } | null;
}

async function createAtomicBooking(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  input: AtomicBookingInput
): Promise<{ success: true; bookingId: string; bookingNumber: string; roomId: string } | { success: false; error: string }> {
  const bookingNumber = await generateBookingNumber(input.hotelId);
  const rpcClient = supabase as unknown as AtomicBookingRpcClient;
  const { data, error } = await rpcClient.rpc("create_booking_atomic", {
    p_hotel_id: input.hotelId,
    p_room_type_id: input.roomTypeId,
    p_preferred_room_id: input.preferredRoomId,
    p_booking_number: bookingNumber,
    p_check_in_date: input.checkIn,
    p_check_out_date: input.checkOut,
    p_num_guests: input.totalGuests,
    p_source: input.source,
    p_total_amount: input.totalAmount,
    p_discount_amount: input.discountAmount,
    p_net_amount: input.netAmount,
    p_customer_full_name: input.guest.fullName,
    p_customer_phone: input.guest.phone || null,
    p_customer_email: input.guest.email || null,
    p_customer_notes: input.customerNotes,
    p_special_requests: input.specialRequests,
    p_booking_notes: input.bookingNotes,
    p_created_by: input.createdBy,
    p_payment_amount: input.payment?.amount ?? null,
    p_payment_method: input.payment?.method ?? null,
    p_payment_status: input.payment?.status ?? "pending",
    p_slip_image_url: input.payment?.slipUrl ?? null,
    p_transaction_ref: input.payment?.transactionRef ?? null,
    p_payment_notes: input.payment?.notes ?? null,
  });

  if (error || !data?.[0]) {
    console.error("createAtomicBooking rpc error:", error);
    const message = error?.message || "";
    if (message.includes("ROOM_NOT_AVAILABLE")) {
      return { success: false, error: "ขออภัย ห้องพักไม่ว่างในช่วงวันที่เลือกแล้ว กรุณาเลือกห้องหรือวันที่อื่น" };
    }
    if (message.includes("INVALID_DATE_RANGE")) {
      return { success: false, error: "กรุณาเลือกวันที่เข้าพักให้ถูกต้อง" };
    }
    return { success: false, error: "ไม่สามารถสร้างการจองได้" };
  }

  return {
    success: true,
    bookingId: data[0].booking_id,
    bookingNumber: data[0].booking_number,
    roomId: data[0].room_id,
  };
}

export async function validatePromotionCode(input: {
  hotelId: string;
  code: string;
  subtotal: number;
}): Promise<PromotionDiscountResult> {
  const code = input.code.trim().toUpperCase();
  const subtotal = Math.max(0, Number(input.subtotal) || 0);

  if (!input.hotelId || !code) {
    return { valid: false, code, discountAmount: 0, message: "กรุณากรอก code ส่วนลด" };
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const promotionsTable = supabase.from("promotions") as unknown as SelectListTable<PromotionDiscountRow>;
  const { data, error } = await promotionsTable
    .select("id, title, discount_type, discount_percentage, discount_amount, discount_code, discount_text, valid_until")
    .eq("hotel_id", input.hotelId)
    .eq("is_active", true)
    .ilike("discount_code", code);

  if (error) {
    console.error("validatePromotionCode error:", error);
    return { valid: false, code, discountAmount: 0, message: "ไม่สามารถตรวจสอบ code ส่วนลดได้" };
  }

  const rows = (data ?? []) as PromotionDiscountRow[];
  const promo = rows.find((item) => !item.valid_until || item.valid_until >= today);
  if (!promo) {
    return { valid: false, code, discountAmount: 0, message: "code ส่วนลดไม่ถูกต้องหรือหมดอายุแล้ว" };
  }

  const discountType = promo.discount_type === "fixed" ? "fixed" : "percent";
  const discountValue = discountType === "fixed"
    ? Number(promo.discount_amount) || 0
    : Number(promo.discount_percentage) || 0;
  const rawDiscount = discountType === "fixed"
    ? discountValue
    : subtotal * Math.min(Math.max(discountValue, 0), 100) / 100;
  const discountAmount = Math.min(subtotal, Math.max(0, Math.round(rawDiscount * 100) / 100));

  if (discountAmount <= 0) {
    return { valid: false, code, discountAmount: 0, message: "code นี้ยังไม่ได้ตั้งค่าส่วนลด" };
  }

  return {
    valid: true,
    code,
    title: promo.title,
    discountType,
    discountValue,
    discountAmount,
  };
}

export async function getAdminBookingFormOptions(): Promise<AdminBookingRoomTypeOption[]> {
  const session = await getSession();
  if (!session?.hotelId) return [];

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("room_types")
    .select(`
      id,
      name,
      base_price,
      max_guests,
      rooms (
        id,
        room_number,
        room_type_id,
        is_active
      )
    `)
    .eq("hotel_id", session.hotelId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .returns<Array<{
      id: string;
      name: string;
      base_price: number | string | null;
      max_guests: number | null;
      rooms: Array<{
        id: string;
        room_number: string;
        room_type_id: string;
        is_active: boolean;
      }> | null;
    }>>();

  if (error) {
    console.error("getAdminBookingFormOptions error:", error);
    return [];
  }

  return (data ?? []).map((roomType) => ({
    id: roomType.id,
    name: roomType.name,
    basePrice: Number(roomType.base_price) || 0,
    maxGuests: roomType.max_guests || 1,
    rooms: (roomType.rooms ?? [])
      .filter((room) => room.is_active)
      .map((room) => ({
        id: room.id,
        roomNumber: room.room_number,
        roomTypeId: room.room_type_id,
        roomTypeName: roomType.name,
      })),
  }));
}

export async function createAdminBooking(
  _previousState: AdminCreateBookingState,
  formData: FormData
): Promise<AdminCreateBookingState> {
  const session = await getSession();
  if (!session?.hotelId || !session.userId) {
    return { success: false, error: "กรุณาเข้าสู่ระบบอีกครั้ง" };
  }

  const roomTypeId = cleanFormText(formData.get("room_type_id"));
  const preferredRoomId = cleanFormText(formData.get("room_id")) || null;
  const checkIn = cleanFormText(formData.get("check_in"));
  const checkOut = cleanFormText(formData.get("check_out"));
  const source = parseBookingSource(cleanFormText(formData.get("source")));
  const totalGuests = Math.max(1, Math.floor(Number(formData.get("num_guests")) || 1));
  const guest = {
    fullName: cleanFormText(formData.get("full_name")).replace(/\s+/g, " "),
    phone: cleanFormText(formData.get("phone")).replace(/[\s-]/g, ""),
    email: cleanFormText(formData.get("email")).toLowerCase(),
    specialRequests: cleanFormText(formData.get("special_requests")),
  };
  const bookingNotes = cleanFormText(formData.get("booking_notes")) || null;
  const paymentAmount = parseOptionalMoney(formData.get("payment_amount"));
  const paymentMethod = parsePaymentMethod(cleanFormText(formData.get("payment_method")));
  const paymentStatus = cleanFormText(formData.get("payment_status")) === "verified" ? "verified" : "pending";
  const transactionRef = cleanFormText(formData.get("transaction_ref")) || null;
  const paymentNotes = cleanFormText(formData.get("payment_notes")) || null;

  const validationError = validateAdminBookingInput({
    roomTypeId,
    checkIn,
    checkOut,
    totalGuests,
    guest,
    paymentAmount,
  });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const roomType = await getRoomTypeForPricing(session.hotelId, roomTypeId);
  if (!roomType) {
    return { success: false, error: "ไม่พบประเภทห้องพักที่เลือก" };
  }

  const pricing = await getPricingContext(session.hotelId);
  const calculatedTotal = getStayTotal(roomType, checkIn, checkOut, pricing);
  const overrideTotal = parseOptionalMoney(formData.get("total_amount"));
  const totalAmount = overrideTotal ?? calculatedTotal;
  const netAmount = Math.max(0, totalAmount);
  const supabase = await createServiceClient();
  const booking = await createAtomicBooking(supabase, {
    hotelId: session.hotelId,
    roomTypeId,
    preferredRoomId,
    checkIn,
    checkOut,
    totalGuests,
    source,
    totalAmount,
    discountAmount: 0,
    netAmount,
    guest,
    customerNotes: bookingNotes,
    specialRequests: guest.specialRequests || null,
    bookingNotes,
    createdBy: session.userId,
    payment: paymentAmount && paymentAmount > 0
      ? {
          amount: paymentAmount,
          method: paymentMethod,
          status: paymentStatus,
          slipUrl: null,
          transactionRef,
          notes: paymentNotes,
        }
      : null,
  });

  if (!booking.success) {
    return { success: false, error: booking.error };
  }

  await sendBookingStatusEmailForBooking(supabase, booking.bookingId, session.hotelId, "createAdminBooking");
  revalidateBookingPages();
  return { success: true, bookingNumber: booking.bookingNumber };
}

export async function lookupPublicBooking(input: {
  bookingRef: string;
  email: string;
}): Promise<PublicBookingLookup | null> {
  const bookingRef = input.bookingRef.trim();
  const email = input.email.trim().toLowerCase();

  if (!bookingRef || !email) {
    return null;
  }

  const supabase = await createServiceClient();
  const bookingsTable = supabase.from("bookings") as unknown as SelectMaybeSingleTable<PublicBookingLookupRow>;
  const { data, error } = await bookingsTable
    .select(`
      booking_number,
      check_in_date,
      check_out_date,
      num_guests,
      status,
      total_amount,
      net_amount,
      created_at,
      customers!inner(full_name, phone, email),
      rooms(room_number, room_types(name)),
      payments(status, amount, slip_image_url, created_at)
    `)
    .eq("booking_number", bookingRef)
    .ilike("customers.email", email)
    .maybeSingle();

  if (error) {
    console.error("lookupPublicBooking error:", error);
    return null;
  }

  const booking = data as PublicBookingLookupRow | null;
  if (!booking) {
    return null;
  }

  const latestPayment = (booking.payments ?? [])
    .toSorted(function (a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })[0] ?? null;
  const roomTypeName = booking.rooms?.room_types?.name || "Room";
  const roomNumber = booking.rooms?.room_number || "";
  const totalAmount = Number(booking.net_amount ?? booking.total_amount) || 0;

  return {
    bookingRef: booking.booking_number,
    roomName: roomNumber ? `${roomTypeName} (${roomNumber})` : roomTypeName,
    roomNumber,
    checkIn: booking.check_in_date,
    checkOut: booking.check_out_date,
    totalNights: calculateNights(booking.check_in_date, booking.check_out_date),
    guests: booking.num_guests,
    guestName: booking.customers?.full_name || "",
    guestEmail: booking.customers?.email || "",
    guestPhone: booking.customers?.phone || "",
    status: booking.status,
    paymentStatus: latestPayment?.status || "pending",
    totalAmount,
    slipUrl: latestPayment?.slip_image_url || null,
    createdAt: booking.created_at,
  };
}

async function recordPromotionUsage(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  bookingId: string,
  promotion: PromotionBreakdown,
  customerPhone: string,
  customerEmail: string
) {
  const bookingPromotionsTable = supabase.from("booking_promotions") as unknown as InsertOnlyTable<BookingPromotionInsert>;
  const { error: snapshotError } = await bookingPromotionsTable.insert({
    booking_id: bookingId,
    promotion_id: promotion.promotionId,
    promotion_name: promotion.promotionName,
    promotion_code: promotion.promotionCode || null,
    discount_type: promotion.discountType,
    discount_value: promotion.discountValue,
    discount_amount: promotion.discountAmount,
    conditions_snapshot: promotion.conditionsSnapshot as unknown as Record<string, unknown>,
    benefits_snapshot: promotion.benefitsSnapshot as unknown as Record<string, unknown>,
  });

  if (snapshotError) {
    console.error("recordPromotionUsage snapshot error:", snapshotError);
  }

  const usageTable = supabase.from("promotion_usages") as unknown as InsertOnlyTable<PromotionUsageInsert>;
  const { error: usageError } = await usageTable.insert({
    promotion_id: promotion.promotionId,
    promotion_code_id: promotion.promotionCodeId || null,
    booking_id: bookingId,
    customer_phone: customerPhone,
    customer_email: customerEmail,
    discount_amount: promotion.discountAmount,
  });

  if (usageError) {
    console.error("recordPromotionUsage usage error:", usageError);
  }

  const promotionsCountSelectTable = supabase.from("promotions") as unknown as SelectPromotionCountTable;
  const { data: currentPromotion, error: countFetchError } = await promotionsCountSelectTable
    .select("used_count")
    .eq("id", promotion.promotionId)
    .maybeSingle();

  if (countFetchError) {
    console.error("recordPromotionUsage count fetch error:", countFetchError);
    return;
  }

  const promotionsCountUpdateTable = supabase.from("promotions") as unknown as UpdatePromotionCountTable;
  const { error: countError } = await promotionsCountUpdateTable
    .update({ used_count: (Number(currentPromotion?.used_count) || 0) + 1 })
    .eq("id", promotion.promotionId);

  if (countError) {
    console.error("recordPromotionUsage count update error:", countError);
  }

  if (promotion.promotionCodeId) {
    const promotionCodesCountSelectTable = supabase.from("promotion_codes") as unknown as SelectPromotionCodeCountTable;
    const { data: currentPromotionCode, error: codeCountFetchError } = await promotionCodesCountSelectTable
      .select("used_count")
      .eq("id", promotion.promotionCodeId)
      .maybeSingle();

    if (codeCountFetchError) {
      console.error("recordPromotionUsage code count fetch error:", codeCountFetchError);
      return;
    }

    const promotionCodesCountUpdateTable = supabase.from("promotion_codes") as unknown as UpdatePromotionCodeCountTable;
    const { error: codeCountError } = await promotionCodesCountUpdateTable
      .update({ used_count: (Number(currentPromotionCode?.used_count) || 0) + 1 })
      .eq("id", promotion.promotionCodeId);

    if (codeCountError) {
      console.error("recordPromotionUsage code count update error:", codeCountError);
    }
  }
}

export async function approveBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingSelectTable = supabase.from("bookings") as unknown as SelectScopedSingleTable<BookingAdminRow>;
  const { data: bookingRow, error: bookingFetchError } = await bookingSelectTable
    .select("id, room_id, status")
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId)
    .single();

  if (bookingFetchError || !bookingRow?.room_id) {
    console.error("approveBooking fetch booking error:", bookingFetchError);
    return;
  }

  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("approveBooking booking error:", bookingError);
    return;
  }

  const paymentsTable = supabase.from("payments") as unknown as UpdateScopedTable<PaymentAdminUpdate>;
  const { error: paymentError } = await paymentsTable
    .update({ status: "verified", verified_by: session.userId, verified_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (paymentError) {
    console.error("approveBooking payment error:", paymentError);
    return;
  }

  await sendBookingStatusEmailForBooking(supabase, bookingId, session.hotelId, "approveBooking");
  revalidateBookingPages();
}

export async function rejectBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: "Payment rejected by admin",
    })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("rejectBooking booking error:", bookingError);
    return;
  }

  const paymentsTable = supabase.from("payments") as unknown as UpdateScopedTable<PaymentAdminUpdate>;
  const { error: paymentError } = await paymentsTable
    .update({ status: "rejected", verified_by: session.userId, verified_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (paymentError) {
    console.error("rejectBooking payment error:", paymentError);
    return;
  }

  await sendBookingStatusEmailForBooking(supabase, bookingId, session.hotelId, "rejectBooking");
  revalidateBookingPages();
}

export async function checkInBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingRow = await getAdminBookingRow(supabase, bookingId, session.hotelId);
  if (!bookingRow?.room_id) return;

  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("checkInBooking error:", bookingError);
    return;
  }

  await updateBookingRoomStatus(supabase, bookingRow.room_id, session.hotelId, "occupied", "checkInBooking");
  await sendBookingStatusEmailForBooking(supabase, bookingId, session.hotelId, "checkInBooking");
  revalidateBookingPages();
}

export async function checkOutBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingRow = await getAdminBookingRow(supabase, bookingId, session.hotelId);
  if (!bookingRow?.room_id) return;

  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({ status: "checked_out", checked_out_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("checkOutBooking booking error:", bookingError);
    return;
  }

  await updateBookingRoomStatus(supabase, bookingRow.room_id, session.hotelId, "available", "checkOutBooking");
  await sendBookingStatusEmailForBooking(supabase, bookingId, session.hotelId, "checkOutBooking");
  revalidateBookingPages();
}

export async function markNoShowBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingRow = await getAdminBookingRow(supabase, bookingId, session.hotelId);
  if (!bookingRow?.room_id) return;

  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({
      status: "no_show",
      cancelled_at: new Date().toISOString(),
      cancel_reason: "Guest did not arrive",
    })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("markNoShowBooking booking error:", bookingError);
    return;
  }

  await updateBookingRoomStatus(supabase, bookingRow.room_id, session.hotelId, "available", "markNoShowBooking");
  await sendBookingStatusEmailForBooking(supabase, bookingId, session.hotelId, "markNoShowBooking");
  revalidateBookingPages();
}

async function getAdminBookingRow(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  bookingId: string,
  hotelId: string
): Promise<BookingAdminRow | null> {
  const bookingSelectTable = supabase.from("bookings") as unknown as SelectScopedSingleTable<BookingAdminRow>;
  const { data, error } = await bookingSelectTable
    .select("id, room_id, status")
    .eq("id", bookingId)
    .eq("hotel_id", hotelId)
    .single();

  if (error) {
    console.error("getAdminBookingRow error:", error);
    return null;
  }

  return data;
}

async function updateBookingRoomStatus(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  roomId: string,
  hotelId: string,
  status: RoomStatus,
  logPrefix: string
) {
  const roomsTable = supabase.from("rooms") as unknown as UpdateScopedTable<RoomAdminUpdate>;
  const { error } = await roomsTable
    .update({ status })
    .eq("id", roomId)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error(`${logPrefix} room status error:`, error);
  }
}

async function sendBookingStatusEmailForBooking(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  bookingId: string,
  hotelId: string,
  logPrefix: string
) {
  try {
    const bookingsTable = supabase.from("bookings") as unknown as SelectScopedSingleTable<BookingEmailLookupRow>;
    const { data, error } = await bookingsTable
      .select(`
        booking_number,
        check_in_date,
        check_out_date,
        num_guests,
        status,
        total_amount,
        net_amount,
        customers(full_name, email),
        rooms(room_number, room_types(name)),
        payments(status, created_at)
      `)
      .eq("id", bookingId)
      .eq("hotel_id", hotelId)
      .single();

    if (error || !data) {
      console.error(`${logPrefix} booking email lookup error:`, error);
      return;
    }

    if (!data.customers?.email) {
      console.warn(`${logPrefix} booking email skipped: customer email is missing`);
      return;
    }

    const latestPayment = (data.payments ?? [])
      .toSorted(function (a, b) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })[0] ?? null;
    const roomTypeName = data.rooms?.room_types?.name || "Room";
    const roomNumber = data.rooms?.room_number || "";
    const emailData: BookingEmailData = {
      bookingNumber: data.booking_number,
      guestName: data.customers.full_name || "ลูกค้า",
      guestEmail: data.customers.email,
      roomName: roomNumber ? `${roomTypeName} (${roomNumber})` : roomTypeName,
      checkIn: data.check_in_date,
      checkOut: data.check_out_date,
      nights: calculateNights(data.check_in_date, data.check_out_date),
      guests: data.num_guests,
      totalAmount: Number(data.net_amount ?? data.total_amount) || 0,
      bookingStatus: data.status,
      paymentStatus: latestPayment?.status || "pending",
    };

    await sendBookingStatusEmail(emailData);
  } catch (error) {
    console.error(`${logPrefix} booking email error:`, error);
  }
}

function revalidateBookingPages() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/rooms");
  revalidatePath("/admin");
  revalidatePath("/booking");
  revalidatePath("/");
}

function cleanFormText(value: FormDataEntryValue | null): string {
  return String(value || "").trim();
}

function parseOptionalMoney(value: FormDataEntryValue | null): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function parseBookingSource(value: string): BookingSource {
  if (value === "phone" || value === "ota" || value === "other") return value;
  return "walk_in";
}

function parsePaymentMethod(value: string): PaymentMethod {
  if (value === "bank_transfer" || value === "credit_card" || value === "promptpay" || value === "other") return value;
  return "cash";
}

function validateAdminBookingInput(input: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  totalGuests: number;
  guest: NormalizedGuestInfo;
  paymentAmount: number | null;
}): string | null {
  if (!input.roomTypeId || !isValidBookingDateRange(input.checkIn, input.checkOut)) {
    return "กรุณาเลือกห้องและวันที่เข้าพักให้ครบถ้วน";
  }

  if (calculateNights(input.checkIn, input.checkOut) > 30) {
    return "ระยะเวลาการเข้าพักยาวเกินไป";
  }

  if (!Number.isFinite(input.totalGuests) || input.totalGuests < 1 || input.totalGuests > 20) {
    return "กรุณากรอกจำนวนผู้เข้าพักให้ถูกต้อง";
  }

  if (input.guest.fullName.length < 2 || input.guest.fullName.length > 100) {
    return "กรุณากรอกชื่อลูกค้าให้ถูกต้อง";
  }

  if (input.guest.phone && !/^\+?\d{8,20}$/.test(input.guest.phone)) {
    return "กรุณากรอกเบอร์โทรเป็นตัวเลข 8-20 หลัก";
  }

  if (input.guest.email && (input.guest.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.guest.email))) {
    return "กรุณากรอกอีเมลให้ถูกต้อง";
  }

  if (!input.guest.phone && !input.guest.email) {
    return "กรุณากรอกเบอร์โทรหรืออีเมลอย่างน้อยหนึ่งอย่าง";
  }

  if (input.paymentAmount !== null && input.paymentAmount <= 0) {
    return "ยอดชำระต้องมากกว่า 0";
  }

  return null;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

async function findRecentDuplicateBooking(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  input: {
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guest: NormalizedGuestInfo;
  }
): Promise<boolean> {
  const windowStart = new Date(Date.now() - DUPLICATE_BOOKING_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_number,
      customers!inner(email, phone),
      rooms!inner(room_type_id)
    `)
    .eq("hotel_id", input.hotelId)
    .eq("check_in_date", input.checkIn)
    .eq("check_out_date", input.checkOut)
    .in("status", ["pending", "confirmed"])
    .gte("created_at", windowStart)
    .returns<Array<BookingDuplicateRow & {
      customers: { email: string | null; phone: string | null } | null;
      rooms: { room_type_id: string | null } | null;
    }>>();

  if (error) {
    console.error("findRecentDuplicateBooking error:", error);
    return false;
  }

  return (data ?? []).some((booking) => {
    const sameRoomType = booking.rooms?.room_type_id === input.roomTypeId;
    const sameEmail = booking.customers?.email?.trim().toLowerCase() === input.guest.email;
    const samePhone = booking.customers?.phone?.trim().replace(/[\s-]/g, "") === input.guest.phone;
    return sameRoomType && (sameEmail || samePhone);
  });
}

async function findAvailableRoomId(input: {
  hotelId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
}): Promise<string | null> {
  const supabase = await createServiceClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id")
    .eq("hotel_id", input.hotelId)
    .eq("room_type_id", input.roomTypeId)
    .eq("is_active", true)
    .in("status", BOOKABLE_ROOM_STATUSES)
    .order("room_number", { ascending: true })
    .returns<{ id: string }[]>();

  if (roomsError || !rooms?.length) {
    if (roomsError) console.error("findAvailableRoomId rooms error:", roomsError);
    return null;
  }

  const roomIds = rooms.map((room) => room.id);
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("hotel_id", input.hotelId)
    .in("room_id", roomIds)
    .in("status", BLOCKING_BOOKING_STATUSES)
    .lt("check_in_date", input.checkOut)
    .gt("check_out_date", input.checkIn)
    .returns<BookingRow[]>();

  if (bookingsError) {
    console.error("findAvailableRoomId bookings error:", bookingsError);
    return null;
  }

  const blockedRoomIds = new Set((bookings ?? []).map((booking) => booking.room_id));
  return rooms.find((room) => !blockedRoomIds.has(room.id))?.id ?? null;
}

async function generateBookingNumber(hotelId: string): Promise<string> {
  const supabase = await createServiceClient();
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = "VR-" + datePart + "-";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const bookingNumber = prefix + randomPart;
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("booking_number", bookingNumber)
      .maybeSingle();

    if (!data) return bookingNumber;
  }

  return prefix + String(Date.now()).slice(-6);
}

async function getRoomTypeForPricing(hotelId: string, roomTypeId: string): Promise<RoomTypeRow | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("room_types")
    .select(`
      *,
      room_type_images (*)
    `)
    .eq("hotel_id", hotelId)
    .eq("id", roomTypeId)
    .eq("is_active", true)
    .single()
    .returns<RoomTypeRow>();

  if (error || !data) {
    if (error) console.error("getRoomTypeForPricing error:", error);
    return null;
  }

  return data;
}

async function getPricingContext(hotelId: string): Promise<{
  seasons: SeasonPricingRow[];
  rules: PricingRuleRow[];
}> {
  const supabase = await createServiceClient();
  const [{ data: seasons, error: seasonsError }, { data: rules, error: rulesError }] = await Promise.all([
    supabase
      .from("seasons")
      .select("id, start_date, end_date")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .returns<SeasonPricingRow[]>(),
    supabase
      .from("pricing_rules")
      .select("room_type_id, season_id, day_type, price")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .returns<PricingRuleRow[]>(),
  ]);

  if (seasonsError) console.error("getPricingContext seasons error:", seasonsError);
  if (rulesError) console.error("getPricingContext pricing_rules error:", rulesError);

  return {
    seasons: seasons ?? [],
    rules: rules ?? [],
  };
}

function getAverageNightlyPrice(
  roomType: RoomTypeRow,
  checkIn: string,
  checkOut: string,
  pricing: { seasons: SeasonPricingRow[]; rules: PricingRuleRow[] }
): number {
  const nights = calculateNights(checkIn, checkOut);
  return Math.round(getStayTotal(roomType, checkIn, checkOut, pricing) / nights);
}

function getStayTotal(
  roomType: RoomTypeRow,
  checkIn: string,
  checkOut: string,
  pricing: { seasons: SeasonPricingRow[]; rules: PricingRuleRow[] }
): number {
  const dates = getStayDates(checkIn, checkOut);
  if (!dates.length) {
    return Number(roomType.base_price) || 0;
  }

  return dates.reduce((sum, date) => sum + getNightlyPrice(roomType, date, pricing), 0);
}

function getNightlyPrice(
  roomType: RoomTypeRow,
  date: string,
  pricing: { seasons: SeasonPricingRow[]; rules: PricingRuleRow[] }
): number {
  const dayType = getAutomaticDayType(date);
  const season = pricing.seasons.find((item) => item.start_date <= date && item.end_date >= date);
  const basePrice = Number(roomType.base_price) || 0;
  const sameRoomRules = pricing.rules.filter((rule) => rule.room_type_id === roomType.id);

  const matchedRule =
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "special") ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "holiday") ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === dayType) ||
    sameRoomRules.find((rule) => rule.season_id === season?.id && rule.day_type === "weekday") ||
    sameRoomRules.find((rule) => rule.season_id === null && rule.day_type === dayType) ||
    sameRoomRules.find((rule) => rule.season_id === null && rule.day_type === "weekday");

  return Number(matchedRule?.price) || basePrice;
}

function getAutomaticDayType(date: string): "weekday" | "weekend" {
  const day = new Date(date + "T00:00:00").getDay();
  return day === 0 || day === 5 || day === 6 ? "weekend" : "weekday";
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

function toRoomTypeDisplay(
  roomType: RoomTypeRow,
  availableRoomsCount: number,
  priceOverride?: number,
  stayTotal?: number
): RoomTypeDisplay {
  const roomImages = roomType.room_type_images || [];
  const coverImage = roomImages.find((image) => image.is_cover);
  const coverImageUrl = coverImage?.image_url || roomImages[0]?.image_url || "/placeholder-room.jpg";
  const galleryUrls = [...roomImages]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => image.image_url);

  const amenities: RoomAmenity[] = Array.isArray(roomType.amenities)
    ? roomType.amenities
        .filter((amenity): amenity is string => typeof amenity === "string")
        .map((amenity) => ({
          icon: amenityIconMap[amenity] || "minibar",
          label: amenity,
        }))
    : [];

  return {
    id: roomType.id,
    name: roomType.name,
    description: roomType.description || "",
    shortDescription: roomType.description
      ? roomType.description.length > 100
        ? roomType.description.substring(0, 100) + "..."
        : roomType.description
      : "",
    coverImageUrl,
    galleryUrls,
    basePrice: priceOverride ?? Number(roomType.base_price) ?? 0,
    stayTotal,
    maxGuests: roomType.max_guests || 2,
    bedType: roomType.bed_type || "King Size",
    roomSize: Number(roomType.room_size) || 45,
    amenities,
    isActive: roomType.is_active,
    availableRoomsCount,
  };
}
