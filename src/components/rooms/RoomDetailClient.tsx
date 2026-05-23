"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GalleryModal from "@/components/ui/GalleryModal";
import type { RoomTypeDisplay } from "@/types/landing.types";
import { readTripState } from "@/components/booking/useTripContext";

interface RoomDetailClientProps {
  room: RoomTypeDisplay;
  hotelName: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

function getInitialDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    today: today.toISOString().split("T")[0],
    tomorrow: tomorrow.toISOString().split("T")[0],
  };
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function nextIsoDate(value: string): string {
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return getInitialDates().tomorrow;
  date.setDate(date.getDate() + 1);
  return toIsoDate(date);
}

function isValidIsoDate(value: string | null): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

const amenityIconPaths: Record<string, React.ReactNode> = {
  wifi: <><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
  tv: <><rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  bath: <><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" y1="5" x2="8" y2="7"/><line x1="2" y1="12" x2="22" y2="12"/></>,
  coffee: <><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></>,
  ac: <><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m4.93 19.07 14.14-14.14"/></>,
  balcony: <><path d="M3 22h18"/><path d="M5 22V8h14v14"/><path d="M9 22v-6h6v6"/></>,
  jacuzzi: <><path d="M5 13h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z"/><path d="M7 13V7a3 3 0 0 1 6 0"/></>,
  minibar: <><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/></>,
};

function AmenityIcon({ icon }: { icon: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold flex-shrink-0">
      {amenityIconPaths[icon] ?? <circle cx="12" cy="12" r="10"/>}
    </svg>
  );
}

function GuestCounter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-earth">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border border-stone flex items-center justify-center text-earth hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>
        </button>
        <span className="w-6 text-center font-semibold text-forest-dark text-sm">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-full border border-stone flex items-center justify-center text-earth hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function RoomDetailClient({ room, hotelName }: RoomDetailClientProps) {
  const router = useRouter();
  const dates = getInitialDates();

  // Trip state เป็นเจ้าของโดย booking page — เราอ่านจาก sessionStorage เท่านั้น
  // ไม่ต้องอ่านจาก URL query (booking ไม่ส่งวัน/จำนวนคนผ่าน URL)
  // และตอนกด "จองห้องพักนี้" เราก็ไม่ส่งกลับ — เก็บลง sessionStorage แทน

  const [hydrated, setHydrated] = useState(false);
  const [checkIn, setCheckIn] = useState(dates.today);
  const [checkOut, setCheckOut] = useState(dates.tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  // hydrate จาก sessionStorage ครั้งเดียวตอน mount (กัน hydration mismatch)
  useEffect(function () {
    const trip = readTripState();
    if (trip) {
      const maxAllowed = (room.maxGuests || 2) + (room.maxExtraBeds || 0);
      if (isValidIsoDate(trip.checkIn)) window.setTimeout(function () { setCheckIn(trip.checkIn); }, 0);
      if (isValidIsoDate(trip.checkOut)) window.setTimeout(function () { setCheckOut(trip.checkOut); }, 0);
      if (Number.isFinite(trip.adults) && trip.adults >= 1) {
        window.setTimeout(function () { setAdults(Math.min(trip.adults, maxAllowed)); }, 0);
      }
      if (Number.isFinite(trip.children) && trip.children >= 0) {
        window.setTimeout(function () { setChildren(Math.min(trip.children, maxAllowed)); }, 0);
      }
    }
    window.setTimeout(function () { setHydrated(true); }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFull = room.availableRoomsCount <= 0;
  const totalGuests = adults + children;
  const maxGuestsAllowed = (room.maxGuests || 2) + (room.maxExtraBeds || 0);
  const guestsOverLimit = totalGuests > maxGuestsAllowed;

  const allImages = Array.from(
    new Set([room.coverImageUrl, ...room.galleryUrls].filter(Boolean))
  ).map((url, i) => ({ url, alt: `${room.name} รูปที่ ${i + 1}` }));

  const nights = Math.max(1, Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
  ));
  const baseRoomTotal = room.basePrice * nights;
  const extraGuests = Math.max(0, totalGuests - (room.maxGuests || 2));
  const extraBedPrice = room.extraBedPrice || 0;
  const extraBedCharge = extraGuests * extraBedPrice * nights;
  const perRoomPrice = baseRoomTotal + extraBedCharge;
  const totalPrice = perRoomPrice * Math.max(1, quantity);
  const maxQuantity = Math.min(5, Math.max(1, room.availableRoomsCount));

  // ถ้าจำนวนห้องว่างลดลง (real-time) clamp quantity ลงด้วย
  useEffect(() => {
    if (quantity > maxQuantity) {
      setTimeout(() => {
        setQuantity(Math.max(1, maxQuantity));
      }, 0);
    }
  }, [maxQuantity, quantity]);

  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % allImages.length), [allImages.length]);
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length), [allImages.length]);

  // keyboard nav
  useEffect(() => {
    if (galleryOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, goNext, goPrev]);

  function handleBook() {
    if (!hydrated || isFull || guestsOverLimit) return;
    setIsNavigating(true);
    // ส่งเฉพาะ addRoom + qty กลับ booking — วัน/จำนวนคนอยู่ใน sessionStorage แล้ว
    // (booking เป็นเจ้าของ trip state — rooms ไม่ส่งกลับ)
    const params = new URLSearchParams({
      addRoom: room.id,
      qty: String(Math.max(1, quantity)),
    });
    router.push("/booking?" + params.toString());
  }

  return (
    <>
      {/* ── HERO GALLERY (slide style) ─────────────────────── */}
      <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-stone-light h-[280px] sm:h-[420px] lg:h-[560px] group">
        {allImages.map((img, i) => (
          <div
            key={img.url}
            className={"absolute inset-0 transition-opacity duration-500 cursor-pointer " + (i === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none")}
            onClick={() => { setGalleryIndex(activeIndex); setGalleryOpen(true); }}
          >
            <Image src={img.url} alt={img.alt} fill className="object-cover" priority={i === 0} sizes="100vw" />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Prev/Next buttons */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-forest-dark hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-forest-dark hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </>
        )}

        {/* Image counter */}
        <button
          onClick={() => { setGalleryIndex(activeIndex); setGalleryOpen(true); }}
          className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-md text-white text-xs font-semibold px-3.5 py-2 rounded-full flex items-center gap-2 hover:bg-black/70 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>
          </svg>
          {activeIndex + 1} / {allImages.length}
        </button>
      </div>

      {/* ── THUMBNAIL STRIP ─────────────────────────────────── */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          {allImages.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActiveIndex(i)}
              className={"relative flex-shrink-0 w-20 h-16 sm:w-28 sm:h-20 lg:w-32 lg:h-24 rounded-lg overflow-hidden transition-all cursor-pointer " + (i === activeIndex ? "ring-2 ring-gold ring-offset-2" : "opacity-60 hover:opacity-100")}
              aria-label={"แสดงรูปที่ " + (i + 1)}
            >
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="128px" />
            </button>
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <div className="mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-12 items-start">

        {/* ── LEFT: Room Info ── */}
        <div className="space-y-8 min-w-0">
          {/* Title + status */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-serif)] text-3xl lg:text-4xl font-semibold text-forest-dark leading-tight">{room.name}</h1>
              <p className="mt-1.5 text-sm text-earth">{hotelName}</p>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${isFull ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
              <span className={`w-2 h-2 rounded-full ${isFull ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
              {isFull ? "ห้องพักเต็ม" : `ว่าง ${room.availableRoomsCount} ห้อง`}
            </span>
          </div>

          {/* Quick specs row */}
          <div className="flex flex-wrap gap-6 py-5 border-y border-stone/40">
            {[
              { icon: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18"/></>, label: `${room.roomSize} ตร.ม.` },
              { icon: <><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 16h20"/></>, label: room.bedType },
              { icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>, label: `สูงสุด ${room.maxGuests} คน${room.maxExtraBeds ? ` (เสริมเตียงได้ ${room.maxExtraBeds} คน)` : ""}` },
            ].map((spec, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-earth">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold flex-shrink-0">{spec.icon}</svg>
                <span className="font-medium text-forest-dark">{spec.label}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-forest-dark mb-3">รายละเอียดห้องพัก</h2>
            <p className="text-earth leading-relaxed whitespace-pre-line break-words text-[15px]">
              {room.description || room.shortDescription}
            </p>
          </div>

          {/* Amenities */}
          {room.amenities.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-forest-dark mb-4">สิ่งอำนวยความสะดวก</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {room.amenities.map((amenity) => (
                  <div key={amenity.label} className="flex items-center gap-2.5 bg-cream/70 border border-stone/30 rounded-xl px-3.5 py-2.5 hover:border-gold/40 transition-colors">
                    <AmenityIcon icon={amenity.icon} />
                    <span className="text-sm text-earth font-medium">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile booking widget */}
          <div className="lg:hidden">
            <BookingWidget
              room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children}
              nights={nights} totalPrice={totalPrice} perRoomPrice={perRoomPrice}
              quantity={quantity} maxQuantity={maxQuantity}
              isFull={isFull} guestsOverLimit={guestsOverLimit}
              isNavigating={isNavigating} dates={dates}
              onCheckInChange={(v) => { setCheckIn(v); if (v >= checkOut) setCheckOut(nextIsoDate(v)); }}
              onCheckOutChange={setCheckOut} onAdultsChange={setAdults} onChildrenChange={setChildren}
              onQuantityChange={setQuantity} onBook={handleBook}
            />
          </div>
        </div>

        {/* ── RIGHT: Booking Widget (desktop sticky) ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BookingWidget
              room={room} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children}
              nights={nights} totalPrice={totalPrice} perRoomPrice={perRoomPrice}
              quantity={quantity} maxQuantity={maxQuantity}
              isFull={isFull} guestsOverLimit={guestsOverLimit}
              isNavigating={isNavigating} dates={dates}
              onCheckInChange={(v) => { setCheckIn(v); if (v >= checkOut) setCheckOut(nextIsoDate(v)); }}
              onCheckOutChange={setCheckOut} onAdultsChange={setAdults} onChildrenChange={setChildren}
              onQuantityChange={setQuantity} onBook={handleBook}
            />
          </div>
        </aside>
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <GalleryModal images={allImages} initialIndex={galleryIndex} roomName={room.name} onClose={() => setGalleryOpen(false)} />
      )}
    </>
  );
}

/* ── Booking Widget ─────────────────────────────────────── */

interface BookingWidgetProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
  nights: number;
  totalPrice: number;
  perRoomPrice: number;
  quantity: number;
  maxQuantity: number;
  isFull: boolean;
  guestsOverLimit: boolean;
  isNavigating: boolean;
  dates: { today: string; tomorrow: string };
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  onQuantityChange: (v: number) => void;
  onBook: () => void;
}

function BookingWidget({ room, checkIn, checkOut, adults, childrenCount, nights, totalPrice, perRoomPrice, quantity, maxQuantity, isFull, guestsOverLimit, isNavigating, dates, onCheckInChange, onCheckOutChange, onAdultsChange, onChildrenChange, onQuantityChange, onBook }: BookingWidgetProps) {
  const totalGuests = adults + childrenCount;
  return (
    <div className="rounded-2xl border border-stone/40 bg-white shadow-xl shadow-forest-dark/8 overflow-hidden">
      <div className="bg-forest-dark px-6 py-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">฿{formatPrice(room.basePrice)}</span>
              <span className="text-stone-light text-sm">/คืน</span>
            </div>
            {nights > 1 && <p className="mt-0.5 text-xs text-stone-light/80">{nights} คืน รวม ฿{formatPrice(totalPrice)}</p>}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isFull ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
            {isFull ? "เต็ม" : `ว่าง ${room.availableRoomsCount}`}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-stone/50 overflow-hidden">
          <div className="px-3 py-2.5 border-r border-stone/50">
            <label className="block text-[10px] font-bold text-earth uppercase tracking-wider mb-1">Check-in</label>
            <input type="date" value={checkIn} min={dates.today} onChange={(e) => onCheckInChange(e.target.value)}
              className="w-full text-sm font-medium text-forest-dark bg-transparent focus:outline-none cursor-pointer" />
          </div>
          <div className="px-3 py-2.5">
            <label className="block text-[10px] font-bold text-earth uppercase tracking-wider mb-1">Check-out</label>
            <input type="date" value={checkOut} min={nextIsoDate(checkIn)} onChange={(e) => onCheckOutChange(e.target.value)}
              className="w-full text-sm font-medium text-forest-dark bg-transparent focus:outline-none cursor-pointer" />
          </div>
        </div>

        <div className="rounded-xl border border-stone/50 px-4 divide-y divide-stone/30">
          <GuestCounter label="ผู้ใหญ่" value={adults} min={1} max={(room.maxGuests || 2) + (room.maxExtraBeds || 0)} onChange={onAdultsChange} />
          <GuestCounter label="เด็ก" value={childrenCount} min={0} max={Math.max(0, (room.maxGuests || 2) + (room.maxExtraBeds || 0) - adults)} onChange={onChildrenChange} />
        </div>

        {/* จำนวนห้อง — multi-room ภายใน room type เดียวกัน */}
        <div className="rounded-xl border border-stone/50 px-4">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-sm text-earth font-medium">จำนวนห้อง</span>
              {!isFull && (
                <p className="text-[11px] text-earth-light mt-0.5">
                  ว่างทั้งหมด {room.availableRoomsCount} ห้อง
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                disabled={isFull || quantity <= 1}
                className="w-8 h-8 rounded-full border border-stone flex items-center justify-center text-earth hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="ลดจำนวนห้อง"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>
              </button>
              <span className="w-6 text-center font-semibold text-forest-dark text-sm">{Math.max(1, quantity)}</span>
              <button
                type="button"
                onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
                disabled={isFull || quantity >= maxQuantity}
                className="w-8 h-8 rounded-full border border-stone flex items-center justify-center text-earth hover:border-gold hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="เพิ่มจำนวนห้อง"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            </div>
          </div>
        </div>

        {guestsOverLimit && (
          <p className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            ห้องนี้รองรับสูงสุด {(room.maxGuests || 2) + (room.maxExtraBeds || 0)} คน (รวมเตียงเสริม)
          </p>
        )}

        {!isFull && !guestsOverLimit && (
          <div className="bg-cream/60 rounded-xl px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-earth">
              <span>฿{formatPrice(room.basePrice)} × {nights} คืน</span>
              <span>฿{formatPrice(room.basePrice * nights)}</span>
            </div>
            {totalGuests > (room.maxGuests || 2) && (room.extraBedPrice || 0) > 0 && (
              <div className="flex justify-between text-earth text-xs">
                <span>เตียงเสริม ({totalGuests - (room.maxGuests || 2)} คน) × {nights} คืน</span>
                <span>฿{formatPrice((totalGuests - (room.maxGuests || 2)) * (room.extraBedPrice || 0) * nights)}</span>
              </div>
            )}
            {quantity > 1 && (
              <>
                <div className="h-px bg-stone/40" />
                <div className="flex justify-between text-earth">
                  <span>ราคาต่อห้อง</span>
                  <span>฿{formatPrice(perRoomPrice)}</span>
                </div>
                <div className="flex justify-between text-earth">
                  <span>× {quantity} ห้อง</span>
                  <span>฿{formatPrice(perRoomPrice * quantity)}</span>
                </div>
              </>
            )}
            <div className="h-px bg-stone/40" />
            <div className="flex justify-between font-bold text-forest-dark">
              <span>รวมทั้งหมด</span>
              <span>฿{formatPrice(totalPrice)}</span>
            </div>
          </div>
        )}

        <button onClick={onBook} disabled={isFull || guestsOverLimit || isNavigating}
          className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white font-semibold py-3.5 rounded-xl hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-xl hover:shadow-gold/35 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm">
          {isNavigating && <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />}
          {isFull
            ? "ห้องพักเต็ม"
            : guestsOverLimit
            ? "จำนวนผู้เข้าพักเกินกำหนด"
            : isNavigating
            ? "กำลังโหลด..."
            : quantity > 1
            ? "จองห้องพัก " + String(quantity) + " ห้อง"
            : "จองห้องพักนี้"}
        </button>

        {!isFull && <p className="text-center text-xs text-earth-light">ยืนยันการจองได้ทันที — ไม่มีค่าธรรมเนียมเพิ่มเติม</p>}
      </div>
    </div>
  );
}
