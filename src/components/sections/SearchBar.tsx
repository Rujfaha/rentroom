"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchBarLabels } from "@/types/landing.types";

interface SearchBarProps {
  labels: SearchBarLabels;
}

function getInitialDates(): { today: string; tomorrow: string } {
  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);
  return {
    today: todayDate.toISOString().split("T")[0],
    tomorrow: tomorrowDate.toISOString().split("T")[0],
  };
}

export default function SearchBar({ labels }: SearchBarProps) {
  const router = useRouter();
  const [initialDates] = useState(getInitialDates);
  const today = initialDates.today;

  const [checkIn, setCheckIn] = useState(initialDates.today);
  const [checkOut, setCheckOut] = useState(initialDates.tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSearch() {
    setIsNavigating(true);
    const params = new URLSearchParams({
      checkIn: checkIn,
      checkOut: checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push("/booking?" + params.toString());
  }

  return (
    <section id="search-bar" className="relative z-30 -mt-24 px-4 sm:-mt-16 lg:-mt-12">
      <div className="max-w-5xl mx-auto rounded-2xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-forest-dark/20 backdrop-blur-md md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-earth uppercase tracking-wider">
              {labels.checkIn}
            </label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={function (e) { setCheckIn(e.target.value); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-earth uppercase tracking-wider">
              {labels.checkOut}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={function (e) { setCheckOut(e.target.value); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-earth uppercase tracking-wider">
              {labels.adults}
            </label>
            <input
              type="number"
              min="1"
              value={adults}
              onChange={function (e) { setAdults(Number(e.target.value) || 1); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-earth uppercase tracking-wider">
              {labels.children}
            </label>
            <input
              type="number"
              min="0"
              value={children}
              onChange={function (e) { setChildren(Math.max(0, Number(e.target.value) || 0)); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isNavigating}
            className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white font-semibold py-3 px-6 rounded-lg hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 tracking-wide cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            {isNavigating && (
              <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
            )}
            <span>{isNavigating ? "กำลังโหลด..." : labels.button}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
