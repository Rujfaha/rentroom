"use client";

import { useEffect, useRef, useState } from "react";

interface GuestSelectorProps {
  adults: number;
  childrenCount: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  locale: "th" | "en";
}

interface CounterRowProps {
  title: string;
  hint: string;
  value: number;
  min: number;
  onChange: (next: number) => void;
}

function CounterRow({ title, hint, value, min, onChange }: CounterRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-semibold text-forest-dark">{title}</div>
        <div className="text-xs text-earth">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={function () {
            onChange(Math.max(min, value - 1));
          }}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone text-forest-dark transition-all hover:border-gold hover:text-gold-dark disabled:cursor-not-allowed disabled:border-stone-light disabled:text-stone"
          aria-label="Decrease"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="w-6 text-center text-base font-bold text-forest-dark">{value}</span>
        <button
          type="button"
          onClick={function () {
            onChange(value + 1);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone text-forest-dark transition-all hover:border-gold hover:text-gold-dark"
          aria-label="Increase"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function GuestSelector(props: GuestSelectorProps) {
  const { adults, childrenCount, onAdultsChange, onChildrenChange, locale } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  const total = adults + childrenCount;
  const labelGuests = locale === "th" ? "ผู้เข้าพัก" : "Guests";
  const labelAdults = locale === "th" ? "ผู้ใหญ่" : "Adults";
  const labelChildren = locale === "th" ? "เด็ก" : "Children";
  const labelAdultsHint =
    locale === "th" ? "อายุ 13 ปีขึ้นไป" : "Ages 13 or above";
  const labelChildrenHint = locale === "th" ? "อายุ 0–12 ปี" : "Ages 0–12";
  const labelTotal =
    locale === "th"
      ? String(total) + " คน"
      : String(total) + " guest" + (total === 1 ? "" : "s");

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
          "flex w-full items-center gap-2 rounded-xl border bg-white p-2.5 text-left transition-all sm:gap-3 sm:rounded-2xl sm:p-4 " +
          (isOpen
            ? "border-gold ring-4 ring-gold/15 shadow-lg"
            : "border-stone/60 hover:border-gold/60 hover:shadow-md")
        }
      >
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-earth sm:text-[11px]">
            {labelGuests}
          </div>
          <div className="truncate text-xs font-bold text-forest-dark sm:text-base">
            {labelTotal}
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={"text-earth transition-transform " + (isOpen ? "rotate-180" : "")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-2xl border border-stone/50 bg-white p-5 shadow-2xl shadow-forest-dark/10 sm:left-auto sm:right-0 sm:w-80">
          <div className="divide-y divide-stone/30">
            <CounterRow
              title={labelAdults}
              hint={labelAdultsHint}
              value={adults}
              min={1}
              onChange={onAdultsChange}
            />
            <CounterRow
              title={labelChildren}
              hint={labelChildrenHint}
              value={childrenCount}
              min={0}
              onChange={onChildrenChange}
            />
          </div>
          <button
            type="button"
            onClick={function () {
              setIsOpen(false);
            }}
            className="mt-4 w-full rounded-xl bg-forest-dark px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest"
          >
            {locale === "th" ? "ตกลง" : "Done"}
          </button>
        </div>
      )}
    </div>
  );
}
