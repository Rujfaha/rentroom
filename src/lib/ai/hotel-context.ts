import { BLOCKING_BOOKING_STATUSES } from "../../constants/line-ai";
import type {
  AvailabilityRequest,
  AvailableRoomTypeSummary,
  HotelContactSummary,
  HotelContext,
  HotelPromotionSummary,
  SupportedLineLanguage,
} from "@/types/line-ai.types";
import { fetchHotelAiKnowledge } from "./ai-knowledge";

interface HotelRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  settings: Record<string, unknown> | null;
}

interface ContactRow {
  contact_type: string;
  label: string | null;
  value: string;
}

interface RoomTypeRow {
  id: string;
  name: string;
  base_price: number | string | null;
  max_guests: number | null;
  description?: string | null;
  amenities?: unknown[] | null;
}

interface RoomInventoryRow {
  id: string;
  room_type_id: string;
}

interface BookingOverlapRow {
  room_id: string;
}

interface PromotionRow {
  title: string;
  description: string | null;
  discount_text: string | null;
  valid_until: string | null;
}

type ServiceClient = Awaited<ReturnType<typeof import("../supabase/service").createServiceClient>>;

export type RoomInfo = AvailableRoomTypeSummary & {
  style: string[];
  suitableFor: string[];
  notSuitableFor: string[];
};

export function enrichRoomInfo(room: AvailableRoomTypeSummary): RoomInfo {
  return {
    ...room,
    style: [],
    suitableFor: [],
    notSuitableFor: [],
  };
}

export function enrichRoomTypes(roomTypes: AvailableRoomTypeSummary[]): RoomInfo[] {
  return roomTypes.map(enrichRoomInfo);
}

export function formatHotelContextPrompt(context: HotelContext): string {
  const roomLines = context.roomTypes.map((roomType) => {
    const desc = roomType.description ? `, รายละเอียด: ${roomType.description}` : "";
    const amenities = roomType.amenities && roomType.amenities.length > 0 ? `, สิ่งอำนวยความสะดวก: ${roomType.amenities.join(", ")}` : "";
    const style = roomType.style && roomType.style.length > 0 ? `, สไตล์: ${roomType.style.join(", ")}` : "";
    const suitable = roomType.suitableFor && roomType.suitableFor.length > 0 ? `, เหมาะสำหรับ: ${roomType.suitableFor.join(", ")}` : "";
    const notSuitable = roomType.notSuitableFor && roomType.notSuitableFor.length > 0 ? `, ไม่เหมาะสำหรับ: ${roomType.notSuitableFor.join(", ")}` : "";
    return `- ${roomType.name}: ราคาเริ่มต้น ${formatCurrency(roomType.basePrice)} บาท, รองรับ ${roomType.maxGuests} ท่าน, ห้อง active ${roomType.availableRooms} ห้อง${desc}${amenities}${style}${suitable}${notSuitable}`;
  });
  const contactLines = context.contacts.map((contact) => `- ${contact.label || contact.type}: ${contact.value}`);
  const promotionLines = context.promotions.map((promotion) =>
    `- ${promotion.title}${promotion.discountText ? ` (${promotion.discountText})` : ""}${promotion.validUntil ? ` ถึง ${promotion.validUntil}` : ""}`
  );

  return [
    `โรงแรม: ${context.hotelName}`,
    context.description ? `รายละเอียด: ${context.description}` : null,
    context.address ? `ที่อยู่: ${context.address}` : null,
    context.phone ? `โทร: ${context.phone}` : null,
    context.email ? `อีเมล: ${context.email}` : null,
    context.payment.promptPayConfigured
      ? `การชำระเงิน: รองรับ PromptPay${context.payment.accountName ? ` ชื่อบัญชี ${context.payment.accountName}` : ""}`
      : "การชำระเงิน: ชำระตามขั้นตอนในหน้าจองและอัปโหลดสลิป",
    roomLines.length ? `ห้องพัก:\n${roomLines.join("\n")}` : "ห้องพัก: ยังไม่มีข้อมูลห้องพัก",
    contactLines.length ? `ช่องทางติดต่อ:\n${contactLines.join("\n")}` : null,
    promotionLines.length ? `โปรโมชั่น:\n${promotionLines.join("\n")}` : null,
    context.availability ? `ผลเช็กห้องว่าง:\n${summarizeAvailability(context)}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function summarizeAvailability(context: HotelContext): string {
  if (!context.availability) return "ยังไม่ได้เช็กห้องว่างจากระบบ";

  const { request, roomTypes } = context.availability;
  const guestText = request.guests ? ` สำหรับ ${request.guests} ท่าน` : "";
  if (!roomTypes.length) {
    return `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${guestText} ยังไม่พบห้องว่างจากระบบ`;
  }

  const options = roomTypes.map(
    (roomType) => `${roomType.name} ว่าง ${roomType.availableRooms} ห้อง ราคาเริ่มต้น ${formatCurrency(roomType.basePrice)} บาท`
  );
  return `ช่วงวันที่ ${request.checkIn} ถึง ${request.checkOut}${guestText}: ${options.join("; ")}`;
}

export async function buildHotelContext(request?: AvailabilityRequest | null, language: SupportedLineLanguage = "th"): Promise<HotelContext> {
  const { createServiceClient } = await import("../supabase/service");
  const supabase = await createServiceClient();
  const hotel = await fetchActiveHotel(supabase);
  const [contacts, roomTypes, promotions, aiKnowledge] = await Promise.all([
    fetchContacts(supabase, hotel.id),
    fetchRoomTypes(supabase, hotel.id),
    fetchPromotions(supabase, hotel.id),
    fetchHotelAiKnowledge(supabase, hotel.id, language),
  ]);

  const availability = request
    ? {
        request,
        roomTypes: await fetchAvailableRoomTypes(supabase, hotel.id, roomTypes, request),
      }
    : undefined;

  return {
    hotelId: hotel.id,
    hotelName: hotel.name,
    description: hotel.description,
    address: hotel.address,
    phone: hotel.phone,
    email: hotel.email,
    contacts,
    payment: getPaymentSummary(hotel.settings),
    roomTypes,
    promotions,
    aiKnowledge,
    ...(availability ? { availability } : {}),
  };
}

export async function resolveActiveHotelId(): Promise<string | null> {
  try {
    const { createServiceClient } = await import("../supabase/service");
    const supabase = await createServiceClient();
    const hotel = await fetchActiveHotel(supabase);
    return hotel.id;
  } catch (error) {
    console.error("LINE AI active hotel resolve error:", error);
    return null;
  }
}

async function fetchActiveHotel(supabase: ServiceClient): Promise<HotelRow> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, description, address, phone, email, settings")
    .eq("is_active", true)
    .limit(1)
    .single()
    .returns<HotelRow>();

  if (error || !data) throw new Error(`Active hotel not found: ${error?.message || "empty result"}`);
  return data;
}

async function fetchContacts(supabase: ServiceClient, hotelId: string): Promise<HotelContactSummary[]> {
  const { data, error } = await supabase
    .from("cms_hotel_contacts")
    .select("contact_type, label, value")
    .eq("hotel_id", hotelId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .returns<ContactRow[]>();

  if (error) {
    console.error("LINE AI contacts fetch error:", error);
    return [];
  }

  return (data ?? []).map((contact) => ({
    type: contact.contact_type,
    label: contact.label,
    value: contact.value,
  }));
}

async function fetchRoomTypes(supabase: ServiceClient, hotelId: string): Promise<AvailableRoomTypeSummary[]> {
  const [{ data: roomTypes, error: roomTypesError }, { data: rooms, error: roomsError }] = await Promise.all([
    supabase
      .from("room_types")
      .select("id, name, base_price, max_guests, description, amenities")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("base_price", { ascending: true })
      .returns<RoomTypeRow[]>(),
    supabase
      .from("rooms")
      .select("id, room_type_id")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .in("status", ["available", "occupied"])
      .returns<RoomInventoryRow[]>(),
  ]);

  if (roomTypesError || roomsError) {
    console.error("LINE AI room type fetch error:", roomTypesError || roomsError);
    return [];
  }

  const activeRoomCountByType = countRoomsByType(rooms ?? []);
  const rawRoomTypes = (roomTypes ?? []).map((roomType) => ({
    id: roomType.id,
    name: roomType.name,
    basePrice: Number(roomType.base_price || 0),
    maxGuests: roomType.max_guests || 1,
    availableRooms: activeRoomCountByType.get(roomType.id) ?? 0,
    description: roomType.description || null,
    amenities: Array.isArray(roomType.amenities)
      ? roomType.amenities.map(String)
      : typeof roomType.amenities === "string"
      ? [roomType.amenities]
      : null,
  }));

  return enrichRoomTypes(rawRoomTypes);
}

async function fetchPromotions(supabase: ServiceClient, hotelId: string): Promise<HotelPromotionSummary[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select("title, description, discount_text, valid_until")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(5)
    .returns<PromotionRow[]>();

  if (error) {
    console.error("LINE AI promotion fetch error:", error);
    return [];
  }

  return (data ?? []).map((promotion) => ({
    title: promotion.title,
    description: promotion.description,
    discountText: promotion.discount_text,
    validUntil: promotion.valid_until,
  }));
}

async function fetchAvailableRoomTypes(
  supabase: ServiceClient,
  hotelId: string,
  roomTypes: AvailableRoomTypeSummary[],
  request: AvailabilityRequest
): Promise<AvailableRoomTypeSummary[]> {
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, room_type_id")
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .in("status", ["available", "occupied"])
    .returns<RoomInventoryRow[]>();

  if (roomsError || !rooms?.length) {
    if (roomsError) console.error("LINE AI available rooms fetch error:", roomsError);
    return [];
  }

  const roomIds = rooms.map((room) => room.id);
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("room_id")
    .eq("hotel_id", hotelId)
    .in("room_id", roomIds)
    .in("status", [...BLOCKING_BOOKING_STATUSES])
    .lt("check_in_date", request.checkOut)
    .gt("check_out_date", request.checkIn)
    .returns<BookingOverlapRow[]>();

  if (bookingsError) {
    console.error("LINE AI booking overlap fetch error:", bookingsError);
    return [];
  }

  const blockedRoomIds = new Set((bookings ?? []).map((booking) => booking.room_id));
  const availableRooms = rooms.filter((room) => !blockedRoomIds.has(room.id));
  const availableCountByType = countRoomsByType(availableRooms);

  return roomTypes
    .filter((roomType) => !request.guests || roomType.maxGuests >= request.guests)
    .map((roomType) => ({
      ...roomType,
      availableRooms: availableCountByType.get(roomType.id) ?? 0,
    }))
    .filter((roomType) => roomType.availableRooms > 0);
}

function countRoomsByType(rooms: RoomInventoryRow[]): Map<string, number> {
  return rooms.reduce((counts, room) => {
    counts.set(room.room_type_id, (counts.get(room.room_type_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function formatCurrency(value: number): string {
  return value.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function getPaymentSummary(settings: Record<string, unknown> | null) {
  const promptpay = settings?.promptpay;
  if (!promptpay || typeof promptpay !== "object") {
    return { promptPayConfigured: false, accountName: null };
  }

  const accountName = (promptpay as { accountName?: unknown }).accountName;
  const accountId = (promptpay as { accountId?: unknown }).accountId;
  return {
    promptPayConfigured: typeof accountId === "string" && accountId.trim().length > 0,
    accountName: typeof accountName === "string" && accountName.trim() ? accountName.trim() : null,
  };
}
