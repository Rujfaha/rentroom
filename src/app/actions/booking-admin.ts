"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

interface UpdateResult {
  error: { message?: string } | null;
}

interface BookingNotesUpdate {
  notes: string | null;
}

interface BookingRejectUpdate {
  status: "cancelled";
  cancelled_at: string;
  cancel_reason: string;
}

interface PaymentRejectUpdate {
  status: "rejected";
  verified_by: string;
  verified_at: string;
  notes: string | null;
}

interface UpdateScopedTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<UpdateResult>;
    };
  };
}

interface ActionResponse {
  success: boolean;
  error?: string;
}

const REJECT_REASON_MAX = 500;
const NOTE_MAX = 1000;

function revalidateBookingPages() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/rooms");
  revalidatePath("/admin");
  revalidatePath("/booking");
  revalidatePath("/");
}

function sanitizeText(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/**
 * Reject a booking with an admin-provided reason.
 * Stores the reason in bookings.cancel_reason and payments.notes.
 * This is a separate action from rejectBooking() to avoid conflicting with
 * existing list-view flows. The detail modal uses this action so admins
 * can capture context for the rejection.
 */
export async function rejectBookingWithReason(formData: FormData): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.hotelId) {
    return { success: false, error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) {
    return { success: false, error: "ไม่พบรหัสการจอง" };
  }

  const reason = sanitizeText(formData.get("reason"), REJECT_REASON_MAX);
  if (!reason) {
    return { success: false, error: "กรุณากรอกเหตุผลการปฏิเสธ" };
  }

  const supabase = await createServiceClient();
  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingRejectUpdate>;
  const { error: bookingError } = await bookingsTable
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (bookingError) {
    console.error("rejectBookingWithReason booking error:", bookingError);
    return { success: false, error: "ไม่สามารถปฏิเสธการจองได้" };
  }

  const paymentsTable = supabase.from("payments") as unknown as UpdateScopedTable<PaymentRejectUpdate>;
  const { error: paymentError } = await paymentsTable
    .update({
      status: "rejected",
      verified_by: session.userId,
      verified_at: new Date().toISOString(),
      notes: reason,
    })
    .eq("booking_id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (paymentError) {
    console.error("rejectBookingWithReason payment error:", paymentError);
    // Booking was rejected; payment update is best-effort. Continue.
  }

  revalidateBookingPages();
  return { success: true };
}

/**
 * Update the internal note (bookings.notes) for a booking.
 * Used by the detail modal so admins can record private context
 * without affecting the customer-visible special_requests field.
 */
export async function updateBookingInternalNote(formData: FormData): Promise<ActionResponse> {
  const session = await getSession();
  if (!session?.hotelId) {
    return { success: false, error: "ไม่มีสิทธิ์เข้าถึง" };
  }

  const bookingId = String(formData.get("booking_id") || "");
  if (!bookingId) {
    return { success: false, error: "ไม่พบรหัสการจอง" };
  }

  const note = sanitizeText(formData.get("note"), NOTE_MAX);
  const supabase = await createServiceClient();
  const bookingsTable = supabase.from("bookings") as unknown as UpdateScopedTable<BookingNotesUpdate>;
  const { error } = await bookingsTable
    .update({ notes: note ? note : null })
    .eq("id", bookingId)
    .eq("hotel_id", session.hotelId);

  if (error) {
    console.error("updateBookingInternalNote error:", error);
    return { success: false, error: "ไม่สามารถบันทึกบันทึกภายในได้" };
  }

  revalidateBookingPages();
  return { success: true };
}
