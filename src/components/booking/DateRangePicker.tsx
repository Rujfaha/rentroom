"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onChange: (next: { checkIn: string; checkOut: string }) => void;
  locale: "th" | "en";
  totalNights: number;
}

const TH_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const EN_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TH_WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function parseIso(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value + "T00:00:00");
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDisplayDate(value: string, locale: "th" | "en"): string {
  const date = parseIso(value);
  if (!date) return "";
  const months = locale === "th" ? TH_MONTHS : EN_MONTHS;
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = locale === "th" ? date.getFullYear() + 543 : date.getFullYear();
  return day + " " + month + " " + year;
}

interface MonthGridProps {
  year: number;
  month: number;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  hoveredEnd: Date | null;
  today: Date;
  locale: "th" | "en";
  onPick: (date: Date) => void;
  onHover: (date: Date | null) => void;
}

function MonthGrid({
  year,
  month,
  selectedStart,
  selectedEnd,
  hoveredEnd,
  today,
  locale,
  onPick,
  onHover,
}: MonthGridProps) {
  const months = locale === "th" ? TH_MONTHS : EN_MONTHS;
  const weekdays = locale === "th" ? TH_WEEKDAYS : EN_WEEKDAYS;
  const yearLabel = locale === "th" ? year + 543 : year;
  const firstDayOfMonth = startOfMonth(year, month).getDay();
  const totalDays = getDaysInMonth(year, month);

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayOfMonth; i += 1) cells.push(null);
  for (let day = 1; day <= totalDays; day += 1) cells.push(new Date(year, month, day));

  const previewEnd =
    selectedStart && !selectedEnd && hoveredEnd && hoveredEnd.getTime() > selectedStart.getTime()
      ? hoveredEnd
      : null;

  return (
    <div className="flex-1">
      <div className="mb-3 text-center text-sm font-semibold text-forest-dark">
        {months[month] + " " + String(yearLabel)}
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-earth-light">
        {weekdays.map(function (label) {
          return (
            <div key={label} className="py-1">
              {label}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(function (cellDate, index) {
          if (!cellDate) {
            return <div key={"empty-" + String(index)} className="h-9 sm:h-10" />;
          }

          const cellTime = cellDate.getTime();
          const isPast = cellTime < today.getTime();
          const isToday = cellTime === today.getTime();

          const isSelectedStart =
            selectedStart !== null && cellTime === selectedStart.getTime();
          const isSelectedEnd =
            selectedEnd !== null && cellTime === selectedEnd.getTime();

          const inFinalRange =
            selectedStart !== null &&
            selectedEnd !== null &&
            cellTime > selectedStart.getTime() &&
            cellTime < selectedEnd.getTime();

          const inPreviewRange =
            selectedStart !== null &&
            previewEnd !== null &&
            cellTime > selectedStart.getTime() &&
            cellTime < previewEnd.getTime();

          const isPreviewEnd =
            selectedStart !== null && previewEnd !== null && cellTime === previewEnd.getTime();

          const inRange = inFinalRange || inPreviewRange;
          const isEndpoint = isSelectedStart || isSelectedEnd || isPreviewEnd;

          let buttonClass =
            "relative z-10 h-9 w-9 sm:h-10 sm:w-10 mx-auto flex items-center justify-center text-sm rounded-full transition-colors ";
          if (isPast) {
            buttonClass +=
              "text-stone-dark/50 cursor-not-allowed line-through decoration-stone";
          } else if (isEndpoint) {
            buttonClass +=
              "bg-gradient-to-br from-gold to-gold-dark text-white font-bold shadow-md shadow-gold/30 cursor-pointer";
          } else if (inRange) {
            buttonClass += "text-forest-dark font-semibold cursor-pointer";
          } else if (isToday) {
            buttonClass +=
              "text-forest-dark font-bold ring-2 ring-gold/40 cursor-pointer hover:bg-gold/10";
          } else {
            buttonClass += "text-charcoal hover:bg-gold/10 cursor-pointer";
          }

          let wrapperClass = "relative h-9 sm:h-10 flex items-center justify-center";
          if (inRange) {
            wrapperClass += " bg-gold/15";
            if (isSelectedStart || (selectedStart !== null && cellTime === selectedStart.getTime())) {
              wrapperClass += " rounded-l-full";
            }
            if (
              isSelectedEnd ||
              isPreviewEnd ||
              (selectedEnd !== null && cellTime === selectedEnd.getTime())
            ) {
              wrapperClass += " rounded-r-full";
            }
          }
          if (isSelectedStart && (selectedEnd !== null || previewEnd !== null)) {
            wrapperClass += " bg-gold/15 rounded-l-full";
          }
          if ((isSelectedEnd || isPreviewEnd) && selectedStart !== null) {
            wrapperClass += " bg-gold/15 rounded-r-full";
          }

          return (
            <div key={toIsoDate(cellDate)} className={wrapperClass}>
              <button
                type="button"
                disabled={isPast}
                onMouseEnter={function () {
                  if (!isPast) onHover(cellDate);
                }}
                onClick={function () {
                  if (!isPast) onPick(cellDate);
                }}
                className={buttonClass}
              >
                {cellDate.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DateRangePicker(props: DateRangePickerProps) {
  const { checkIn, checkOut, onChange, locale, totalNights } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredEnd, setHoveredEnd] = useState<Date | null>(null);
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  const today = useMemo(function () {
    return startOfDay(new Date());
  }, []);

  const initialMonth = useMemo(
    function () {
      const date = parseIso(checkIn) || new Date();
      return { year: date.getFullYear(), month: date.getMonth() };
    },
    [checkIn]
  );

  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(
    function () {
      function handleClickOutside(event: MouseEvent) {
        if (!containerRef.current) return;
        if (!containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return function () {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    },
    [isOpen]
  );

  const selectedStart = pendingStart || parseIso(checkIn);
  const selectedEnd = pendingStart ? null : parseIso(checkOut);

  function handlePick(date: Date) {
    const dayStart = startOfDay(date);

    if (!pendingStart && parseIso(checkIn) && parseIso(checkOut)) {
      // เริ่ม range ใหม่
      setPendingStart(dayStart);
      setHoveredEnd(null);
      return;
    }

    if (!pendingStart) {
      // กรณีไม่มีค่าเริ่มต้น - เลือกวัน start
      setPendingStart(dayStart);
      setHoveredEnd(null);
      return;
    }

    if (dayStart.getTime() <= pendingStart.getTime()) {
      // ถ้าเลือกวันก่อนหรือเท่ากับ start ให้ reset start
      setPendingStart(dayStart);
      return;
    }

    // confirm range
    onChange({ checkIn: toIsoDate(pendingStart), checkOut: toIsoDate(dayStart) });
    setPendingStart(null);
    setHoveredEnd(null);
    setIsOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewMonth(function (current) {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  const secondMonth = useMemo(
    function () {
      const next = new Date(viewMonth.year, viewMonth.month + 1, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    },
    [viewMonth]
  );

  const labelCheckIn = locale === "th" ? "เช็คอิน" : "Check-in";
  const labelCheckOut = locale === "th" ? "เช็คเอาท์" : "Check-out";
  const labelPickDate = locale === "th" ? "เลือกวันที่" : "Pick a date";
  const labelNights =
    locale === "th"
      ? String(totalNights) + " คืน"
      : String(totalNights) + " night" + (totalNights === 1 ? "" : "s");

  const previewCheckIn = pendingStart ? toIsoDate(pendingStart) : checkIn;
  const previewCheckOut = pendingStart ? "" : checkOut;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={function () {
          setIsOpen(function (current) {
            return !current;
          });
        }}
        className={
          "group relative w-full overflow-hidden rounded-xl border bg-white p-2.5 text-left transition-all sm:rounded-2xl sm:p-4 " +
          (isOpen
            ? "border-gold ring-4 ring-gold/15 shadow-lg"
            : "border-stone/60 hover:border-gold/60 hover:shadow-md")
        }
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 text-gold-dark sm:h-10 sm:w-10 sm:rounded-xl">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-earth sm:text-[11px]">
                {labelCheckIn}
              </div>
              <div className="truncate text-xs font-bold text-forest-dark sm:text-base">
                {previewCheckIn ? formatDisplayDate(previewCheckIn, locale) : labelPickDate}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-stone/40 pl-2 sm:gap-3 sm:pl-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-forest/15 to-forest/5 text-forest sm:h-10 sm:w-10 sm:rounded-xl">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-earth sm:text-[11px]">
                {labelCheckOut}
              </div>
              <div className="truncate text-xs font-bold text-forest-dark sm:text-base">
                {previewCheckOut
                  ? formatDisplayDate(previewCheckOut, locale)
                  : pendingStart
                  ? labelPickDate
                  : labelPickDate}
              </div>
            </div>
          </div>
        </div>

        {checkIn && checkOut && !pendingStart && (
          <div className="absolute right-3 top-3 hidden rounded-full bg-forest/10 px-2.5 py-0.5 text-[11px] font-semibold text-forest sm:block">
            {labelNights}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-40 mt-2 origin-top rounded-3xl border border-stone/50 bg-white p-4 shadow-2xl shadow-forest-dark/10 sm:left-auto sm:right-0 sm:w-[640px] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={function () {
                shiftMonth(-1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-forest-dark transition-colors hover:bg-stone-light"
              aria-label="Previous month"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <div className="text-xs font-semibold uppercase tracking-wider text-earth">
              {locale === "th" ? "เลือกช่วงวันที่" : "Pick your dates"}
            </div>

            <button
              type="button"
              onClick={function () {
                shiftMonth(1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-forest-dark transition-colors hover:bg-stone-light"
              aria-label="Next month"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div
            className="flex flex-col gap-6 sm:flex-row"
            onMouseLeave={function () {
              setHoveredEnd(null);
            }}
          >
            <MonthGrid
              year={viewMonth.year}
              month={viewMonth.month}
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              hoveredEnd={hoveredEnd}
              today={today}
              locale={locale}
              onPick={handlePick}
              onHover={setHoveredEnd}
            />
            <div className="hidden sm:block">
              <MonthGrid
                year={secondMonth.year}
                month={secondMonth.month}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                hoveredEnd={hoveredEnd}
                today={today}
                locale={locale}
                onPick={handlePick}
                onHover={setHoveredEnd}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone/30 pt-4">
            <div className="text-xs text-earth">
              {pendingStart
                ? locale === "th"
                  ? "เลือกวันเช็คเอาท์"
                  : "Select check-out date"
                : locale === "th"
                ? "คลิกวันใหม่เพื่อเริ่มเลือกใหม่"
                : "Click any date to start over"}
            </div>
            <button
              type="button"
              onClick={function () {
                setPendingStart(null);
                setHoveredEnd(null);
                setIsOpen(false);
              }}
              className="rounded-lg bg-forest-dark px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-forest"
            >
              {locale === "th" ? "ปิด" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
