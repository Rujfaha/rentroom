import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, BedDouble, CreditCard, Users, ArrowRight, Inbox } from "lucide-react";
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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  checked_in: "bg-blue-50 text-blue-700",
  checked_out: "bg-stone-100 text-stone-600",
  cancelled: "bg-rose-50 text-rose-600",
  no_show: "bg-rose-50 text-rose-600",
  default: "bg-stone-100 text-stone-600",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

function getGreeting(hour: number): string {
  if (hour < 12) return "อรุณสวัสดิ์";
  if (hour < 17) return "สวัสดียามบ่าย";
  return "สวัสดียามค่ำ";
}

function formatTodayLong(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
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

  const [
    { data: roomsData },
    { data: todayBookings },
    { data: yesterdayBookings },
    { data: checkInBookings },
    { data: yesterdayCheckIns },
    { data: recentBookingsData },
  ] = await Promise.all([
    supabase
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
      .returns<DashboardRoomRow[]>(),
    supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .gte("created_at", today)
      .lt("created_at", tomorrow),
    supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .gte("created_at", yesterday)
      .lt("created_at", today),
    supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("check_in_date", today)
      .in("status", ["confirmed", "checked_in"]),
    supabase
      .from("bookings")
      .select("id")
      .eq("hotel_id", hotelId)
      .eq("check_in_date", yesterday)
      .in("status", ["confirmed", "checked_in"]),
    supabase
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
      .returns<DashboardBookingRow[]>(),
  ]);

  const rooms = roomsData ?? [];
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((room) => room.status === "available").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  const outOfStockRooms = rooms.filter((room) => room.status !== "available").length;

  const revenueFromCutStock = rooms
    .filter((room) => room.status === "occupied")
    .reduce((sum, room) => sum + Number(room.room_types?.base_price || 0), 0);

  const todayCount = todayBookings?.length || 0;
  const yesterdayCount = yesterdayBookings?.length || 0;
  const bookingDiff = todayCount - yesterdayCount;

  const checkInCount = checkInBookings?.length || 0;
  const yesterdayCheckInCount = yesterdayCheckIns?.length || 0;
  const checkInDiff = checkInCount - yesterdayCheckInCount;

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
    <div className="space-y-5 md:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#8b7355] font-semibold">
            แดชบอร์ด · {formatTodayLong(now)}
          </p>
          <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a] mt-1">
            {getGreeting(now.getHours())}, {session.fullName}
          </h1>
          <p className="hidden md:block text-sm text-[#8b7355] mt-1">
            ภาพรวมการจอง สถานะห้องพัก และรายได้แบบเรียลไทม์
          </p>
        </div>

        <Link
          href="/admin/bookings"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a3c2a] text-[#faf7f0] text-xs font-semibold uppercase tracking-wider hover:bg-[#0f2418] transition-colors shadow-sm"
        >
          จัดการการจอง
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 border-b border-[#f0ece4]">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b7355] font-semibold">กิจกรรมล่าสุด</p>
              <h2 className="text-base md:text-lg font-serif text-[#1a3c2a] mt-0.5">การจองล่าสุด</h2>
            </div>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a3c2a] hover:text-[#c9a84c] transition-colors whitespace-nowrap"
            >
              ดูทั้งหมด
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 md:h-56 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#faf7f0] border border-[#e8e2d6] flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 text-[#a89279]" />
              </div>
              <p className="text-sm font-medium text-[#5c4a35]">ยังไม่มีรายการจอง</p>
              <p className="text-xs text-[#a89279] mt-1">เมื่อมีการจองใหม่จะแสดงที่นี่</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f0ece4]">
              {recentBookings.map((booking) => {
                const statusLabel = BOOKING_STATUS_LABELS[booking.status] || booking.status;
                const statusStyle = STATUS_STYLES[booking.status] ?? STATUS_STYLES.default;
                const customerName = booking.customers?.full_name || "-";
                const customerInitial = customerName.charAt(0).toUpperCase() || "?";
                const roomLabel = [booking.rooms?.room_types?.name, booking.rooms?.room_number]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings?focus=${booking.id}`}
                      className="flex items-center gap-3 px-4 md:px-6 py-3 hover:bg-[#faf7f0]/70 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c]/25 to-[#8b7355]/15 border border-[#c9a84c]/20 flex items-center justify-center text-[#1a3c2a] font-semibold text-sm flex-shrink-0">
                        {customerInitial}
                      </div>

                      {/* Main info */}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#1a3c2a] text-sm truncate">
                          {customerName}
                        </p>
                        <p className="text-[11px] md:text-xs text-[#8b7355] truncate mt-0.5">
                          <span className="font-mono text-[#5c4a35]">{booking.booking_number}</span>
                          {roomLabel && (
                            <>
                              <span className="mx-1.5 text-[#c4b9a8]">·</span>
                              {roomLabel}
                            </>
                          )}
                        </p>
                      </div>

                      {/* Right meta */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyle}`}
                        >
                          {statusLabel}
                        </span>
                        <span className="text-[11px] text-[#8b7355] whitespace-nowrap tabular-nums">
                          {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Room status panel */}
        <div className="bg-white rounded-2xl md:rounded-xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-6 py-3.5 md:py-4 border-b border-[#f0ece4]">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#8b7355] font-semibold">สรุปสต็อก</p>
              <h2 className="text-base md:text-lg font-serif text-[#1a3c2a] mt-0.5">สถานะห้องพัก</h2>
            </div>
            <span className="text-[11px] text-[#8b7355] tabular-nums whitespace-nowrap">
              ทั้งหมด {totalRooms} ห้อง
            </span>
          </div>

          <div className="p-4 md:p-6">
            {/* Occupancy progress */}
            {totalRooms > 0 && (
              <div className="mb-4 md:mb-5">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[#8b7355] font-semibold">
                    อัตราเข้าพัก
                  </span>
                  <span className="text-lg font-serif text-[#1a3c2a] font-semibold tabular-nums">
                    {Math.round((outOfStockRooms / totalRooms) * 100)}
                    <span className="text-[11px] text-[#8b7355] ml-0.5">%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#f0ece4] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#c9a84c] to-[#a0842e] transition-all duration-500"
                    style={{ width: `${(outOfStockRooms / totalRooms) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Status tiles */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-2">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                <span className="flex items-center gap-1.5 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  ว่าง
                </span>
                <span className="font-serif text-xl lg:text-lg font-bold mt-1 lg:mt-0 text-emerald-900 tabular-nums">
                  {availableRooms}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 rounded-xl bg-amber-50 border border-amber-300">
                <span className="flex items-center gap-1.5 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0" />
                  เข้าพัก
                </span>
                <span className="font-serif text-xl lg:text-lg font-bold mt-1 lg:mt-0 text-amber-900 tabular-nums">
                  {occupiedRooms}
                </span>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 rounded-xl bg-stone-100 border border-stone-400">
                <span className="flex items-center gap-1.5 text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-stone-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500 flex-shrink-0" />
                  ตัด stock
                </span>
                <span className="font-serif text-xl lg:text-lg font-bold mt-1 lg:mt-0 text-stone-800 tabular-nums">
                  {outOfStockRooms}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
