"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { RoomStatus } from "@/types/database.types";
import type { GuestInfo, RoomAmenity, RoomTypeDisplay } from "@/types/landing.types";

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
  pricePerNight: number;
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

interface BookingPageData {
  hotel: HotelBookingConfig | null;
  roomTypes: RoomTypeDisplay[];
}

const BLOCKING_BOOKING_STATUSES: BlockingBookingStatus[] = ["pending", "confirmed", "checked_in"];

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

  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select("id, room_type_id, status, is_active")
    .eq("hotel_id", input.hotelId)
    .eq("is_active", true)
    .eq("status", "available")
    .returns<RoomRow[]>();

  if (roomsError || !roomsData?.length) {
    if (roomsError) console.error("searchAvailableRoomTypes rooms error:", roomsError);
    return roomTypesData.map((roomType) => toRoomTypeDisplay(roomType, 0));
  }

  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("hotel_id", input.hotelId)
    .in("status", BLOCKING_BOOKING_STATUSES)
    .lt("check_in_date", input.checkOut)
    .gt("check_out_date", input.checkIn)
    .returns<BookingRow[]>();

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

  return roomTypesData.map((roomType) =>
    toRoomTypeDisplay(roomType, availableCounts[roomType.id] || 0)
  );
}

export async function createWebsiteBooking(input: CreateWebsiteBookingInput): Promise<{
  success: boolean;
  bookingNumber?: string;
  error?: string;
}> {
  if (!input.hotelId || !input.roomTypeId || !isValidDateRange(input.checkIn, input.checkOut)) {
    return { success: false, error: "ข้อมูลการจองไม่ครบถ้วน" };
  }

  if (!input.guest.fullName.trim() || !input.guest.phone.trim() || !input.guest.email.trim()) {
    return { success: false, error: "กรุณากรอกข้อมูลผู้เข้าพักให้ครบถ้วน" };
  }

  const supabase = await createServiceClient();
  const availableRoomId = await findAvailableRoomId({
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  });

  if (!availableRoomId) {
    return { success: false, error: "ขออภัย ห้องพักประเภทนี้เต็มแล้ว กรุณาเลือกห้องหรือวันที่อื่น" };
  }

  const totalNights = calculateNights(input.checkIn, input.checkOut);
  const totalAmount = Math.max(0, Number(input.pricePerNight) || 0) * totalNights;
  const bookingNumber = await generateBookingNumber(input.hotelId);

  const customersTable = supabase.from("customers") as unknown as InsertSelectTable<CustomerInsert, { id: string }>;
  const { data: customer, error: customerError } = await customersTable
    .insert({
      hotel_id: input.hotelId,
      full_name: input.guest.fullName.trim(),
      phone: input.guest.phone.trim(),
      email: input.guest.email.trim(),
      notes: input.guest.specialRequests.trim() || null,
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
      discount_amount: 0,
      net_amount: totalAmount,
      special_requests: input.guest.specialRequests.trim() || null,
    })
    .select("id, booking_number")
    .single();

  if (bookingError || !booking) {
    console.error("createWebsiteBooking booking error:", bookingError);
    return { success: false, error: "ไม่สามารถสร้างการจองได้" };
  }

  const bookingGuestsTable = supabase.from("booking_guests") as unknown as InsertOnlyTable<BookingGuestInsert>;
  await bookingGuestsTable.insert({
    booking_id: booking.id,
    hotel_id: input.hotelId,
    full_name: input.guest.fullName.trim(),
    phone: input.guest.phone.trim(),
    is_primary: true,
  });

  const paymentsTable = supabase.from("payments") as unknown as InsertOnlyTable<PaymentInsert>;
  const { error: paymentError } = await paymentsTable.insert({
    hotel_id: input.hotelId,
    booking_id: booking.id,
    amount: totalAmount,
    method: "promptpay",
    status: "pending",
    slip_image_url: input.slipUrl || null,
  });

  if (paymentError) {
    console.error("createWebsiteBooking payment error:", paymentError);
  }

  return { success: true, bookingNumber: booking.booking_number };
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

  const roomsTable = supabase.from("rooms") as unknown as UpdateScopedTable<RoomAdminUpdate>;
  const { error: roomError } = await roomsTable
    .update({ status: "occupied" })
    .eq("id", bookingRow.room_id)
    .eq("hotel_id", session.hotelId);

  if (roomError) {
    console.error("approveBooking room status error:", roomError);
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

  revalidateBookingPages();
}

export async function checkInBooking(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session?.hotelId) return;

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) return;

  const supabase = await createServiceClient();
  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingAdminUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({ status: "checked_in", checked_in_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("checkInBooking error:", bookingError);
    return;
  }

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

function revalidateBookingPages() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/rooms");
  revalidatePath("/admin");
  revalidatePath("/booking");
  revalidatePath("/");
}

function isValidDateRange(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return false;
  return new Date(checkOut).getTime() > new Date(checkIn).getTime();
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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
    .eq("status", "available")
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

function toRoomTypeDisplay(roomType: RoomTypeRow, availableRoomsCount: number): RoomTypeDisplay {
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
    basePrice: Number(roomType.base_price) || 0,
    maxGuests: roomType.max_guests || 2,
    bedType: roomType.bed_type || "King Size",
    roomSize: Number(roomType.room_size) || 45,
    amenities,
    isActive: roomType.is_active,
    availableRoomsCount,
  };
}
