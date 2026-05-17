"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { evaluateBookingPromotion } from "@/app/actions/promotion-engine";
import { sendBookingStatusEmail, type BookingEmailData } from "@/lib/email/booking-notifications";
import type { RoomStatus } from "@/types/database.types";
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

interface NormalizedGuestInfo {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
}

interface BookingDuplicateRow {
  id: string;
  booking_number: string;
}

interface CustomerInsert {
  hotel_id: string;
  full_name: string;
  phone: string;
  email: string;
  notes: string | null;
}

interface BookingInsert {
  hotel_id: string;
  room_id: string;
  customer_id: string;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: "pending";
  source: "website";
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  special_requests: string | null;
}

interface BookingGuestInsert {
  booking_id: string;
  hotel_id: string;
  full_name: string;
  phone: string;
  is_primary: boolean;
}

interface PaymentInsert {
  hotel_id: string;
  booking_id: string;
  amount: number;
  method: "promptpay";
  status: "pending";
  slip_image_url: string | null;
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

interface InsertResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

interface UpdateResult {
  error: { message?: string } | null;
}

interface SelectSingleResult<T> {
  data: T | null;
  error: { message?: string } | null;
}

interface InsertSelectTable<TInsert, TResult> {
  insert(value: TInsert): {
    select(columns: string): {
      single(): Promise<InsertResult<TResult>>;
    };
  };
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
const MIN_BOOKING_FORM_TIME_MS = 3000;
const MAX_BOOKING_NIGHTS = 30;
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
  if (!input.hotelId || !isValidDateRange(input.checkIn, input.checkOut)) {
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

  if (input.antiSpam?.companyName?.trim()) {
    return { success: false, error: "กรุณาตรวจสอบข้อมูลการจองอีกครั้ง" };
  }

  if (!isValidFormTiming(input.antiSpam?.formStartedAt)) {
    return { success: false, error: "กรุณาตรวจสอบข้อมูลการจองอีกครั้ง" };
  }

  if (!input.hotelId || !input.roomTypeId || !isValidDateRange(input.checkIn, input.checkOut)) {
    return { success: false, error: "ข้อมูลการจองไม่ครบถ้วน" };
  }

  const supabase = await createServiceClient();
  const hasDuplicateBooking = await findRecentDuplicateBooking(supabase, {
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guest: normalizedGuest,
  });

  if (hasDuplicateBooking) {
    return { success: false, error: "พบรายการจองที่คล้ายกันแล้ว กรุณาตรวจสอบสถานะการจอง หรือรอสักครู่ก่อนทำรายการใหม่" };
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
    return { success: false, error: promotion.message || "code ส่วนลดไม่ถูกต้อง" };
  }
  const selectedPromotion = promotion.selectedPromotion;
  const discountAmount = selectedPromotion ? promotion.discountAmount : 0;
  const netAmount = Math.max(0, totalAmount - discountAmount);
  const bookingNumber = await generateBookingNumber(input.hotelId);

  const customersTable = supabase.from("customers") as unknown as InsertSelectTable<CustomerInsert, { id: string }>;
  const { data: customer, error: customerError } = await customersTable
    .insert({
      hotel_id: input.hotelId,
      full_name: normalizedGuest.fullName,
      phone: normalizedGuest.phone,
      email: normalizedGuest.email,
      notes: normalizedGuest.specialRequests || null,
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    console.error("createWebsiteBooking customer error:", customerError);
    return { success: false, error: "ไม่สามารถบันทึกข้อมูลผู้เข้าพักได้" };
  }

  const bookingsTable = supabase.from("bookings") as unknown as InsertSelectTable<BookingInsert, { id: string; booking_number: string }>;
  const { data: booking, error: bookingError } = await bookingsTable
    .insert({
      hotel_id: input.hotelId,
      room_id: availableRoomId,
      customer_id: customer.id,
      booking_number: bookingNumber,
      check_in_date: input.checkIn,
      check_out_date: input.checkOut,
      num_guests: Math.max(1, input.adults + input.children),
      status: "pending",
      source: "website",
      total_amount: totalAmount,
      discount_amount: discountAmount,
      net_amount: netAmount,
      special_requests: normalizedGuest.specialRequests || null,
    })
    .select("id, booking_number")
    .single();

  if (bookingError || !booking) {
    console.error("createWebsiteBooking booking error:", bookingError);
    return { success: false, error: "ไม่สามารถสร้างการจองได้" };
  }

  if (selectedPromotion) {
    await recordPromotionUsage(
      supabase,
      booking.id,
      selectedPromotion,
      normalizedGuest.phone,
      normalizedGuest.email
    );
  }

  const bookingGuestsTable = supabase.from("booking_guests") as unknown as InsertOnlyTable<BookingGuestInsert>;
  await bookingGuestsTable.insert({
    booking_id: booking.id,
    hotel_id: input.hotelId,
    full_name: normalizedGuest.fullName,
    phone: normalizedGuest.phone,
    is_primary: true,
  });

  const paymentsTable = supabase.from("payments") as unknown as InsertOnlyTable<PaymentInsert>;
  const { error: paymentError } = await paymentsTable.insert({
    hotel_id: input.hotelId,
    booking_id: booking.id,
    amount: netAmount,
    method: "promptpay",
    status: "pending",
    slip_image_url: input.slipUrl || null,
  });

  if (paymentError) {
    console.error("createWebsiteBooking payment error:", paymentError);
  }

  await sendBookingStatusEmailForBooking(supabase, booking.id, input.hotelId, "createWebsiteBooking");

  return { success: true, bookingNumber: booking.booking_number };
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

function isValidDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return false;
  const checkInTime = new Date(checkIn).getTime();
  const checkOutTime = new Date(checkOut).getTime();
  if (!Number.isFinite(checkInTime) || !Number.isFinite(checkOutTime)) return false;
  return checkOutTime > checkInTime;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function normalizeGuestInfo(guest: GuestInfo): NormalizedGuestInfo {
  return {
    fullName: guest.fullName.trim().replace(/\s+/g, " "),
    phone: guest.phone.trim().replace(/[\s-]/g, ""),
    email: guest.email.trim().toLowerCase(),
    specialRequests: guest.specialRequests.trim(),
  };
}

function validateWebsiteBookingInput(input: CreateWebsiteBookingInput, guest: NormalizedGuestInfo): string | null {
  if (!input.hotelId || !input.roomTypeId || !isValidDateRange(input.checkIn, input.checkOut)) {
    return "ข้อมูลการจองไม่ครบถ้วน";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInTime = new Date(input.checkIn).getTime();
  if (checkInTime < today.getTime()) {
    return "กรุณาเลือกวันที่เข้าพักให้ถูกต้อง";
  }

  if (calculateNights(input.checkIn, input.checkOut) > MAX_BOOKING_NIGHTS) {
    return "ระยะเวลาการเข้าพักยาวเกินไป กรุณาติดต่อที่พักโดยตรง";
  }

  if (guest.fullName.length < 2 || guest.fullName.length > 100) {
    return "กรุณากรอกชื่อผู้เข้าพักให้ถูกต้อง";
  }

  if (!/^\+?\d{8,20}$/.test(guest.phone)) {
    return "กรุณากรอกเบอร์โทรให้ถูกต้อง";
  }

  if (guest.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
    return "กรุณากรอกอีเมลให้ถูกต้อง";
  }

  if (guest.specialRequests.length > 1000) {
    return "รายละเอียดคำขอเพิ่มเติมยาวเกินไป";
  }

  if (!input.slipUrl.trim()) {
    return "กรุณาแนบหลักฐานการชำระเงิน";
  }

  return null;
}

function isValidFormTiming(formStartedAt?: number): boolean {
  if (!formStartedAt || !Number.isFinite(formStartedAt)) return false;
  const elapsedMs = Date.now() - formStartedAt;
  return elapsedMs >= MIN_BOOKING_FORM_TIME_MS && elapsedMs < 24 * 60 * 60 * 1000;
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
