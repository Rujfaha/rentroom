"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchBarLabels } from "@/types/landing.types";

interface SearchBarProps {
  labels: SearchBarLabels;
}

export default function SearchBar({ labels }: SearchBarProps) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function handleSearch() {
    const params = new URLSearchParams({
      checkIn: checkIn,
      checkOut: checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push("/booking?" + params.toString());
  }

  return (
    <section id="search-bar" className="relative z-20 -mt-12 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl shadow-forest-dark/10 p-6 md:p-8">
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
            <select
              value={adults}
              onChange={function (e) { setAdults(Number(e.target.value)); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map(function (n) {
                return (
                  <option key={n} value={n}>
                    {String(n) + (n === 1 ? " Adult" : " Adults")}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-earth uppercase tracking-wider">
              {labels.children}
            </label>
            <select
              value={children}
              onChange={function (e) { setChildren(Number(e.target.value)); }}
              className="w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
            >
              {[0, 1, 2, 3, 4].map(function (n) {
                return (
                  <option key={n} value={n}>
                    {String(n) + (n === 1 ? " Child" : " Children")}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="w-full bg-gold text-white font-semibold py-3 px-6 rounded-lg hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 tracking-wide cursor-pointer"
          >
            {labels.button}
          </button>
        </div>
      </div>
    </section>
  );
}
