"use client";

import { useState } from "react";
import Link from "next/link";
import { getHotelConfig } from "@/services/mock-data";
import { lookupPublicBooking, type PublicBookingLookup } from "@/app/actions/booking";

const hotel = getHotelConfig();

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รอตรวจสอบ", color: "text-yellow-700", bg: "bg-yellow-100" },
  confirmed: { label: "ยืนยันแล้ว", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "ยกเลิก", color: "text-red-700", bg: "bg-red-100" },
  checked_in: { label: "เช็คอินแล้ว", color: "text-blue-700", bg: "bg-blue-100" },
  checked_out: { label: "เช็คเอาท์แล้ว", color: "text-earth", bg: "bg-stone-light" },
};

const PAYMENT_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "รอตรวจสอบสลิป", color: "text-yellow-700", bg: "bg-yellow-100" },
  verified: { label: "ชำระเงินแล้ว", color: "text-green-700", bg: "bg-green-100" },
  rejected: { label: "สลิปไม่ถูกต้อง", color: "text-red-700", bg: "bg-red-100" },
};

export default function CheckBookingPage() {
  const [ref, setRef] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<PublicBookingLookup | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!ref.trim() || !email.trim()) return;
    setLoading(true);
    const result = await lookupPublicBooking({ bookingRef: ref, email });
    setBooking(result);
    setSearched(true);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  const inputClass = "w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors";

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest-dark py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-2xl font-bold text-white tracking-wider cursor-pointer">
            {hotel.name}
          </Link>
          <Link href="/" className="text-sm text-stone-light hover:text-gold transition-colors cursor-pointer">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-bold text-forest-dark text-center mb-2">
          Check Booking Status
        </h1>
        <p className="text-earth text-center mb-10">
          Enter your booking reference and email to check your reservation
        </p>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1.5">
                Booking Reference
              </label>
              <input
                type="text"
                value={ref}
                onChange={function (e) { setRef(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. VR-20260510-ABCD"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={function (e) { setEmail(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder="your@email.com"
                className={inputClass}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !ref.trim() || !email.trim()}
              className={"w-full py-3 rounded-lg font-semibold transition-all " + (loading ? "bg-stone-light text-earth" : "bg-gold text-white hover:bg-gold-dark shadow-lg shadow-gold/20 cursor-pointer")}
            >
              {loading ? "Searching..." : "Check Status"}
            </button>
          </div>
        </div>

        {searched && !booking && (
          <div className="mt-8 bg-white rounded-xl p-8 shadow-md text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-forest-dark">Booking Not Found</h3>
            <p className="mt-2 text-sm text-earth">
              No booking found with this reference and email. Please check and try again.
            </p>
          </div>
        )}

        {booking && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-earth uppercase tracking-wider">Booking Reference</p>
                <p className="text-xl font-bold text-gold tracking-wider">{booking.bookingRef}</p>
              </div>
              <div className={"px-3 py-1.5 rounded-full text-xs font-semibold " + STATUS_MAP[booking.status].bg + " " + STATUS_MAP[booking.status].color}>
                {STATUS_MAP[booking.status].label}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-forest-dark border-b border-stone-light pb-2 mb-3">Booking Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-earth">Room</span>
                    <span className="font-medium text-forest-dark">{booking.roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Check-in</span>
                    <span className="font-medium text-forest-dark">{booking.checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Check-out</span>
                    <span className="font-medium text-forest-dark">{booking.checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Duration</span>
                    <span className="font-medium text-forest-dark">{String(booking.totalNights) + " night(s)"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Guests</span>
                    <span className="font-medium text-forest-dark">{String(booking.guests) + " guest(s)"}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-forest-dark border-b border-stone-light pb-2 mb-3">Guest</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-earth">Name</span>
                    <span className="font-medium text-forest-dark">{booking.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Email</span>
                    <span className="font-medium text-forest-dark">{booking.guestEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Phone</span>
                    <span className="font-medium text-forest-dark">{booking.guestPhone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-forest-dark border-b border-stone-light pb-2 mb-3">Payment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-earth">Status</span>
                    <span className={"px-2.5 py-1 rounded-full text-xs font-semibold " + PAYMENT_MAP[booking.paymentStatus].bg + " " + PAYMENT_MAP[booking.paymentStatus].color}>
                      {PAYMENT_MAP[booking.paymentStatus].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-earth">Total</span>
                    <span className="font-bold text-forest-dark text-lg">{"THB " + formatPrice(booking.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-light">
                <p className="text-xs text-earth-light text-center">
                  {"Booked on " + new Date(booking.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-earth">
          <p>Need help? Contact us at{" "}
            <a href={"mailto:" + hotel.contactEmail} className="text-gold hover:underline cursor-pointer">
              {hotel.contactEmail}
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
