import { redirect } from "next/navigation";
import { CalendarDays, BedDouble, CreditCard, Users } from "lucide-react";
import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { StatCard } from "@/components/admin/StatCard";

export const metadata = {
  title: "ภาพรวมระบบ | Arkkarawin",
};

type RoomStatus = "available" | "occupied" | "maintenance" | "out_of_order";
type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";

interface DashboardRoomRow {
  id: string;
  status: RoomStatus;
  room_types: {
    name: string;
    base_price: number | string;
  } | null;
}

interface DashboardBookingRow {
  id: string;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  status: BookingStatus;
  created_at: string;
  customers: {
    full_name: string;
  } | null;
  rooms: {
    room_number: string;
    room_types: {
      name: string;
    } | null;
  } | null;
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getTrend(current: number, previous: number) {
  const diff = current - previous;
  if (previous > 0) {
    return { value: Math.round((Math.abs(diff) / previous) * 100), isPositive: diff >= 0 };
  }

  if (current > 0) {
    return { value: 100, isPositive: true };
  }

  return undefined;
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  checked_in: "เช็คอินแล้ว",
  checked_out: "เช็คเอาท์แล้ว",
  cancelled: "ยกเลิก",
  no_show: "ไม่เข้าพัก",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/login");

  if (session.role === "staff") {
    redirect("/admin/rooms/housekeeping");
  }

  const supabase = await createServiceClient();
  const hotelId = session.hotelId;

  const now = new Date();
  const today = toDateKey(now);
  const yesterday = toDateKey(new Date(now.getTime() - 86400000));
  const tomorrow = toDateKey(new Date(now.getTime() + 86400000));

  const { data: roomsData } = await supabase
    .from("rooms")
    .select(`
      id,
      status,
      room_types (
        name,
        base_price
      )
    `)
    .eq("hotel_id", hotelId)
    .eq("is_active", true)
    .returns<DashboardRoomRow[]>();

  const rooms = roomsData ?? [];
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room) => room.status === "available").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const outOfStockRooms = rooms.filter((room) => room.status !== "available").length;

  const revenueFromCutStock = rooms
    .filter((room) => room.status === "occupied")
    .reduce((sum, room) => sum + Number(room.room_types?.base_price || 0), 0);

  const { data: todayBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("hotel_id", hotelId)
    .gte("created_at", today)
    .lt("created_at", tomorrow);

  const { data: yesterdayBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("hotel_id", hotelId)
    .gte("created_at", yesterday)
    .lt("created_at", today);

  const todayCount = todayBookings?.length || 0;
  const yesterdayCount = yesterdayBookings?.length || 0;
  const bookingDiff = todayCount - yesterdayCount;

  const { data: checkInBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("check_in_date", today)
    .in("status", ["confirmed", "checked_in"]);

  const { data: yesterdayCheckIns } = await supabase
    .from("bookings")
    .select("id")
    .eq("hotel_id", hotelId)
    .eq("check_in_date", yesterday)
    .in("status", ["confirmed", "checked_in"]);

  const checkInCount = checkInBookings?.length || 0;
  const yesterdayCheckInCount = yesterdayCheckIns?.length || 0;
  const checkInDiff = checkInCount - yesterdayCheckInCount;

  const { data: recentBookingsData } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_number,
      check_in_date,
      check_out_date,
      status,
      created_at,
      customers (
        full_name
      ),
      rooms (
        room_number,
        room_types (
          name
        )
      )
    `)
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<DashboardBookingRow[]>();

  const recentBookings = recentBookingsData ?? [];

  const stats = [
    {
      title: "การจองวันนี้",
      value: String(todayCount),
      icon: CalendarDays,
      color: "indigo" as const,
      trend: getTrend(todayCount, yesterdayCount),
      description: bookingDiff === 0
        ? "เท่ากับเมื่อวาน"
        : `${bookingDiff > 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(bookingDiff)} รายการจากเมื่อวาน`,
    },
    {
      title: "ห้องว่าง",
      value: `${availableRooms} / ${totalRooms}`,
      icon: BedDouble,
      color: "emerald" as const,
      description: `ถูกตัด stock แล้ว ${outOfStockRooms} ห้อง เป็น occupied ${occupiedRooms} ห้อง`,
    },
    {
      title: "รายได้จากห้องที่ตัด stock",
      value: `฿${revenueFromCutStock.toLocaleString("th-TH")}`,
      icon: CreditCard,
      color: "amber" as const,
      description: `คำนวณจากราคาประเภทห้องของห้อง occupied ${occupiedRooms} ห้อง`,
    },
    {
      title: "ลูกค้ารอเช็คอิน",
      value: String(checkInCount),
      icon: Users,
      color: "blue" as const,
      trend: getTrend(checkInCount, yesterdayCheckInCount),
      description: checkInDiff === 0
        ? "เท่ากับเมื่อวาน"
        : `${checkInDiff > 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(checkInDiff)} รายการจากเมื่อวาน`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1a3c2a]">ภาพรวมระบบ</h1>
          <p className="text-[#8b7355] text-sm mt-1 uppercase tracking-wider font-medium">
            ยินดีต้อนรับกลับมา, {session.fullName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#e8e2d6] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-serif text-[#1a3c2a]">การจองล่าสุด</h2>
            <span className="text-xs text-[#8b7355]">ข้อมูลจริงจากฐานข้อมูล</span>
          </div>

          {recentBookings.length === 0 ? (
            <div className="flex items-center justify-center h-56 border-2 border-dashed border-[#e8e2d6] rounded-lg text-[#a89279]">
              ยังไม่มีรายการจอง
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-[#f0ece4] bg-[#faf7f0]/60">
                  <div>
                    <p className="font-semibold text-[#1a3c2a]">{booking.booking_number}</p>
                    <p className="text-sm text-[#8b7355]">
                      {booking.customers?.full_name || "-"} · {booking.rooms?.room_types?.name || "-"} ห้อง {booking.rooms?.room_number || "-"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-[#2c2c2c]">{formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}</p>
                    <p className="text-xs text-[#8b7355]">{BOOKING_STATUS_LABELS[booking.status] || booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] p-6">
          <h2 className="text-lg font-serif text-[#1a3c2a] mb-4">สถานะห้องพัก</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 text-emerald-700">
              <span className="text-sm font-medium">ว่าง</span>
              <span className="font-bold">{availableRooms}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 text-amber-700">
              <span className="text-sm font-medium">มีผู้เข้าพัก</span>
              <span className="font-bold">{occupiedRooms}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 text-stone-600">
              <span className="text-sm font-medium">ถูกตัด stock รวม</span>
              <span className="font-bold">{outOfStockRooms}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
