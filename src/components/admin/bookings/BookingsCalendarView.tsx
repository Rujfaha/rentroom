"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Plus, RotateCcw, Calendar as CalendarIcon, BedDouble } from "lucide-react";
import type {
  AdminBookingRow,
  AdminCalendarRoom,
  BookingStatus,
} from "./AdminBookingsClient";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  checked_in: "เช็คอินแล้ว",
  checked_out: "เช็คเอาท์แล้ว",
  cancelled: "ยกเลิก",
  no_show: "ไม่เข้าพัก",
};

const STATUS_BLOCK_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  checked_in: "bg-sky-100 text-sky-800 border-sky-300",
  checked_out: "bg-slate-200 text-slate-700 border-slate-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
  no_show: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

const STATUS_FILTER_OPTIONS: Array<{ value: "" | BookingStatus; label: string }> = [
  { value: "", label: "สถานะทั้งหมด" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "confirmed", label: STATUS_LABELS.confirmed },
  { value: "checked_in", label: STATUS_LABELS.checked_in },
  { value: "checked_out", label: STATUS_LABELS.checked_out },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
  { value: "no_show", label: STATUS_LABELS.no_show },
];

const RANGE_OPTIONS: Array<{ value: 7 | 14 | 30; label: string }> = [
  { value: 7, label: "7 วัน" },
  { value: 14, label: "14 วัน" },
  { value: 30, label: "30 วัน" },
];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildDateRange(start: Date, days: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < days; i += 1) {
    dates.push(addDays(start, i));
  }
  return dates;
}

interface BookingsCalendarViewProps {
  bookings: AdminBookingRow[];
  rooms: AdminCalendarRoom[];
  onSelectBooking: (booking: AdminBookingRow) => void;
  onSelectEmptyCell?: (input: { roomId: string; date: string }) => void;
}

interface RoomBookingSpan {
  booking: AdminBookingRow;
  startIndex: number;
  endIndex: number;
  span: number;
}

export function BookingsCalendarView({
  bookings,
  rooms,
  onSelectBooking,
  onSelectEmptyCell,
}: BookingsCalendarViewProps) {
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [startDate, setStartDate] = useState<Date>(() => startOfToday());
  const [statusFilter, setStatusFilter] = useState<"" | BookingStatus>("");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("");

  const dateList = useMemo(() => buildDateRange(startDate, rangeDays), [startDate, rangeDays]);
  const dateIsoList = useMemo(() => dateList.map(toIsoDate), [dateList]);
  const rangeStartIso = dateIsoList[0];
  const rangeEndIso = dateIsoList[dateIsoList.length - 1];

  const roomTypeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const room of rooms) {
      const id = room.room_types?.id;
      const name = room.room_types?.name;
      if (id && name && !map.has(id)) {
        map.set(id, name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!roomTypeFilter) return rooms;
    return rooms.filter((room) => room.room_types?.id === roomTypeFilter);
  }, [rooms, roomTypeFilter]);

  const bookingsByRoom = useMemo(() => {
    const grouped = new Map<string, RoomBookingSpan[]>();
    if (!rangeStartIso || !rangeEndIso) return grouped;

    for (const booking of bookings) {
      if (!booking.room_id) continue;
      if (statusFilter && booking.status !== statusFilter) continue;

      const checkIn = booking.check_in_date;
      // checkOut is exclusive in hotel domain — last booked night = checkOut - 1
      const lastNightDate = addDays(new Date(booking.check_out_date), -1);
      const lastNightIso = toIsoDate(lastNightDate);

      // Skip bookings completely outside the visible window
      if (lastNightIso < rangeStartIso) continue;
      if (checkIn > rangeEndIso) continue;

      const visibleStartIso = checkIn < rangeStartIso ? rangeStartIso : checkIn;
      const visibleEndIso = lastNightIso > rangeEndIso ? rangeEndIso : lastNightIso;

      const startIndex = dateIsoList.indexOf(visibleStartIso);
      const endIndex = dateIsoList.indexOf(visibleEndIso);
      if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) continue;

      const span: RoomBookingSpan = {
        booking,
        startIndex,
        endIndex,
        span: endIndex - startIndex + 1,
      };

      const existing = grouped.get(booking.room_id);
      if (existing) {
        existing.push(span);
      } else {
        grouped.set(booking.room_id, [span]);
      }
    }

    for (const list of grouped.values()) {
      list.sort((a, b) => a.startIndex - b.startIndex);
    }
    return grouped;
  }, [bookings, dateIsoList, rangeEndIso, rangeStartIso, statusFilter]);

  const todayIso = toIsoDate(startOfToday());

  const handleShiftRange = (delta: number) => {
    setStartDate((prev) => addDays(prev, delta));
  };

  const handleResetToday = () => {
    setStartDate(startOfToday());
  };

  const handleStartDateChange = (value: string) => {
    if (!value) return;
    const next = new Date(`${value}T00:00:00`);
    if (Number.isNaN(next.getTime())) return;
    next.setHours(0, 0, 0, 0);
    setStartDate(next);
  };

  const handleEmptyCellClick = (roomId: string, dateIso: string) => {
    if (onSelectEmptyCell) onSelectEmptyCell({ roomId, date: dateIso });
  };

  const hasFilter = Boolean(statusFilter || roomTypeFilter);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-[#e8e2d6] p-3 md:p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Date navigation - desktop only (mobile day view has its own strip) */}
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-[#e8e2d6] overflow-hidden bg-[#faf7f0]">
              <button
                type="button"
                onClick={() => handleShiftRange(-rangeDays)}
                className="px-3 py-2 text-[#1a3c2a] hover:bg-white transition-colors cursor-pointer"
                aria-label="ย้อนกลับ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={toIsoDate(startDate)}
                onChange={(event) => handleStartDateChange(event.currentTarget.value)}
                className="bg-transparent px-2 py-2 text-sm text-[#2c2c2c] outline-none border-x border-[#e8e2d6] tabular-nums"
              />
              <button
                type="button"
                onClick={() => handleShiftRange(rangeDays)}
                className="px-3 py-2 text-[#1a3c2a] hover:bg-white transition-colors cursor-pointer"
                aria-label="ถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleResetToday}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#e8e2d6] text-[#1a3c2a] rounded-xl hover:bg-[#faf7f0] transition-colors text-sm font-medium cursor-pointer"
            >
              วันนี้
            </button>
          </div>

          {/* Range + filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Range options - hidden on mobile (mobile uses day view) */}
            <div className="hidden lg:inline-flex rounded-xl border border-[#e8e2d6] bg-[#faf7f0] p-0.5">
              {RANGE_OPTIONS.map((option) => {
                const active = rangeDays === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRangeDays(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-[#1a3c2a] text-[#faf7f0]"
                        : "text-[#8b7355] hover:text-[#1a3c2a]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 text-[#8b7355] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={roomTypeFilter}
                onChange={(event) => setRoomTypeFilter(event.currentTarget.value)}
                className="pl-9 pr-8 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-xl text-sm text-[#2c2c2c] focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer appearance-none"
              >
                <option value="">ประเภทห้องทั้งหมด</option>
                {roomTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 text-[#8b7355] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.currentTarget.value as "" | BookingStatus)}
                className="pl-9 pr-8 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-xl text-sm text-[#2c2c2c] focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer appearance-none"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setRoomTypeFilter("");
              }}
              disabled={!hasFilter}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#e8e2d6] text-[#8b7355] rounded-xl hover:bg-[#faf7f0] hover:text-[#1a3c2a] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {(Object.keys(STATUS_LABELS) as BookingStatus[]).map((status) => (
            <span
              key={status}
              className={`inline-flex items-center px-2 py-0.5 rounded border ${STATUS_BLOCK_STYLES[status]}`}
            >
              {STATUS_LABELS[status]}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid (desktop) / day view (mobile) */}
      {filteredRooms.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl bg-white">
          <p className="text-[#8b7355] font-medium">ไม่พบห้องพักตรงตามตัวกรอง</p>
          <p className="text-sm text-[#a89279] mt-1">ลองเปลี่ยนประเภทห้อง หรือสร้างห้องในเมนูห้องพัก</p>
        </div>
      ) : (
        <>
          {/* Mobile day-view */}
          <MobileDayView
            rooms={filteredRooms}
            bookings={bookings}
            statusFilter={statusFilter}
            initialDate={startDate}
            onSelectBooking={onSelectBooking}
            onSelectEmptyCell={handleEmptyCellClick}
          />

          {/* Desktop grid view */}
          <div className="hidden lg:block bg-white rounded-2xl border border-[#e8e2d6] shadow-sm overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Header row */}
            <div
              className="grid bg-[#faf7f0] border-b border-[#e8e2d6] sticky top-0 z-10"
              style={{ gridTemplateColumns: `160px repeat(${dateIsoList.length}, minmax(56px, 1fr))` }}
            >
              <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#8b7355] font-semibold border-r border-[#e8e2d6]">
                ห้อง / วันที่
              </div>
              {dateList.map((date, index) => {
                const iso = dateIsoList[index];
                const isToday = iso === todayIso;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5;
                const dayLabel = date.toLocaleDateString("th-TH", { weekday: "short" });
                return (
                  <div
                    key={iso}
                    className={`px-1 py-2 text-center border-r border-[#e8e2d6] last:border-r-0 ${
                      isWeekend ? "bg-[#f5efde]" : ""
                    } ${isToday ? "bg-[#c9a84c]/10" : ""}`}
                  >
                    <div className="text-[10px] uppercase text-[#8b7355]">{dayLabel}</div>
                    <div className={`text-sm font-semibold ${isToday ? "text-[#c9a84c]" : "text-[#1a3c2a]"}`}>
                      {date.getDate()}
                    </div>
                    <div className="text-[10px] text-[#8b7355]">
                      {date.toLocaleDateString("th-TH", { month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Room rows */}
            <div>
              {filteredRooms.map((room) => {
                const spans = bookingsByRoom.get(room.id) ?? [];
                return (
                  <div
                    key={room.id}
                    className="grid border-b border-[#e8e2d6] last:border-b-0 hover:bg-[#fbfaf5]/40"
                    style={{ gridTemplateColumns: `160px repeat(${dateIsoList.length}, minmax(56px, 1fr))` }}
                  >
                    {/* Row label */}
                    <div className="px-3 py-3 border-r border-[#e8e2d6] flex flex-col justify-center sticky left-0 bg-white">
                      <p className="text-sm font-semibold text-[#1a3c2a]">ห้อง {room.room_number}</p>
                      <p className="text-[11px] text-[#8b7355] truncate">
                        {room.room_types?.name || "ไม่ระบุประเภท"}
                      </p>
                    </div>

                    {/* Cells with overlay bookings */}
                    <div
                      className="relative grid"
                      style={{
                        gridColumn: `2 / ${dateIsoList.length + 2}`,
                        gridTemplateColumns: `repeat(${dateIsoList.length}, minmax(56px, 1fr))`,
                      }}
                    >
                      {dateIsoList.map((iso) => {
                        const isToday = iso === todayIso;
                        const date = new Date(`${iso}T00:00:00`);
                        const isWeekend =
                          date.getDay() === 0 || date.getDay() === 6 || date.getDay() === 5;
                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => handleEmptyCellClick(room.id, iso)}
                            title={`สร้างการจองสำหรับห้อง ${room.room_number} วันที่ ${iso}`}
                            className={`relative h-14 border-r border-[#e8e2d6] last:border-r-0 group cursor-pointer transition-colors ${
                              isWeekend ? "bg-[#f5efde]/40" : "bg-white"
                            } ${isToday ? "bg-[#c9a84c]/5" : ""} hover:bg-[#1a3c2a]/5`}
                          >
                            <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-4 h-4 text-[#1a3c2a]" />
                            </span>
                          </button>
                        );
                      })}

                      {/* Booking blocks overlay */}
                      <div className="pointer-events-none absolute inset-0">
                        {spans.map(({ booking, startIndex, span }) => {
                          const leftPercent = (startIndex / dateIsoList.length) * 100;
                          const widthPercent = (span / dateIsoList.length) * 100;
                          const customerName = booking.customers?.full_name || "ไม่ระบุชื่อ";
                          return (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onSelectBooking(booking);
                              }}
                              className={`pointer-events-auto absolute top-1.5 bottom-1.5 rounded-md border text-[11px] font-medium px-2 flex items-center gap-1 truncate shadow-sm hover:shadow-md transition-shadow cursor-pointer ${STATUS_BLOCK_STYLES[booking.status]}`}
                              style={{
                                left: `calc(${leftPercent}% + 2px)`,
                                width: `calc(${widthPercent}% - 4px)`,
                              }}
                              title={`${booking.booking_number} · ${customerName} · ${STATUS_LABELS[booking.status]}`}
                            >
                              <span className="truncate">
                                {booking.booking_number} · {customerName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </>
      )}
    </div>
  );
}

interface MobileDayViewProps {
  rooms: AdminCalendarRoom[];
  bookings: AdminBookingRow[];
  statusFilter: "" | BookingStatus;
  initialDate: Date;
  onSelectBooking: (booking: AdminBookingRow) => void;
  onSelectEmptyCell: (roomId: string, dateIso: string) => void;
}

function MobileDayView({
  rooms,
  bookings,
  statusFilter,
  initialDate,
  onSelectBooking,
  onSelectEmptyCell,
}: MobileDayViewProps) {
  const [activeDate, setActiveDate] = useState<Date>(() => {
    const next = new Date(initialDate);
    next.setHours(0, 0, 0, 0);
    return next;
  });

  // Build a 7-day strip centered on activeDate (3 before, 3 after)
  const dayStrip = useMemo(() => {
    const result: Date[] = [];
    for (let i = -3; i <= 3; i += 1) {
      result.push(addDays(activeDate, i));
    }
    return result;
  }, [activeDate]);

  const activeIso = toIsoDate(activeDate);
  const todayIso = toIsoDate(startOfToday());

  // Compute per-room booking for the active day
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, AdminBookingRow>();
    for (const booking of bookings) {
      if (!booking.room_id) continue;
      if (statusFilter && booking.status !== statusFilter) continue;
      const checkIn = booking.check_in_date;
      const lastNightIso = toIsoDate(addDays(new Date(booking.check_out_date), -1));
      if (activeIso < checkIn || activeIso > lastNightIso) continue;
      const existing = map.get(booking.room_id);
      // Prefer more "active" status if multiple
      const priority: Record<BookingStatus, number> = {
        checked_in: 6,
        confirmed: 5,
        pending: 4,
        no_show: 3,
        checked_out: 2,
        cancelled: 1,
      };
      if (!existing || priority[booking.status] > priority[existing.status]) {
        map.set(booking.room_id, booking);
      }
    }
    return map;
  }, [bookings, statusFilter, activeIso]);

  const occupiedCount = bookingsByRoom.size;
  const availableCount = rooms.length - occupiedCount;

  const formatThaiLong = (date: Date) =>
    date.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  return (
    <div className="lg:hidden space-y-3">
      {/* Date strip */}
      <div className="bg-white rounded-2xl border border-[#e8e2d6] p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setActiveDate((prev) => addDays(prev, -7))}
            className="p-1.5 rounded-lg text-[#1a3c2a] hover:bg-[#faf7f0] cursor-pointer"
            aria-label="สัปดาห์ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8b7355] font-semibold">
              {activeIso === todayIso ? "วันนี้" : "ดูวันที่"}
            </p>
            <p className="text-sm font-serif text-[#1a3c2a] font-semibold">
              {formatThaiLong(activeDate)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveDate((prev) => addDays(prev, 7))}
            className="p-1.5 rounded-lg text-[#1a3c2a] hover:bg-[#faf7f0] cursor-pointer"
            aria-label="สัปดาห์ถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dayStrip.map((date) => {
            const iso = toIsoDate(date);
            const isActive = iso === activeIso;
            const isToday = iso === todayIso;
            const dayLabel = date.toLocaleDateString("th-TH", { weekday: "narrow" });
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setActiveDate(date)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors active:scale-[0.96] ${
                  isActive
                    ? "bg-[#1a3c2a] text-[#faf7f0]"
                    : isToday
                      ? "bg-[#c9a84c]/15 text-[#1a3c2a]"
                      : "hover:bg-[#faf7f0] text-[#5c4a35]"
                }`}
              >
                <span
                  className={`text-[10px] font-medium uppercase ${
                    isActive ? "text-[#faf7f0]/80" : "text-[#8b7355]"
                  }`}
                >
                  {dayLabel}
                </span>
                <span className="text-base font-serif font-semibold tabular-nums leading-tight mt-0.5">
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick jump to today */}
        {activeIso !== todayIso && (
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setActiveDate(startOfToday())}
              className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1a3c2a] hover:text-[#c9a84c] transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-3 h-3" />
              ไปวันนี้
            </button>
          </div>
        )}
      </div>

      {/* Day summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">ว่าง</p>
          <p className="text-xl font-serif font-bold text-emerald-900 mt-0.5 tabular-nums">
            {availableCount}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">เข้าพัก</p>
          <p className="text-xl font-serif font-bold text-amber-900 mt-0.5 tabular-nums">
            {occupiedCount}
          </p>
        </div>
        <div className="rounded-xl bg-stone-100 border border-stone-400 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-stone-700 font-semibold">รวม</p>
          <p className="text-xl font-serif font-bold text-stone-800 mt-0.5 tabular-nums">
            {rooms.length}
          </p>
        </div>
      </div>

      {/* Room list for the day */}
      <ul className="space-y-2">
        {rooms.map((room) => {
          const booking = bookingsByRoom.get(room.id);
          const customerName = booking?.customers?.full_name;
          const statusClass = booking ? STATUS_BLOCK_STYLES[booking.status] : "";

          return (
            <li
              key={room.id}
              className="bg-white rounded-2xl border border-[#e8e2d6] shadow-[0_1px_2px_rgba(15,31,23,0.04)] overflow-hidden"
            >
              {booking ? (
                <button
                  type="button"
                  onClick={() => onSelectBooking(booking)}
                  className="w-full text-left p-3 hover:bg-[#faf7f0]/60 transition-colors active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#1a3c2a]/10 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-5 h-5 text-[#1a3c2a]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#1a3c2a] text-sm">
                          ห้อง {room.room_number}
                        </p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${statusClass}`}
                        >
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b7355] truncate mt-0.5">
                        {room.room_types?.name || "ไม่ระบุประเภท"}
                      </p>
                      <p className="text-xs text-[#5c4a35] truncate mt-1">
                        {customerName || "ไม่ระบุชื่อ"}
                        <span className="mx-1.5 text-[#c4b9a8]">·</span>
                        <span className="font-mono">{booking.booking_number}</span>
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectEmptyCell(room.id, activeIso)}
                  className="w-full text-left p-3 hover:bg-[#1a3c2a]/[0.03] transition-colors active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                      <BedDouble className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#1a3c2a] text-sm">
                          ห้อง {room.room_number}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                          ว่าง
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b7355] truncate mt-0.5">
                        {room.room_types?.name || "ไม่ระบุประเภท"}
                      </p>
                      <p className="text-xs text-[#1a3c2a] mt-1 inline-flex items-center gap-1 font-medium">
                        <Plus className="w-3 h-3" />
                        แตะเพื่อสร้างการจอง
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
