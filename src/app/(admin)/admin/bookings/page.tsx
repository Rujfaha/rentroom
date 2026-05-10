import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminBookingsClient, type AdminBookingRow } from "@/components/admin/bookings/AdminBookingsClient";

export const metadata = {
  title: "Bookings | Valley Retreat",
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
  const { data, error } = await supabase
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
      net_amount,
      special_requests,
      confirmed_at,
      checked_in_at,
      checked_out_at,
      cancelled_at,
      created_at,
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
        slip_image_url
      )
    `)
    .eq("hotel_id", session.hotelId)
    .order("created_at", { ascending: false })
    .returns<AdminBookingRow[]>();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-serif text-[#1a3c2a]">การจอง</h1>
        <p className="text-[#8b7355] text-sm mt-1">
          แสดงรายการจองจริงจากฐานข้อมูล พร้อมข้อมูลลูกค้า ห้องพัก และสถานะชำระเงิน
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          ไม่สามารถโหลดข้อมูลการจองได้: {error.message}
        </div>
      )}

      <AdminBookingsClient
        bookings={data ?? []}
        initialQuery={q}
        initialStatus={status}
      />
    </div>
  );
}
