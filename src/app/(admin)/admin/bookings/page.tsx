import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminBookingFormOptions } from "@/app/actions/booking";
import {
  AdminBookingsClient,
  type AdminBookingRow,
  type AdminCalendarRoom,
} from "@/components/admin/bookings/AdminBookingsClient";

export const metadata = {
  title: "การจอง | Arkkarawin",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.hotelId) redirect("/login");

  const params = (await searchParams) ?? {};
  const q = Array.isArray(params.q) ? params.q[0] : params.q || "";
  const status = Array.isArray(params.status) ? params.status[0] : params.status || "";

  const supabase = await createServiceClient();

  const [bookingsResult, roomsResult, formOptions] = await Promise.all([
    supabase
      .from("bookings")
      .select(`
        id,
        booking_number,
        check_in_date,
        check_out_date,
        num_guests,
        status,
        source,
        total_amount,
        discount_amount,
        net_amount,
        special_requests,
        notes,
        cancel_reason,
        confirmed_at,
        checked_in_at,
        checked_out_at,
        cancelled_at,
        created_at,
        room_id,
        customers (
          full_name,
          phone,
          email
        ),
        rooms (
          room_number,
          room_types (
            name
          )
        ),
        payments (
          id,
          amount,
          status,
          method,
          slip_image_url,
          notes
        ),
        booking_promotions (
          promotion_name,
          promotion_code,
          discount_amount
        )
      `)
      .eq("hotel_id", session.hotelId)
      .order("created_at", { ascending: false })
      .returns<AdminBookingRow[]>(),
    supabase
      .from("rooms")
      .select(`
        id,
        room_number,
        floor,
        status,
        is_active,
        room_types (
          id,
          name
        )
      `)
      .eq("hotel_id", session.hotelId)
      .eq("is_active", true)
      .order("room_number", { ascending: true })
      .returns<AdminCalendarRoom[]>(),
    getAdminBookingFormOptions(),
  ]);

  const { data: bookings, error: bookingsError } = bookingsResult;
  const { data: rooms, error: roomsError } = roomsResult;

  return (
    <div className="space-y-5 md:space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#8b7355] font-semibold">
            จัดการการจอง
          </p>
          <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a] mt-1">การจอง</h1>
          <p className="hidden md:block text-sm text-[#8b7355] mt-1">
            ตรวจสอบสถานะ ชำระเงิน และจัดการเช็คอิน-เช็คเอาท์ทุกการจอง
          </p>
        </div>
      </div>

      {(bookingsError || roomsError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          ไม่สามารถโหลดข้อมูลการจองได้
          {bookingsError ? `: ${bookingsError.message}` : ""}
          {roomsError ? ` / ${roomsError.message}` : ""}
        </div>
      )}

      <AdminBookingsClient
        bookings={bookings ?? []}
        rooms={rooms ?? []}
        formOptions={formOptions}
        initialQuery={q}
        initialStatus={status}
      />
    </div>
  );
}
