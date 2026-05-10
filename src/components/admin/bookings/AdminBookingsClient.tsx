"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Filter,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  UserRound,
  UserX,
  XCircle,
} from "lucide-react";
import { approveBooking, checkInBooking, checkOutBooking, markNoShowBooking, rejectBooking } from "@/app/actions/booking";

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
type PaymentStatus = "pending" | "verified" | "rejected";

export interface AdminBookingRow {
  id: string;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  source: string;
  total_amount: number | string;
  net_amount: number | string;
  special_requests: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  created_at: string;
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
  payments: Array<{
    id: string;
    amount: number | string;
    status: PaymentStatus;
    method: string;
    slip_image_url: string | null;
  }> | null;
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

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentStatus(booking: AdminBookingRow): PaymentStatus {
  return booking.payments?.[0]?.status || "pending";
}

function getConfirmationNote(status: BookingStatus): string {
  if (status === "pending") return "รอตรวจสลิปและยืนยันการจอง";
  if (status === "confirmed") return "ยืนยันแล้ว พร้อมเช็คอิน";
  if (status === "checked_in") return "ลูกค้าเข้าพักอยู่";
  if (status === "checked_out") return "ลูกค้าเช็คเอาท์แล้ว";
  if (status === "no_show") return "บันทึกว่าไม่เข้าพัก";
  return "การจองถูกยกเลิก";
}

function getPaymentNote(status: PaymentStatus, hasSlip: boolean): string {
  if (status === "verified") return "ตรวจสอบการชำระเงินแล้ว";
  if (status === "rejected") return "สลิปหรือการชำระเงินถูกปฏิเสธ";
  return hasSlip ? "มีสลิป รอตรวจสอบ" : "ยังไม่มีสลิป";
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

function BookingActions({ booking }: { booking: AdminBookingRow }) {
  const canCheckIn = booking.status === "confirmed";
  const canCheckOut = booking.status === "checked_in";
  const canMarkNoShow = booking.status === "confirmed" || booking.status === "checked_in";
  const confirmCheckIn = `ยืนยันเช็คอินรายการ ${booking.booking_number}?`;
  const confirmCheckOut = `ยืนยันเช็คเอาท์รายการ ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`;
  const confirmNoShow = `ยืนยันว่าลูกค้าไม่เข้าพักสำหรับรายการ ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2 min-w-full lg:min-w-[180px]">
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

function StatusInfoPanel({ booking }: { booking: AdminBookingRow }) {
  const paymentStatus = getPaymentStatus(booking);
  const hasSlip = Boolean(booking.payments?.[0]?.slip_image_url);

  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-[#e8e2d6] bg-[#faf7f0] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1a3c2a]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a84c]" />
            การยืนยัน
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_STYLES[booking.status]}`}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#8b7355]">{getConfirmationNote(booking.status)}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#8b7355]">
          <span>ยืนยัน: {formatDateTime(booking.confirmed_at)}</span>
          <span>เช็คอิน: {formatDateTime(booking.checked_in_at)}</span>
          <span>เช็คเอาท์: {formatDateTime(booking.checked_out_at)}</span>
          <span>ยกเลิก/ไม่เข้า: {formatDateTime(booking.cancelled_at)}</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8e2d6] bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1a3c2a]">
            <CreditCard className="w-3.5 h-3.5 text-[#c9a84c]" />
            การชำระเงิน
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${PAYMENT_STYLES[paymentStatus]}`}>
            {PAYMENT_LABELS[paymentStatus]}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#8b7355]">{getPaymentNote(paymentStatus, hasSlip)}</p>
      </div>
    </div>
  );
}

interface AdminBookingsClientProps {
  bookings: AdminBookingRow[];
  initialQuery: string;
  initialStatus: string;
}

export function AdminBookingsClient({ bookings, initialQuery, initialStatus }: AdminBookingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [status, setStatus] = useState(initialStatus ?? "");

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
    { label: "การจองทั้งหมด", value: stats.total, icon: CalendarDays, bg: "bg-[#1a3c2a]/5", iconBg: "bg-[#1a3c2a]/10", color: "text-[#1a3c2a]" },
    { label: "รอตรวจสอบ", value: stats.pending, icon: Clock, bg: "bg-amber-50", iconBg: "bg-amber-100", color: "text-amber-600" },
    { label: "ยืนยันแล้ว", value: stats.confirmed, icon: CheckCircle2, bg: "bg-emerald-50", iconBg: "bg-emerald-100", color: "text-emerald-600" },
    { label: "ชำระแล้ว", value: stats.paid, icon: CreditCard, bg: "bg-sky-50", iconBg: "bg-sky-100", color: "text-sky-600" },
  ];

  const hasFilter = Boolean(query.trim() || status);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-white/60`}>
              <div className="flex items-center gap-3">
                <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3c2a]">{card.value}</p>
                  <p className="text-xs text-[#8b7355] font-medium">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const paymentStatus = getPaymentStatus(booking);
            return (
              <div key={booking.id} className="bg-white rounded-xl border border-[#e8e2d6] p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#1a3c2a]">{booking.booking_number}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_STYLES[booking.status]}`}>
                        {STATUS_LABELS[booking.status]}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${PAYMENT_STYLES[paymentStatus]}`}>
                        {PAYMENT_LABELS[paymentStatus]}
                      </span>
                    </div>

                    <StatusInfoPanel booking={booking} />

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-[#8b7355]">ลูกค้า</p>
                        <p className="text-[#2c2c2c] font-medium flex items-center gap-1">
                          <UserRound className="w-3.5 h-3.5 text-[#8b7355]" />
                          {booking.customers?.full_name || "-"}
                        </p>
                        <p className="text-xs text-[#8b7355]">{booking.customers?.phone || booking.customers?.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b7355]">ห้องพัก</p>
                        <p className="text-[#2c2c2c] font-medium">{booking.rooms?.room_types?.name || "-"}</p>
                        <p className="text-xs text-[#8b7355]">ห้อง {booking.rooms?.room_number || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b7355]">วันที่เข้าพัก</p>
                        <p className="text-[#2c2c2c] font-medium">{formatDate(booking.check_in_date)}</p>
                        <p className="text-xs text-[#8b7355]">ถึง {formatDate(booking.check_out_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b7355]">ยอดสุทธิ</p>
                        <p className="text-[#1a3c2a] font-bold">THB {formatPrice(booking.net_amount)}</p>
                        <p className="text-xs text-[#8b7355]">{booking.num_guests} ผู้เข้าพัก · {booking.source}</p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mt-3 bg-[#faf7f0] rounded-lg px-3 py-2 text-xs text-[#8b7355]">
                        หมายเหตุ: {booking.special_requests}
                      </div>
                    )}
                  </div>

                  <BookingActions booking={booking} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
