"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { BookingStatus, HousekeepingStatus, Room, RoomStatus, RoomType, RoomTypeImage } from "@/types/database.types";
import type { RoomAmenity, RoomTypeDisplay } from "@/types/landing.types";

// ─── Types ──────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> = T extends undefined
  ? { success?: boolean; error?: string }
  : { success: true; data: T; error?: never } | { success?: false; error: string; data?: never };

type RoomTypePayload = Pick<RoomType, "hotel_id" | "name" | "description" | "base_price" | "max_guests" | "extra_bed_price" | "max_extra_beds" | "amenities" | "is_active">;
type RoomPayload = Pick<Room, "hotel_id" | "room_type_id" | "room_number" | "floor" | "status" | "housekeeping" | "notes" | "is_active">;
type RoomTypeImagePayload = Pick<RoomTypeImage, "room_type_id" | "hotel_id" | "image_url" | "is_cover" | "sort_order">;
type RoomTypeActionData = Omit<RoomType, "amenities"> & { amenities: string[]; images?: RoomTypeImage[] };

interface DbError { message?: string; }
interface InsertResult<T> { data: T | null; error: DbError | null; }
interface UpdateResult { error: DbError | null; }
interface SelectSingleResult<T> { data: T | null; error: DbError | null; }
interface SelectListResult<T> { data: T[] | null; error: DbError | null; }

interface InsertSelectTable<TInsert, TResult> {
  insert(value: TInsert | TInsert[]): { select(columns?: string): { single(): Promise<InsertResult<TResult>>; }; };
}
interface InsertListTable<TInsert, TResult> {
  insert(value: TInsert | TInsert[]): { select(columns?: string): Promise<InsertResult<TResult[]>>; };
}
interface UpdateSelectTable<TUpdate, TResult> {
  update(value: TUpdate): { eq(column: string, value: string): { eq(column: string, value: string): { select(columns?: string): { single(): Promise<InsertResult<TResult>>; }; }; }; };
}
interface UpdateScopedTable<TUpdate> {
  update(value: TUpdate): { eq(column: string, value: string): { eq(column: string, value: string): Promise<UpdateResult>; }; };
}
interface DeleteScopedTable {
  delete(): { eq(column: string, value: string): { eq(column: string, value: string): Promise<UpdateResult>; }; };
}
interface SelectIdByHotelTable {
  select(columns: string, options?: { count?: "exact"; head?: boolean }): {
    eq(column: string, value: string): {
      eq(column: string, value: string): { neq(column: string, value: string): { maybeSingle(): Promise<SelectSingleResult<IdRow>>; }; maybeSingle(): Promise<SelectSingleResult<IdRow>>; };
      in(column: string, values: string[]): Promise<{ count: number | null; error: DbError | null }>;
    };
  };
}
interface SelectRoomsByTypeTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): Promise<SelectListResult<IdRow>>; }; };
}
interface SelectImageSortTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): { limit(count: number): { single(): Promise<SelectSingleResult<RoomTypeImageSortRow>>; }; }; }; }; };
}
interface SelectImageListTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { limit(count: number): Promise<SelectListResult<IdRow>>; }; }; };
}
interface SelectImageCoverTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { single(): Promise<SelectSingleResult<RoomTypeImageCoverRow>>; }; }; };
}
interface SelectRemainingImageTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): { limit(count: number): { single(): Promise<SelectSingleResult<IdRow>>; }; }; }; }; };
}
interface SelectIdLimitTable {
  select(columns: string): { eq(column: string, value: string): { eq(column: string, value: string): { limit(count: number): Promise<SelectListResult<IdRow>>; }; }; };
}
interface SelectAdminRoomsTable {
  select(columns: string): { eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): Promise<SelectListResult<AdminRoomRow>>; }; };
}
interface SelectRoomNumbersTable {
  select(columns: string): { eq(column: string, value: string): { in(column: string, values: string[]): Promise<SelectListResult<RoomNumberRow>>; }; };
}

interface IdRow { id: string; }
interface RoomNumberRow { room_number: string; }
interface RoomTypeImageSortRow { sort_order: number | null; }
interface RoomTypeImageCoverRow { room_type_id: string; is_cover: boolean; }
interface AdminBookingRow {
  id: string; check_in_date: string; check_out_date: string; status: BookingStatus;
  customers: { full_name: string | null } | null;
}
interface AdminRoomRow extends Room { bookings?: AdminBookingRow[] | null; }
interface AdminRoomDisplay extends AdminRoomRow {
  bookings: Array<AdminBookingRow & { guest_name: string; check_in: string; check_out: string; }>;
  currentBooking: (AdminBookingRow & { guest_name: string; check_in: string; check_out: string; }) | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getValidatedSession() {
  const session = await getSession();
  if (!session?.hotelId) return null;
  return session;
}

function parseAmenities(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch { return []; }
}

function toRoomStatus(value: FormDataEntryValue | null): RoomStatus {
  return value === "occupied" || value === "maintenance" || value === "out_of_order" ? value : "available";
}

function toHousekeepingStatus(value: FormDataEntryValue | null): HousekeepingStatus {
  return value === "dirty" || value === "inspected" || value === "in_progress" || value === "out_of_service" ? value : "clean";
}

// ─── Room Type Actions ───────────────────────────────────────────────────────

export async function createRoomType(formData: FormData): Promise<ActionResult<RoomTypeActionData>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const name = (formData.get("name") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() || null;
  const base_price = parseFloat(formData.get("base_price") as string ?? "0");
  const max_guests = parseInt(formData.get("max_guests") as string ?? "0", 10);
  const extra_bed_price = parseFloat(formData.get("extra_bed_price") as string ?? "0");
  const max_extra_beds = parseInt(formData.get("max_extra_beds") as string ?? "0", 10);
  const amenities = parseAmenities(formData.get("amenities"));
  const is_active = formData.get("is_active") === "true";

  if (!name) return { error: "กรุณากรอกชื่อประเภทห้อง" };
  if (isNaN(base_price) || base_price <= 0) return { error: "ราคาต้องเป็นตัวเลขมากกว่า 0" };
  if (isNaN(max_guests) || max_guests <= 0) return { error: "จำนวนผู้เข้าพักสูงสุดต้องเป็นจำนวนเต็มมากกว่า 0" };
  if (isNaN(extra_bed_price) || extra_bed_price < 0) return { error: "ราคาเตียงเสริมต้องเป็นตัวเลขไม่ติดลบ" };
  if (isNaN(max_extra_beds) || max_extra_beds < 0) return { error: "จำนวนเตียงเสริมสูงสุดต้องเป็นจำนวนเต็มไม่ติดลบ" };

  const supabase = await createServiceClient();
  const roomTypesSelectTable = supabase.from("room_types") as unknown as SelectIdByHotelTable;
  const { data: existing } = await roomTypesSelectTable.select("id").eq("hotel_id", hotelId).eq("name", name).maybeSingle();
  if (existing) return { error: "ชื่อประเภทห้องนี้มีอยู่แล้ว" };

  const payload: RoomTypePayload = { hotel_id: hotelId, name, description, base_price, max_guests, extra_bed_price, max_extra_beds, amenities, is_active };
  const roomTypesInsertTable = supabase.from("room_types") as unknown as InsertSelectTable<RoomTypePayload, RoomTypeActionData>;
  const { data, error } = await roomTypesInsertTable.insert(payload).select().single();

  if (error) { console.error("createRoomType insert error:", error); return { error: "ไม่สามารถสร้างประเภทห้องได้: " + (error.message || JSON.stringify(error)) }; }
  if (!data) return { error: "ไม่สามารถสร้างประเภทห้องได้" };

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data };
}

export async function updateRoomType(formData: FormData): Promise<ActionResult<RoomTypeActionData>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const base_price = parseFloat(formData.get("base_price") as string);
  const max_guests = parseInt(formData.get("max_guests") as string, 10);
  const extra_bed_price = parseFloat(formData.get("extra_bed_price") as string ?? "0");
  const max_extra_beds = parseInt(formData.get("max_extra_beds") as string ?? "0", 10);
  const amenities = parseAmenities(formData.get("amenities"));
  const is_active = formData.get("is_active") === "true";

  if (!id) return { error: "ID is required" };
  if (!name) return { error: "กรุณากรอกชื่อประเภทห้อง" };
  if (isNaN(base_price) || base_price <= 0) return { error: "ราคาต้องเป็นตัวเลขมากกว่า 0" };
  if (isNaN(max_guests) || max_guests <= 0) return { error: "จำนวนผู้เข้าพักสูงสุดต้องเป็นจำนวนเต็มมากกว่า 0" };
  if (isNaN(extra_bed_price) || extra_bed_price < 0) return { error: "ราคาเตียงเสริมต้องเป็นตัวเลขไม่ติดลบ" };
  if (isNaN(max_extra_beds) || max_extra_beds < 0) return { error: "จำนวนเตียงเสริมสูงสุดต้องเป็นจำนวนเต็มไม่ติดลบ" };

  const supabase = await createServiceClient();
  const roomTypesSelectTable = supabase.from("room_types") as unknown as SelectIdByHotelTable;
  const { data: existing } = await roomTypesSelectTable.select("id").eq("hotel_id", hotelId).eq("name", name).neq("id", id).maybeSingle();
  if (existing) return { error: "ชื่อประเภทห้องนี้มีอยู่แล้ว" };

  const roomTypesUpdateTable = supabase.from("room_types") as unknown as UpdateSelectTable<Partial<RoomTypePayload>, RoomTypeActionData>;
  const { data, error } = await roomTypesUpdateTable.update({ name, description, base_price, max_guests, extra_bed_price, max_extra_beds, amenities, is_active }).eq("id", id).eq("hotel_id", hotelId).select().single();

  if (error) { console.error("updateRoomType error:", error); return { error: "ไม่สามารถอัปเดตประเภทห้องได้: " + (error.message || JSON.stringify(error)) }; }
  if (!data) return { error: "ไม่สามารถอัปเดตประเภทห้องได้" };

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data };
}

export async function deleteRoomType(id: string): Promise<ActionResult<{ deletedRooms: number }>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;
  if (!id) return { error: "ID is required" };

  const supabase = await createServiceClient();
  const roomTypesSelectTable = supabase.from("room_types") as unknown as SelectIdByHotelTable;
  const { data: roomType, error: roomTypeCheckError } = await roomTypesSelectTable.select("id").eq("id", id).eq("hotel_id", hotelId).maybeSingle();
  if (roomTypeCheckError) return { error: "ไม่สามารถตรวจสอบประเภทห้องได้" };
  if (!roomType) return { error: "ไม่พบประเภทห้องที่ต้องการลบ" };

  const roomsSelectTable = supabase.from("rooms") as unknown as SelectRoomsByTypeTable;
  const { data: roomsData, error: roomsError } = await roomsSelectTable.select("id").eq("room_type_id", id).eq("hotel_id", hotelId);
  if (roomsError) return { error: "ไม่สามารถตรวจสอบห้องพักที่เกี่ยวข้องได้" };

  const roomIds = (roomsData || []).map((room) => room.id);
  if (roomIds.length > 0) {
    const bookingsCountTable = supabase.from("bookings") as unknown as SelectIdByHotelTable;
    const { count: bookingCount, error: bookingsError } = await bookingsCountTable.select("id", { count: "exact", head: true }).eq("hotel_id", hotelId).in("room_id", roomIds);
    if (bookingsError) return { error: "ไม่สามารถตรวจสอบการจองที่เกี่ยวข้องได้" };
    if ((bookingCount ?? 0) > 0) return { error: `ไม่สามารถลบประเภทห้องนี้ได้ เนื่องจากมีการจอง ${bookingCount} รายการที่เกี่ยวข้อง` };

    const roomsDeleteTable = supabase.from("rooms") as unknown as DeleteScopedTable;
    const { error: deleteRoomsError } = await roomsDeleteTable.delete().eq("room_type_id", id).eq("hotel_id", hotelId);
    if (deleteRoomsError) return { error: "ไม่สามารถลบห้องพักที่เกี่ยวข้องได้: " + (deleteRoomsError.message || JSON.stringify(deleteRoomsError)) };
  }

  const roomTypesDeleteTable = supabase.from("room_types") as unknown as DeleteScopedTable;
  const { error } = await roomTypesDeleteTable.delete().eq("id", id).eq("hotel_id", hotelId);
  if (error) { console.error("deleteRoomType error:", error); return { error: "ไม่สามารถลบประเภทห้องได้: " + (error.message || JSON.stringify(error)) }; }

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data: { deletedRooms: roomIds.length } };
}

// ─── Room Type Image Actions ─────────────────────────────────────────────────

export async function uploadRoomTypeImage(formData: FormData): Promise<ActionResult<RoomTypeImage>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const image_url = formData.get("image_url") as string;
  if (!room_type_id || !image_url) return { error: "ข้อมูลไม่ครบถ้วน" };

  const supabase = await createServiceClient();
  const imageSortTable = supabase.from("room_type_images") as unknown as SelectImageSortTable;
  const { data: maxData } = await imageSortTable.select("sort_order").eq("room_type_id", room_type_id).eq("hotel_id", hotelId).order("sort_order", { ascending: false }).limit(1).single();
  const sort_order = (maxData?.sort_order ?? -1) + 1;

  const imageListTable = supabase.from("room_type_images") as unknown as SelectImageListTable;
  const { data: existingImages } = await imageListTable.select("id").eq("room_type_id", room_type_id).eq("hotel_id", hotelId).limit(1);
  const is_cover = !existingImages || existingImages.length === 0;

  const imagePayload: RoomTypeImagePayload = { room_type_id, hotel_id: hotelId, image_url, is_cover, sort_order };
  const imageInsertTable = supabase.from("room_type_images") as unknown as InsertSelectTable<RoomTypeImagePayload, RoomTypeImage>;
  const { data, error } = await imageInsertTable.insert(imagePayload).select().single();

  if (error) { console.error("uploadRoomTypeImage error:", error); return { error: "ไม่สามารถบันทึกรูปภาพได้: " + (error.message || JSON.stringify(error)) }; }
  if (!data) return { error: "ไม่สามารถบันทึกรูปภาพได้" };

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data };
}

export async function setCoverImage(roomTypeId: string, imageId: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();
  const imageUpdateTable = supabase.from("room_type_images") as unknown as UpdateScopedTable<Partial<RoomTypeImage>>;
  await imageUpdateTable.update({ is_cover: false }).eq("room_type_id", roomTypeId).eq("hotel_id", hotelId);
  const { error } = await imageUpdateTable.update({ is_cover: true }).eq("id", imageId).eq("hotel_id", hotelId);

  if (error) { console.error("setCoverImage error:", error); return { error: "ไม่สามารถตั้งรูปหน้าปกได้: " + (error.message || JSON.stringify(error)) }; }
  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true };
}

export async function deleteRoomTypeImage(imageId: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();
  const imageCoverTable = supabase.from("room_type_images") as unknown as SelectImageCoverTable;
  const { data: image } = await imageCoverTable.select("room_type_id, is_cover").eq("id", imageId).eq("hotel_id", hotelId).single();
  if (!image) return { error: "ไม่พบรูปภาพ" };

  const imageDeleteTable = supabase.from("room_type_images") as unknown as DeleteScopedTable;
  const { error } = await imageDeleteTable.delete().eq("id", imageId).eq("hotel_id", hotelId);
  if (error) { console.error("deleteRoomTypeImage error:", error); return { error: "ไม่สามารถลบรูปภาพได้: " + (error.message || JSON.stringify(error)) }; }

  if (image.is_cover) {
    const remainingImageTable = supabase.from("room_type_images") as unknown as SelectRemainingImageTable;
    const { data: remaining } = await remainingImageTable.select("id").eq("room_type_id", image.room_type_id).eq("hotel_id", hotelId).order("sort_order", { ascending: true }).limit(1).single();
    if (remaining) {
      const imageUpdateTable = supabase.from("room_type_images") as unknown as UpdateScopedTable<Partial<RoomTypeImage>>;
      await imageUpdateTable.update({ is_cover: true }).eq("id", remaining.id).eq("hotel_id", hotelId);
    }
  }

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true };
}

// ─── Physical Room Actions ───────────────────────────────────────────────────

export async function createRoom(formData: FormData): Promise<ActionResult<Room>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const room_number = (formData.get("room_number") as string)?.trim();
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = toRoomStatus(formData.get("status"));
  const housekeeping = toHousekeepingStatus(formData.get("housekeeping"));
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true";

  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (!room_number) return { error: "กรุณากรอกเลขห้อง" };

  const supabase = await createServiceClient();
  const roomsSelectTable = supabase.from("rooms") as unknown as SelectIdByHotelTable;
  const { data: existing } = await roomsSelectTable.select("id").eq("hotel_id", hotelId).eq("room_number", room_number).maybeSingle();
  if (existing) return { error: "เลขห้องนี้มีอยู่แล้ว" };

  const payload: RoomPayload = { hotel_id: hotelId, room_type_id, room_number, floor, status, housekeeping, notes, is_active };
  const roomsInsertTable = supabase.from("rooms") as unknown as InsertSelectTable<RoomPayload, Room>;
  const { data, error } = await roomsInsertTable.insert(payload).select().single();

  if (error) { console.error("createRoom error:", error); return { error: "ไม่สามารถสร้างห้องพักได้: " + (error.message || JSON.stringify(error)) }; }
  if (!data) return { error: "ไม่สามารถสร้างห้องพักได้" };

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data };
}

export async function updateRoom(formData: FormData): Promise<ActionResult<Room>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const id = formData.get("id") as string;
  const room_type_id = formData.get("room_type_id") as string;
  const room_number = (formData.get("room_number") as string)?.trim();
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = toRoomStatus(formData.get("status"));
  const housekeeping = toHousekeepingStatus(formData.get("housekeeping"));
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true";

  if (!id) return { error: "ID is required" };
  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (!room_number) return { error: "กรุณากรอกเลขห้อง" };

  const supabase = await createServiceClient();
  const roomsSelectTable = supabase.from("rooms") as unknown as SelectIdByHotelTable;
  const { data: existing } = await roomsSelectTable.select("id").eq("hotel_id", hotelId).eq("room_number", room_number).neq("id", id).maybeSingle();
  if (existing) return { error: "เลขห้องนี้มีอยู่แล้ว" };

  const roomsUpdateTable = supabase.from("rooms") as unknown as UpdateSelectTable<Partial<RoomPayload>, Room>;
  const { data, error } = await roomsUpdateTable.update({ room_type_id, room_number, floor, status, housekeeping, notes, is_active }).eq("id", id).eq("hotel_id", hotelId).select().single();

  if (error) { console.error("updateRoom error:", error); return { error: "ไม่สามารถอัปเดตห้องพักได้: " + (error.message || JSON.stringify(error)) }; }
  if (!data) return { error: "ไม่สามารถอัปเดตห้องพักได้" };

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data };
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();
  const bookingsSelectTable = supabase.from("bookings") as unknown as SelectIdLimitTable;
  const { data: bookingsData, error: bookingsError } = await bookingsSelectTable.select("id").eq("room_id", id).eq("hotel_id", hotelId).limit(1);
  if (bookingsError) return { error: "Failed to check associated bookings" };
  if (bookingsData && bookingsData.length > 0) return { error: "ไม่สามารถลบได้ เนื่องจากมีการจองที่เกี่ยวข้อง" };

  const roomsDeleteTable = supabase.from("rooms") as unknown as DeleteScopedTable;
  const { error } = await roomsDeleteTable.delete().eq("id", id).eq("hotel_id", hotelId);
  if (error) { console.error("deleteRoom error:", error); return { error: "ไม่สามารถลบห้องพักได้: " + (error.message || JSON.stringify(error)) }; }

  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true };
}

export async function getAdminRooms(): Promise<ActionResult<AdminRoomDisplay[]>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();
  const adminRoomsTable = supabase.from("rooms") as unknown as SelectAdminRoomsTable;
  const { data: rooms } = await adminRoomsTable
    .select(`*, bookings (id, check_in_date, check_out_date, status, customers (full_name))`)
    .eq("hotel_id", hotelId)
    .order("room_number", { ascending: true });

  const roomsWithBookings: AdminRoomDisplay[] = (rooms || []).map((room) => {
    const processedBookings = (room.bookings || []).map((b) => ({
      ...b, guest_name: b.customers?.full_name || "Unknown Guest", check_in: b.check_in_date, check_out: b.check_out_date,
    }));
    const activeBooking = processedBookings.find((b) => b.status === "checked_in") || processedBookings.find((b) => b.status === "confirmed");
    return { ...room, bookings: processedBookings, currentBooking: activeBooking || null };
  });

  return { success: true, data: roomsWithBookings };
}

export async function bulkCreateRooms(formData: FormData): Promise<ActionResult<{ created: Room[]; skipped: string[] }>> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const prefix = (formData.get("prefix") as string)?.trim() || "";
  const startNumber = parseInt(formData.get("start_number") as string, 10);
  const count = parseInt(formData.get("count") as string, 10);
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = toRoomStatus(formData.get("status"));
  const housekeeping = toHousekeepingStatus(formData.get("housekeeping"));

  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (isNaN(startNumber) || startNumber < 0) return { error: "เลขเริ่มต้นไม่ถูกต้อง" };
  if (isNaN(count) || count < 1 || count > 100) return { error: "จำนวนห้องต้องอยู่ระหว่าง 1-100" };

  const supabase = await createServiceClient();
  const roomNumbers = Array.from({ length: count }, (_, i) => `${prefix}${startNumber + i}`);

  const roomNumbersTable = supabase.from("rooms") as unknown as SelectRoomNumbersTable;
  const { data: existingRooms } = await roomNumbersTable.select("room_number").eq("hotel_id", hotelId).in("room_number", roomNumbers);
  const existingSet = new Set((existingRooms || []).map((r) => r.room_number));
  const newRoomNumbers = roomNumbers.filter((rn) => !existingSet.has(rn));

  if (newRoomNumbers.length === 0) return { error: "ห้องทั้งหมดที่ต้องการสร้างมีอยู่ในระบบแล้ว" };

  const rows = newRoomNumbers.map((room_number) => ({ hotel_id: hotelId, room_type_id, room_number, floor, status, housekeeping, notes: null, is_active: true }));
  const roomsInsertTable = supabase.from("rooms") as unknown as InsertListTable<RoomPayload, Room>;
  const { data, error } = await roomsInsertTable.insert(rows).select();

  if (error) { console.error("bulkCreateRooms error:", error); return { error: "ไม่สามารถสร้างห้องพักได้: " + (error.message || JSON.stringify(error)) }; }

  const skipped = roomNumbers.filter((rn) => existingSet.has(rn));
  revalidatePath("/admin/rooms"); revalidatePath("/");
  return { success: true, data: { created: data || [], skipped } };
}

// ─── Landing Page Functions ──────────────────────────────────────────────────

const amenityIconMap: Record<string, string> = {
  WiFi: "wifi", "Wi-Fi": "wifi", "แอร์": "ac", "เครื่องปรับอากาศ": "ac",
  TV: "tv", "ตู้เย็น": "minibar", "ระเบียง": "balcony", "อ่างอาบน้ำ": "bath",
  "เครื่องทำน้ำอุ่น": "bath", "ไดร์เป่าผม": "ac", "ตู้นิรภัย": "minibar",
  "โต๊ะทำงาน": "minibar", "กาแฟ": "coffee", "จากุซซี่": "jacuzzi", "สระส่วนตัว": "jacuzzi",
};

interface RoomTypeImageRow { image_url: string; is_cover: boolean; sort_order: number | null; }
interface RoomTypeDetailRow {
  id: string; hotel_id: string; name: string; description: string | null;
  base_price: number | string | null; max_guests: number | null;
  extra_bed_price?: number | string | null; max_extra_beds?: number | null;
  bed_type?: string | null; room_size?: number | string | null;
  amenities: unknown[] | null; is_active: boolean;
  room_type_images: RoomTypeImageRow[] | null;
}

export async function getRoomTypeDetail(roomTypeId: string): Promise<RoomTypeDisplay | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("room_types")
    .select(`*, room_type_images (*)`)
    .eq("id", roomTypeId)
    .eq("is_active", true)
    .single();

  if (error || !data) { console.error("Error fetching room type detail:", error); return null; }

  const row = data as unknown as RoomTypeDetailRow;
  const roomImages = row.room_type_images || [];
  const coverImage = roomImages.find((img) => img.is_cover);
  const coverImageUrl = coverImage?.image_url || roomImages[0]?.image_url || "/placeholder-room.jpg";
  const galleryUrls = [...roomImages].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((img) => img.image_url);

  let amenities: RoomAmenity[] = [];
  if (Array.isArray(row.amenities)) {
    amenities = row.amenities.filter((a): a is string => typeof a === "string").map((a) => ({ icon: amenityIconMap[a] || "minibar", label: a }));
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: rooms } = await supabase.from("rooms").select("id, status, is_active").eq("hotel_id", row.hotel_id).eq("room_type_id", row.id).eq("is_active", true).in("status", ["available", "occupied"]);
  const roomIds = (rooms ?? []).map((r: { id: string }) => r.id);
  let availableCount = roomIds.length;

  if (roomIds.length > 0) {
    const { data: blocked } = await supabase.from("bookings").select("room_id").eq("hotel_id", row.hotel_id).in("status", ["pending", "confirmed", "checked_in"]).in("room_id", roomIds).lt("check_in_date", tomorrow).gt("check_out_date", today);
    availableCount = roomIds.length - (blocked?.length ?? 0);
  }

  return {
    id: row.id, name: row.name, description: row.description || "",
    shortDescription: row.description ? (row.description.length > 120 ? row.description.substring(0, 120) + "..." : row.description) : "",
    coverImageUrl, galleryUrls, basePrice: Number(row.base_price) || 0,
    maxGuests: row.max_guests || 2,
    extraBedPrice: Number(row.extra_bed_price) || 0,
    maxExtraBeds: Number(row.max_extra_beds) || 0,
    bedType: row.bed_type || "King Size",
    roomSize: Number(row.room_size) || 45, amenities, isActive: row.is_active,
    availableRoomsCount: Math.max(0, availableCount),
  };
}

export async function getHotelIdForRoom(roomTypeId: string): Promise<string | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("room_types").select("hotel_id").eq("id", roomTypeId).single();
  return (data as { hotel_id: string } | null)?.hotel_id ?? null;
}
