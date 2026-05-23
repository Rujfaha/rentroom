"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  LayoutGrid,
  List,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  Search,
  UserX,
  XCircle,
} from "lucide-react";
import { approveBooking, checkInBooking, checkOutBooking, markNoShowBooking, rejectBooking } from "@/app/actions/booking";
import type { AdminBookingRoomTypeOption } from "@/app/actions/booking";
import { BookingDetailModal } from "./BookingDetailModal";
import { BookingsCalendarView } from "./BookingsCalendarView";
import { CreateBookingModal, type CreateBookingPrefill } from "./CreateBookingModal";

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "verified" | "rejected";

export interface AdminBookingPaymentRow {
  id: string;
  amount: number | string;
  status: PaymentStatus;
  method: string;
  slip_image_url: string | null;
  notes?: string | null;
}

export interface AdminBookingPromotionRow {
  promotion_name: string | null;
  promotion_code: string | null;
  discount_amount: number | string | null;
}

export interface AdminBookingRow {
  id: string;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  source: string;
  total_amount: number | string;
  discount_amount?: number | string | null;
  net_amount: number | string;
  special_requests: string | null;
  notes?: string | null;
  cancel_reason?: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  room_id: string | null;
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
  payments: AdminBookingPaymentRow[] | null;
  booking_promotions?: AdminBookingPromotionRow[] | null;
}

export interface AdminCalendarRoom {
  id: string;
  room_number: string;
  floor: string | null;
  status: string;
  is_active: boolean;
  room_types: {
    id: string;
    name: string;
  } | null;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  checked_in: "bg-sky-50 text-sky-700 border-sky-200",
  checked_out: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  checked_in: "เช็คอินแล้ว",
  checked_out: "เช็คเอาท์แล้ว",
  cancelled: "ยกเลิก",
  no_show: "ไม่เข้าพัก",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "รอตรวจ",
  verified: "ชำระแล้ว",
  rejected: "ถูกปฏิเสธ",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  verified: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

const STATUS_OPTIONS: Array<{ value: "" | BookingStatus; label: string }> = [
  { value: "", label: "สถานะทั้งหมด" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "checked_in", label: STATUS_LABELS.checked_in },
  { value: "checked_out", label: STATUS_LABELS.checked_out },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
  { value: "no_show", label: STATUS_LABELS.no_show },
];

function formatPrice(value: number | string): string {
  return Number(value || 0).toLocaleString("th-TH");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
void formatDate;

function getPaymentStatus(booking: AdminBookingRow): PaymentStatus {
  return booking.payments?.[0]?.status || "pending";
}

function formatDateRangeShort(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();
  const startLabel = startDate.toLocaleDateString("th-TH", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" }),
  });
  const endLabel = endDate.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
  return `${startLabel} - ${endLabel}`;
}

function getNights(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  if (Number.isNaN(diff) || diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function getSearchText(booking: AdminBookingRow): string {
  return [
    booking.booking_number,
    booking.customers?.full_name,
    booking.customers?.phone,
    booking.customers?.email,
    booking.rooms?.room_number,
    booking.rooms?.room_types?.name,
    booking.source,
    STATUS_LABELS[booking.status],
    PAYMENT_LABELS[getPaymentStatus(booking)],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function BookingActions({ booking, onOpenDetail }: { booking: AdminBookingRow; onOpenDetail: () => void }) {
  const canCheckIn = booking.status === "confirmed";
  const canCheckOut = booking.status === "checked_in";
  const canMarkNoShow = booking.status === "confirmed" || booking.status === "checked_in";
  const confirmCheckIn = `ยืนยันเช็คอินรายการ ${booking.booking_number}?`;
  const confirmCheckOut = `ยืนยันเช็คเอาท์รายการ ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`;
  const confirmNoShow = `ยืนยันว่าลูกค้าไม่เข้าพักสำหรับรายการ ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 min-w-full lg:min-w-[180px]">
      <button
        type="button"
        onClick={onOpenDetail}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#c9a84c]/40 text-[#1a3c2a] bg-[#c9a84c]/10 rounded-lg hover:bg-[#c9a84c]/20 transition-colors text-sm font-medium cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5" />
        ดูรายละเอียด
      </button>

      {booking.payments?.[0]?.slip_image_url && (
        <a
          href={booking.payments[0].slip_image_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#e8e2d6] text-[#1a3c2a] rounded-lg hover:bg-[#faf7f0] transition-colors text-sm font-medium"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          ดูสลิป
        </a>
      )}

      {booking.status === "pending" && (
        <>
          <form action={approveBooking}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              ยืนยัน
            </button>
          </form>
          <form action={rejectBooking}>
            <input type="hidden" name="booking_id" value={booking.id} />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              ปฏิเสธ
            </button>
          </form>
        </>
      )}

      {canCheckIn && (
        <form
          action={checkInBooking}
          onSubmit={(event) => {
            if (!window.confirm(confirmCheckIn)) event.preventDefault();
          }}
        >
          <input type="hidden" name="booking_id" value={booking.id} />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            เช็คอิน
          </button>
        </form>
      )}

      {canCheckOut && (
        <form
          action={checkOutBooking}
          onSubmit={(event) => {
            if (!window.confirm(confirmCheckOut)) event.preventDefault();
          }}
        >
          <input type="hidden" name="booking_id" value={booking.id} />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            เช็คเอาท์
          </button>
        </form>
      )}

      {canMarkNoShow && (
        <form
          action={markNoShowBooking}
          onSubmit={(event) => {
            if (!window.confirm(confirmNoShow)) event.preventDefault();
          }}
        >
          <input type="hidden" name="booking_id" value={booking.id} />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium cursor-pointer"
          >
            <UserX className="w-3.5 h-3.5" />
            ไม่เข้าพัก
          </button>
        </form>
      )}
    </div>
  );
}

interface AdminBookingsClientProps {
  bookings: AdminBookingRow[];
  rooms: AdminCalendarRoom[];
  formOptions: AdminBookingRoomTypeOption[];
  initialQuery: string;
  initialStatus: string;
}

type ViewMode = "list" | "calendar";

export function AdminBookingsClient({ bookings, rooms, formOptions, initialQuery, initialStatus }: AdminBookingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [createPrefill, setCreatePrefill] = useState<CreateBookingPrefill | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);

  function syncUrl(nextQuery: string, nextStatus: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    else params.delete("q");
    if (nextStatus) params.set("status", nextStatus);
    else params.delete("status");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    syncUrl(value, status);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    syncUrl(query, value);
  }

  function handleReset() {
    setQuery("");
    setStatus("");
    syncUrl("", "");
  }

  const filteredBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = !status || booking.status === status;
      const matchesQuery = !needle || getSearchText(booking).includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, query, status]);

  const stats = {
    total: filteredBookings.length,
    pending: filteredBookings.filter((booking) => booking.status === "pending").length,
    confirmed: filteredBookings.filter((booking) => booking.status === "confirmed").length,
    paid: filteredBookings.filter((booking) => getPaymentStatus(booking) === "verified").length,
  };

  const statCards = [
    { label: "การจองทั้งหมด", value: stats.total, icon: CalendarDays, iconClass: "bg-[#1a3c2a]/10 text-[#1a3c2a]" },
    { label: "รอตรวจสอบ", value: stats.pending, icon: Clock, iconClass: "bg-amber-100 text-amber-700" },
    { label: "ยืนยันแล้ว", value: stats.confirmed, icon: CheckCircle2, iconClass: "bg-emerald-100 text-emerald-700" },
    { label: "ชำระแล้ว", value: stats.paid, icon: CreditCard, iconClass: "bg-sky-100 text-sky-700" },
  ];

  const hasFilter = Boolean(query.trim() || status);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  const handleCalendarEmptyCell = (input: { roomId: string; date: string }) => {
    const room = rooms.find((item) => item.id === input.roomId);
    const checkIn = input.date;
    const checkOutDate = new Date(`${checkIn}T00:00:00`);
    if (Number.isNaN(checkOutDate.getTime())) return;
    checkOutDate.setDate(checkOutDate.getDate() + 1);
    const checkOut = checkOutDate.toISOString().split("T")[0];
    setCreatePrefill({
      roomId: input.roomId,
      roomTypeId: room?.room_types?.id,
      checkIn,
      checkOut,
    });
    setCreateSuccessMessage(null);
    setCreateOpen(true);
  };

  const handleOpenCreate = () => {
    setCreatePrefill(null);
    setCreateSuccessMessage(null);
    setCreateOpen(true);
  };

  const handleCreateSuccess = ({ bookingNumber }: { bookingNumber: string }) => {
    setCreateOpen(false);
    setCreatePrefill(null);
    setCreateSuccessMessage(`สร้างการจอง ${bookingNumber} สำเร็จ`);
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl md:rounded-xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] p-4 md:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-[#8b7355] font-semibold leading-tight">
                  {card.label}
                </p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${card.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl md:text-[28px] font-serif text-[#1a3c2a] font-bold leading-none tabular-nums mt-2">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* View tabs + create */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-[#e8e2d6] bg-white p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "list" ? "bg-[#1a3c2a] text-[#faf7f0]" : "text-[#8b7355] hover:text-[#1a3c2a]"
            }`}
          >
            <List className="w-4 h-4" />
            รายการ
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              viewMode === "calendar" ? "bg-[#1a3c2a] text-[#faf7f0]" : "text-[#8b7355] hover:text-[#1a3c2a]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            ปฏิทินห้องพัก
          </button>
        </div>

        <div className="ml-auto">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-xl hover:bg-[#0f2418] transition-colors text-sm font-semibold cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            สร้างการจอง
          </button>
        </div>
      </div>

      {createSuccessMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
          <p>{createSuccessMessage}</p>
          <button
            type="button"
            onClick={() => setCreateSuccessMessage(null)}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          <div className="bg-white rounded-2xl border border-[#e8e2d6] p-4 shadow-sm">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#8b7355] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder="ค้นหารหัสจอง ชื่อลูกค้า เบอร์โทร อีเมล ห้อง หรือประเภทห้อง..."
                  className="w-full pl-9 pr-3 py-3 bg-[#faf7f0] border border-[#e8e2d6] rounded-xl text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative min-w-full sm:min-w-[220px]">
                  <Filter className="w-4 h-4 text-[#8b7355] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={status}
                    onChange={(event) => handleStatusChange(event.target.value)}
                    className="w-full pl-9 pr-9 py-3 bg-[#faf7f0] border border-[#e8e2d6] rounded-xl text-sm text-[#2c2c2c] focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer appearance-none"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value || "all"} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasFilter}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-[#e8e2d6] text-[#8b7355] rounded-xl hover:bg-[#faf7f0] hover:text-[#1a3c2a] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ล้างตัวกรอง
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[#8b7355]">
              <span>
                แสดง {filteredBookings.length.toLocaleString("th-TH")} จาก {bookings.length.toLocaleString("th-TH")} รายการ
              </span>
              {isPending && <span className="text-[#c9a84c]">กำลังอัปเดตตัวกรอง...</span>}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl">
              <CalendarDays className="w-10 h-10 mx-auto mb-3 text-[#c4b9a8]" />
              <p className="text-[#8b7355] font-medium">ไม่พบรายการจองที่ตรงกับตัวกรอง</p>
              <p className="text-sm text-[#a89279] mt-1">ลองเปลี่ยนคำค้นหาหรือสถานะเพื่อดูรายการอื่น</p>
            </div>
          ) : (
            <ul className="space-y-2.5 md:space-y-3">
              {filteredBookings.map((booking) => {
                const paymentStatus = getPaymentStatus(booking);
                const customerName = booking.customers?.full_name || "ไม่ระบุชื่อ";
                const customerInitial = customerName.charAt(0).toUpperCase() || "?";
                const contact = booking.customers?.phone || booking.customers?.email;
                const roomTypeName = booking.rooms?.room_types?.name;
                const roomNumber = booking.rooms?.room_number;
                const nights = getNights(booking.check_in_date, booking.check_out_date);

                return (
                  <li
                    key={booking.id}
                    className="bg-white rounded-2xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] hover:shadow-[0_4px_16px_-4px_rgba(15,31,23,0.08)] hover:border-[#c9a84c]/30 transition-all duration-200 p-4 md:p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Top row: avatar + name + status */}
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c]/25 to-[#8b7355]/15 border border-[#c9a84c]/20 flex items-center justify-center text-[#1a3c2a] font-semibold text-sm flex-shrink-0 cursor-pointer hover:brightness-105"
                            aria-label={`ดูรายละเอียด ${booking.booking_number}`}
                          >
                            {customerInitial}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedBookingId(booking.id)}
                                className="font-semibold text-[#1a3c2a] text-sm md:text-base truncate hover:underline cursor-pointer"
                              >
                                {customerName}
                              </button>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold border whitespace-nowrap flex-shrink-0 ${STATUS_STYLES[booking.status]}`}
                              >
                                {STATUS_LABELS[booking.status]}
                              </span>
                            </div>
                            <p className="text-[11px] md:text-xs text-[#8b7355] mt-0.5 truncate">
                              <span className="font-mono text-[#5c4a35]">{booking.booking_number}</span>
                              {contact && (
                                <>
                                  <span className="mx-1.5 text-[#c4b9a8]">·</span>
                                  {contact}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Middle: stay summary chips */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs">
                          <div className="rounded-lg bg-[#faf7f0] border border-[#f0ece4] px-2.5 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-[#8b7355] font-semibold">
                              ห้องพัก
                            </p>
                            <p className="text-[#1a3c2a] font-medium truncate mt-0.5">
                              {roomTypeName || "-"}
                            </p>
                            <p className="text-[10px] text-[#8b7355] truncate">
                              {roomNumber ? `ห้อง ${roomNumber}` : "ยังไม่ระบุ"}
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#faf7f0] border border-[#f0ece4] px-2.5 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-[#8b7355] font-semibold">
                              วันเข้าพัก
                            </p>
                            <p className="text-[#1a3c2a] font-medium truncate mt-0.5 tabular-nums">
                              {formatDateRangeShort(booking.check_in_date, booking.check_out_date)}
                            </p>
                            <p className="text-[10px] text-[#8b7355]">
                              {nights > 0 ? `${nights} คืน` : "-"}
                              {booking.num_guests ? ` · ${booking.num_guests} ผู้เข้าพัก` : ""}
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#faf7f0] border border-[#f0ece4] px-2.5 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-[#8b7355] font-semibold">
                              การชำระเงิน
                            </p>
                            <span
                              className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${PAYMENT_STYLES[paymentStatus]}`}
                            >
                              {PAYMENT_LABELS[paymentStatus]}
                            </span>
                            <p className="text-[10px] text-[#8b7355] truncate mt-0.5">
                              {booking.source ? `ผ่าน ${booking.source}` : ""}
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#1a3c2a]/[0.04] border border-[#1a3c2a]/10 px-2.5 py-2">
                            <p className="text-[10px] uppercase tracking-wider text-[#8b7355] font-semibold">
                              ยอดสุทธิ
                            </p>
                            <p className="text-[#1a3c2a] font-serif font-bold text-base tabular-nums mt-0.5">
                              ฿{formatPrice(booking.net_amount)}
                            </p>
                          </div>
                        </div>

                        {booking.special_requests && (
                          <p className="mt-3 text-[11px] md:text-xs text-[#8b7355] line-clamp-2">
                            <span className="font-semibold text-[#5c4a35]">หมายเหตุ:</span>{" "}
                            {booking.special_requests}
                          </p>
                        )}
                      </div>

                      <BookingActions
                        booking={booking}
                        onOpenDetail={() => setSelectedBookingId(booking.id)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <BookingsCalendarView
          bookings={bookings}
          rooms={rooms}
          onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
          onSelectEmptyCell={handleCalendarEmptyCell}
        />
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBookingId(null)}
        />
      )}

      {createOpen && (
        <CreateBookingModal
          options={formOptions}
          prefill={createPrefill ?? undefined}
          onClose={() => {
            setCreateOpen(false);
            setCreatePrefill(null);
          }}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}
