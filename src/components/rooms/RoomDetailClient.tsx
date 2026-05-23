"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GalleryModal from "@/components/ui/GalleryModal";
import type { RoomTypeDisplay } from "@/types/landing.types";

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

function AmenityIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, string> = {
    wifi: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
    tv: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM17 21H7",
    bath: "M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h3",
    coffee: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v2M10 2v2M14 2v2",
    ac: "M12 3v18M3 12h18",
    balcony: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    jacuzzi: "M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z",
    minibar: "M4 4h16v16H4z",
  };
  const d = iconMap[icon] || "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold flex-shrink-0">
      <path d={d} />
    </svg>
  );
}

export default function RoomDetailClient({ room, hotelName }: RoomDetailClientProps) {
  const router = useRouter();
  const dates = getInitialDates();

  const [checkIn, setCheckIn] = useState(dates.today);
  const [checkOut, setCheckOut] = useState(dates.tomorrow);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const isFull = room.availableRoomsCount <= 0;

  const allImages = Array.from(
    new Set([room.coverImageUrl, ...room.galleryUrls].filter(Boolean))
  ).map((url, i) => ({ url, alt: `${room.name} รูปที่ ${i + 1}` }));

  const totalGuests = adults + children;
  const guestsOverLimit = totalGuests > room.maxGuests;

  // calculate nights
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    )
  );
  const totalPrice = room.basePrice * nights;

  function handleBook() {
    if (isFull || guestsOverLimit) return;
    setIsNavigating(true);
    const params = new URLSearchParams({
      room: room.id,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push("/booking?" + params.toString());
  }

  function openGallery(index: number) {
    setGalleryIndex(index);
    setGalleryOpen(true);
  }

  return (
    <>
      {/* Gallery grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-2xl overflow-hidden h-[280px] sm:h-[380px] md:h-[460px]">
        {/* Main image */}
        <div
          className="col-span-2 md:col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openGallery(0)}
        >
          <Image
            src={allImages[0]?.url || "/placeholder-room.jpg"}
            alt={allImages[0]?.alt || room.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/55 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/20 text-xs font-semibold flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
              </svg>
              ดูทั้งหมด {allImages.length} รูป
            </div>
          )}
        </div>

        {/* Side thumbnails — desktop only */}
        {allImages.slice(1, 3).map((img, i) => (
          <div
            key={img.url}
            className="hidden md:block relative cursor-pointer group overflow-hidden"
            onClick={() => openGallery(i + 1)}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            {i === 1 && allImages.length > 3 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">+{allImages.length - 3}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left — room info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-[family-name:var(--font-serif)] text-3xl sm:text-4xl font-semibold text-forest-dark leading-tight">
                  {room.name}
                </h1>
                <p className="mt-1 text-sm text-earth">{hotelName}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${isFull ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                <span className={`w-2 h-2 rounded-full ${isFull ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
                {isFull ? "ห้องพักเต็ม" : `ว่าง ${room.availableRoomsCount} ห้อง`}
              </div>
            </div>

            {/* Quick specs */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-earth">
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                {room.roomSize} ตร.ม.
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 16h20" />
                </svg>
                {room.bedType}
              </span>
              <span className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                สูงสุด {room.maxGuests} คน
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-stone/40" />

          {/* Description */}
          <div>
            <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-forest-dark mb-3">
              รายละเอียดห้องพัก
            </h2>
            <p className="text-earth leading-relaxed whitespace-pre-line break-words">
              {room.description || room.shortDescription}
            </p>
          </div>

          {/* Amenities */}
          {room.amenities.length > 0 && (
            <>
              <div className="h-px bg-stone/40" />
              <div>
                <h2 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-forest-dark mb-4">
                  สิ่งอำนวยความสะดวก
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map((amenity) => (
                    <div key={amenity.label} className="flex items-center gap-2.5 bg-cream rounded-xl px-3 py-2.5">
                      <AmenityIcon icon={amenity.icon} />
                      <span className="text-sm text-earth">{amenity.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right — booking widget (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-stone/40 bg-white shadow-xl shadow-forest-dark/5 overflow-hidden">
            {/* Price header */}
            <div className="bg-forest-dark px-6 py-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  ฿{formatPrice(room.basePrice)}
                </span>
                <span className="text-stone-light text-sm">/คืน</span>
              </div>
              {nights > 1 && (
                <p className="mt-1 text-xs text-stone-light">
                  {nights} คืน = ฿{formatPrice(totalPrice)}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              {/* Check-in / Check-out */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-earth uppercase tracking-wider">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={dates.today}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (e.target.value >= checkOut) {
                        const next = new Date(e.target.value);
                        next.setDate(next.getDate() + 1);
                        setCheckOut(next.toISOString().split("T")[0]);
                      }
                    }}
                    className="w-full px-3 py-2.5 border border-stone rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-earth uppercase tracking-wider">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-earth uppercase tracking-wider">
                    ผู้ใหญ่
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={room.maxGuests}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 border border-stone rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-earth uppercase tracking-wider">
                    เด็ก
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={room.maxGuests}
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-2.5 border border-stone rounded-lg text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors bg-white"
                  />
                </div>
              </div>

              {/* Guest limit warning */}
              {guestsOverLimit && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  ห้องนี้รองรับสูงสุด {room.maxGuests} คน
                </p>
              )}

              {/* Summary */}
              {nights > 0 && !isFull && !guestsOverLimit && (
                <div className="bg-cream rounded-xl px-4 py-3 space-y-1.5 text-sm">
                  <div className="flex justify-between text-earth">
                    <span>฿{formatPrice(room.basePrice)} × {nights} คืน</span>
                    <span>฿{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="h-px bg-stone/40" />
                  <div className="flex justify-between font-semibold text-forest-dark">
                    <span>รวมทั้งหมด</span>
                    <span>฿{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              )}

              {/* Book button */}
              <button
                onClick={handleBook}
                disabled={isFull || guestsOverLimit || isNavigating}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold text-white font-semibold py-3.5 px-6 rounded-xl hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isNavigating && (
                  <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
                )}
                {isFull
                  ? "ห้องพักเต็ม"
                  : guestsOverLimit
                  ? "จำนวนผู้เข้าพักเกินกำหนด"
                  : isNavigating
                  ? "กำลังโหลด..."
                  : "จองห้องพักนี้"}
              </button>

              {!isFull && (
                <p className="text-center text-xs text-earth-light">
                  ยืนยันการจองได้ทันที — ไม่มีค่าธรรมเนียมเพิ่มเติม
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <GalleryModal
          images={allImages}
          initialIndex={galleryIndex}
          roomName={room.name}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  );
}
