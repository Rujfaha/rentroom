"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// ─── Types ─────────────────────────────────────────────────

type ActionResult = { success?: boolean; data?: any; error?: string };

// ─── Helpers ───────────────────────────────────────────────

async function getValidatedSession() {
  const session = await getSession();
  if (!session?.hotelId) return null;
  return session;
}

// ─── Room Type Actions ───────────────────────────────────

export async function createRoomType(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const name = (formData.get("name") as string)?.trim() ?? "";
  const description = (formData.get("description") as string)?.trim() || null;
  const basePriceRaw = formData.get("base_price") as string;
  const base_price = parseFloat(basePriceRaw ?? "0");
  const maxGuestsRaw = formData.get("max_guests") as string;
  const max_guests = parseInt(maxGuestsRaw ?? "0", 10);
  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw ? JSON.parse(amenitiesRaw) : [];
  const is_active = formData.get("is_active") === "true";

  if (!name) return { error: "กรุณากรอกชื่อประเภทห้อง" };
  if (isNaN(base_price) || base_price <= 0) return { error: "ราคาต้องเป็นตัวเลขมากกว่า 0" };
  if (isNaN(max_guests) || max_guests <= 0) return { error: "จำนวนผู้เข้าพักสูงสุดต้องเป็นจำนวนเต็มมากกว่า 0" };

  const supabase = await createServiceClient();

  // Check uniqueness within hotel
  const { data: existing } = await (supabase.from("room_types") as any)
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("name", name)
    .single();

  if (existing) return { error: "ชื่อประเภทห้องนี้มีอยู่แล้ว" };

  const { data, error } = await (supabase.from("room_types") as any).insert({
    hotel_id: hotelId,
    name,
    description,
    base_price,
    max_guests,
    amenities,
    is_active,
  }).select().single();

  if (error) {
    console.error("createRoomType insert error:", error);
    return { error: "ไม่สามารถสร้างประเภทห้องได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data };
}

export async function updateRoomType(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const base_price = parseFloat(formData.get("base_price") as string);
  const max_guests = parseInt(formData.get("max_guests") as string, 10);
  const amenitiesRaw = formData.get("amenities") as string;
  const amenities = amenitiesRaw ? JSON.parse(amenitiesRaw) : [];
  const is_active = formData.get("is_active") === "true";

  if (!id) return { error: "ID is required" };
  if (!name) return { error: "กรุณากรอกชื่อประเภทห้อง" };
  if (isNaN(base_price) || base_price <= 0) return { error: "ราคาต้องเป็นตัวเลขมากกว่า 0" };
  if (isNaN(max_guests) || max_guests <= 0) return { error: "จำนวนผู้เข้าพักสูงสุดต้องเป็นจำนวนเต็มมากกว่า 0" };

  const supabase = await createServiceClient();

  // Check uniqueness excluding current record
  const { data: existing } = await (supabase.from("room_types") as any)
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("name", name)
    .neq("id", id)
    .single();

  if (existing) return { error: "ชื่อประเภทห้องนี้มีอยู่แล้ว" };

  const { data, error } = await (supabase.from("room_types") as any)
    .update({ name, description, base_price, max_guests, amenities, is_active })
    .eq("id", id)
    .eq("hotel_id", hotelId)
    .select()
    .single();

  if (error) {
    console.error("updateRoomType error:", error);
    return { error: "ไม่สามารถอัปเดตประเภทห้องได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data };
}

export async function deleteRoomType(id: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;
  if (!id) return { error: "ID is required" };

  const supabase = await createServiceClient();

  const { data: roomType, error: roomTypeCheckError } = await (supabase.from("room_types") as any)
    .select("id")
    .eq("id", id)
    .eq("hotel_id", hotelId)
    .maybeSingle();

  if (roomTypeCheckError) {
    console.error("deleteRoomType room type check error:", roomTypeCheckError);
    return { error: "ไม่สามารถตรวจสอบประเภทห้องได้" };
  }
  if (!roomType) return { error: "ไม่พบประเภทห้องที่ต้องการลบ" };

  const { data: roomsData, error: roomsError } = await (supabase.from("rooms") as any)
    .select("id")
    .eq("room_type_id", id)
    .eq("hotel_id", hotelId);

  if (roomsError) {
    console.error("deleteRoomType rooms check error:", roomsError);
    return { error: "ไม่สามารถตรวจสอบห้องพักที่เกี่ยวข้องได้" };
  }

  const roomIds = (roomsData || []).map((room: any) => room.id);

  if (roomIds.length > 0) {
    const { count: bookingCount, error: bookingsError } = await (supabase.from("bookings") as any)
      .select("id", { count: "exact", head: true })
      .eq("hotel_id", hotelId)
      .in("room_id", roomIds);

    if (bookingsError) {
      console.error("deleteRoomType bookings check error:", bookingsError);
      return { error: "ไม่สามารถตรวจสอบการจองที่เกี่ยวข้องได้" };
    }
    if ((bookingCount ?? 0) > 0) {
      return { error: `ไม่สามารถลบประเภทห้องนี้ได้ เนื่องจากมีการจอง ${bookingCount} รายการที่เกี่ยวข้องกับห้องพักในประเภทนี้` };
    }

    const { error: deleteRoomsError } = await (supabase.from("rooms") as any)
      .delete()
      .eq("room_type_id", id)
      .eq("hotel_id", hotelId);

    if (deleteRoomsError) {
      console.error("deleteRoomType rooms delete error:", deleteRoomsError);
      return { error: "ไม่สามารถลบห้องพักที่เกี่ยวข้องได้: " + (deleteRoomsError.message || JSON.stringify(deleteRoomsError)) };
    }
  }

  const { error } = await (supabase.from("room_types") as any)
    .delete()
    .eq("id", id)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error("deleteRoomType error:", error);
    return { error: "ไม่สามารถลบประเภทห้องได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data: { deletedRooms: roomIds.length } };
}

// ─── Room Type Image Actions ───────────────────────────────

export async function uploadRoomTypeImage(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const image_url = formData.get("image_url") as string;

  if (!room_type_id || !image_url) return { error: "ข้อมูลไม่ครบถ้วน" };

  const supabase = await createServiceClient();

  // Get max sort_order
  const { data: maxData } = await (supabase.from("room_type_images") as any)
    .select("sort_order")
    .eq("room_type_id", room_type_id)
    .eq("hotel_id", hotelId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sort_order = maxData ? (maxData as any).sort_order + 1 : 0;

  // Check if this is the first image -> set as cover
  const { data: existingImages } = await (supabase.from("room_type_images") as any)
    .select("id")
    .eq("room_type_id", room_type_id)
    .eq("hotel_id", hotelId)
    .limit(1);

  const is_cover = !existingImages || existingImages.length === 0;

  const { data, error } = await (supabase.from("room_type_images") as any).insert({
    room_type_id,
    hotel_id: hotelId,
    image_url,
    is_cover,
    sort_order,
  }).select().single();

  if (error) {
    console.error("uploadRoomTypeImage error:", error);
    return { error: "ไม่สามารถบันทึกรูปภาพได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data };
}

export async function setCoverImage(roomTypeId: string, imageId: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();

  // Unset all covers for this room type
  await (supabase.from("room_type_images") as any)
    .update({ is_cover: false })
    .eq("room_type_id", roomTypeId)
    .eq("hotel_id", hotelId);

  // Set new cover
  const { error } = await (supabase.from("room_type_images") as any)
    .update({ is_cover: true })
    .eq("id", imageId)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error("setCoverImage error:", error);
    return { error: "ไม่สามารถตั้งรูปหน้าปกได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}

export async function deleteRoomTypeImage(imageId: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();

  // Get image details first
  const { data: imageData } = await (supabase.from("room_type_images") as any)
    .select("room_type_id, is_cover")
    .eq("id", imageId)
    .eq("hotel_id", hotelId)
    .single();

  const image = imageData as any;
  if (!image) return { error: "ไม่พบรูปภาพ" };

  const { error } = await (supabase.from("room_type_images") as any)
    .delete()
    .eq("id", imageId)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error("deleteRoomTypeImage error:", error);
    return { error: "ไม่สามารถลบรูปภาพได้: " + (error.message || JSON.stringify(error)) };
  }

  // If deleted image was cover, set first remaining as cover
  if (image.is_cover) {
    const { data: remaining } = await (supabase.from("room_type_images") as any)
      .select("id")
      .eq("room_type_id", image.room_type_id)
      .eq("hotel_id", hotelId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .single();

    if (remaining) {
      await (supabase.from("room_type_images") as any)
        .update({ is_cover: true })
        .eq("id", (remaining as any).id)
        .eq("hotel_id", hotelId);
    }
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}

// ─── Physical Room Actions ─────────────────────────────────

export async function createRoom(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const room_number = (formData.get("room_number") as string)?.trim();
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "available";
  const housekeeping = (formData.get("housekeeping") as string) || "clean";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true";

  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (!room_number) return { error: "กรุณากรอกเลขห้อง" };

  const supabase = await createServiceClient();

  // Check room_number uniqueness within hotel
  const { data: existing } = await (supabase.from("rooms") as any)
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("room_number", room_number)
    .single();

  if (existing) return { error: "เลขห้องนี้มีอยู่แล้ว" };

  const { data, error } = await (supabase.from("rooms") as any).insert({
    hotel_id: hotelId,
    room_type_id,
    room_number,
    floor,
    status,
    housekeeping,
    notes,
    is_active,
  }).select().single();

  if (error) {
    console.error("createRoom error:", error);
    return { error: "ไม่สามารถสร้างห้องพักได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data };
}

export async function updateRoom(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const id = formData.get("id") as string;
  const room_type_id = formData.get("room_type_id") as string;
  const room_number = (formData.get("room_number") as string)?.trim();
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "available";
  const housekeeping = (formData.get("housekeeping") as string) || "clean";
  const notes = (formData.get("notes") as string)?.trim() || null;
  const is_active = formData.get("is_active") === "true";

  if (!id) return { error: "ID is required" };
  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (!room_number) return { error: "กรุณากรอกเลขห้อง" };

  const supabase = await createServiceClient();

  // Check room_number uniqueness excluding current record
  const { data: existing } = await (supabase.from("rooms") as any)
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("room_number", room_number)
    .neq("id", id)
    .single();

  if (existing) return { error: "เลขห้องนี้มีอยู่แล้ว" };

  const { data, error } = await (supabase.from("rooms") as any)
    .update({ room_type_id, room_number, floor, status, housekeeping, notes, is_active })
    .eq("id", id)
    .eq("hotel_id", hotelId)
    .select()
    .single();

  if (error) {
    console.error("updateRoom error:", error);
    return { error: "ไม่สามารถอัปเดตห้องพักได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true, data };
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();

  // Check if any bookings reference this room
  const { data: bookingsData, error: bookingsError } = await (supabase.from("bookings") as any)
    .select("id")
    .eq("room_id", id)
    .eq("hotel_id", hotelId)
    .limit(1);

  if (bookingsError) return { error: "Failed to check associated bookings" };
  if (bookingsData && bookingsData.length > 0) {
    return { error: "ไม่สามารถลบได้ เนื่องจากมีการจองที่เกี่ยวข้อง" };
  }

  const { error } = await (supabase.from("rooms") as any)
    .delete()
    .eq("id", id)
    .eq("hotel_id", hotelId);

  if (error) {
    console.error("deleteRoom error:", error);
    return { error: "ไม่สามารถลบห้องพักได้: " + (error.message || JSON.stringify(error)) };
  }

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return { success: true };
}

// ─── Fetch Rooms for Admin ───────────────────────────────

export async function getAdminRooms(): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const supabase = await createServiceClient();

  const { data: rooms } = await (supabase.from("rooms") as any)
    .select(`
      *,
      bookings (
        id,
        check_in_date,
        check_out_date,
        status,
        customers (
          full_name
        )
      )
    `)
    .eq("hotel_id", hotelId)
    .order("room_number", { ascending: true });

  const roomsWithBookings = (rooms || []).map((room: any) => {
    const processedBookings = (room.bookings || []).map((b: any) => ({
      ...b,
      guest_name: b.customers?.full_name || "Unknown Guest",
      check_in: b.check_in_date,
      check_out: b.check_out_date,
    }));

    const activeBooking =
      processedBookings.find((b: any) => b.status === "checked_in") ||
      processedBookings.find((b: any) => b.status === "confirmed");
    return {
      ...room,
      bookings: processedBookings,
      currentBooking: activeBooking || null,
    };
  });

  return { success: true, data: roomsWithBookings };
}

// ─── Bulk Create Rooms ──────────────────────────────────

export async function bulkCreateRooms(formData: FormData): Promise<ActionResult> {
  const session = await getValidatedSession();
  if (!session) return { error: "Unauthorized" };
  const hotelId = session.hotelId!;

  const room_type_id = formData.get("room_type_id") as string;
  const prefix = (formData.get("prefix") as string)?.trim() || "";
  const startNumber = parseInt(formData.get("start_number") as string, 10);
  const count = parseInt(formData.get("count") as string, 10);
  const floor = (formData.get("floor") as string)?.trim() || null;
  const status = (formData.get("status") as string) || "available";
  const housekeeping = (formData.get("housekeeping") as string) || "clean";

  if (!room_type_id) return { error: "กรุณาเลือกประเภทห้อง" };
  if (isNaN(startNumber) || startNumber < 0) return { error: "เลขเริ่มต้นไม่ถูกต้อง" };
  if (isNaN(count) || count < 1 || count > 100) return { error: "จำนวนห้องต้องอยู่ระหว่าง 1-100" };

  const supabase = await createServiceClient();

  // Generate room numbers
  const roomNumbers = Array.from({ length: count }, (_, i) => `${prefix}${startNumber + i}`);

  // Check which room numbers already exist
  const { data: existingRooms } = await (supabase.from("rooms") as any)
    .select("room_number")
    .eq("hotel_id", hotelId)
    .in("room_number", roomNumbers);

  const existingSet = new Set((existingRooms || []).map((r: any) => r.room_number));
  const newRoomNumbers = roomNumbers.filter((rn) => !existingSet.has(rn));

  if (newRoomNumbers.length === 0) {
    return { error: "ห้องทั้งหมดที่ต้องการสร้างมีอยู่ในระบบแล้ว" };
  }

  const rows = newRoomNumbers.map((room_number) => ({
    hotel_id: hotelId,
    room_type_id,
    room_number,
    floor,
    status,
    housekeeping,
    is_active: true,
  }));

  const { data, error } = await (supabase.from("rooms") as any)
    .insert(rows)
    .select();

  if (error) {
    console.error("bulkCreateRooms error:", error);
    return { error: "ไม่สามารถสร้างห้องพักได้: " + (error.message || JSON.stringify(error)) };
  }

  const skipped = roomNumbers.filter((rn) => existingSet.has(rn));

  revalidatePath("/admin/rooms");
  revalidatePath("/");
  revalidatePath("/");
  return { success: true, data: { created: data || [], skipped } };
}
