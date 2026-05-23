"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import GalleryModal from "@/components/ui/GalleryModal";
import type { RoomTypeDisplay } from "@/types/landing.types";
import { getRoomAvailabilityCounts } from "@/app/actions/landing";
import { createClient } from "@/lib/supabase/client";

interface RoomTypesSectionProps {
  initialRoomTypes: RoomTypeDisplay[];
  hotelId: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
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
    robe: "M12 2L6 7v15h12V7z",
    kitchen: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    garden: "M12 22V8M5 12H2a10 10 0 0 0 20 0h-3",
    crib: "M2 8h20v10H2zM6 8V6M18 8V6",
    parking: "M6 20V4h6a4 4 0 0 1 0 8H6",
  };
  const d = iconMap[icon] || "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
      <path d={d} />
    </svg>
  );
}

function buildGalleryImages(room: RoomTypeDisplay): { url: string; alt: string }[] {
  const urls = [room.coverImageUrl, ...room.galleryUrls].filter(Boolean);
  return Array.from(new Set(urls)).map((url, index) => ({
    url,
    alt: room.name + " รูปที่ " + String(index + 1),
  }));
}

function RoomCard({ room, onImageClick }: { room: RoomTypeDisplay; onImageClick: (room: RoomTypeDisplay) => void }) {
  const isFull = (room.availableRoomsCount || 0) <= 0;
  const galleryCount = buildGalleryImages(room).length;

  return (
    <div
      className={"group bg-white rounded-2xl overflow-hidden shadow-lg shadow-forest-dark/5 hover:shadow-2xl hover:shadow-forest-dark/10 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full " + (isFull ? "grayscale opacity-75" : "")}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={"ดูแกลเลอรี่ " + room.name}
        className="relative h-64 overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={function () {
          onImageClick(room);
        }}
        onKeyDown={function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onImageClick(room);
          }
        }}
      >
        <Image
          src={room.coverImageUrl}
          alt={room.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-500" />
        {galleryCount > 1 && (
          <div className="absolute bottom-4 left-4 z-10 bg-black/55 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
            <span className="text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
              </svg>
              {"ดูรูปภาพ " + String(galleryCount) + " รูป"}
            </span>
          </div>
        )}
        {/* Info Tags - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10">
          {/* Price Tag */}
          <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white/50">
            <span className="text-forest-dark font-bold text-sm tracking-tight">
              {"THB " + formatPrice(room.basePrice) + "/night"}
            </span>
          </div>

          {/* Availability Badge */}
          <div className={"backdrop-blur-md px-3 py-1.5 rounded-full border shadow-lg transition-all duration-300 " + (isFull ? "bg-red-500/60 border-red-400/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-forest-dark/60 border-forest-light/50 text-white shadow-[0_0_15px_rgba(26,60,42,0.4)]")}>
            <span className="text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 tracking-wide">
              {isFull ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse" />
                  ห้องพักเต็ม
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  {"ว่าง " + room.availableRoomsCount + " ห้อง"}
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-forest-dark">
          {room.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-earth">
          <span>{String(room.roomSize) + " sqm"}</span>
          <span className="w-1 h-1 bg-stone rounded-full" />
          <span>{room.bedType}</span>
          <span className="w-1 h-1 bg-stone rounded-full" />
          <span className="inline-flex items-center">
            {"Max " + String(room.maxGuests)}
            {Number(room.maxExtraBeds) > 0 && (
              <span className="text-[11px] text-[#8b7355] font-medium ml-1">
                {"(+" + String(room.maxExtraBeds) + " extra)"}
              </span>
            )}
            {" guests"}
          </span>
        </div>

        <p className="mt-3 text-sm text-earth-light leading-relaxed line-clamp-2">
          {room.shortDescription}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {room.amenities.slice(0, 4).map(function (amenity) {
            return (
              <div
                key={amenity.label}
                className="flex items-center gap-1.5 text-xs text-earth bg-cream px-2.5 py-1 rounded-full"
              >
                <AmenityIcon icon={amenity.icon} />
                <span>{amenity.label}</span>
              </div>
            );
          })}
          {room.amenities.length > 4 && (
            <span className="text-xs text-earth-light px-2.5 py-1">
              {"+" + String(room.amenities.length - 4) + " more"}
            </span>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Button
            href={isFull ? undefined : "/rooms/" + room.id}
            variant="primary"
            size="sm"
            className="w-full"
            disabled={isFull}
            loadingLabel="กำลังโหลด..."
          >
            {isFull ? "จองเต็มแล้ว (Fully Booked)" : "จองห้องพักนี้"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoomTypesSection({ initialRoomTypes, hotelId }: RoomTypesSectionProps) {
  const [galleryRoom, setGalleryRoom] = useState<RoomTypeDisplay | null>(null);
  const [availabilityCounts, setAvailabilityCounts] = useState<Record<string, number>>({});

  const supabase = useMemo(() => createClient(), []);

  const refreshAvailability = useCallback(async () => {
    if (!hotelId) return;
    const availableCounts = await getRoomAvailabilityCounts(hotelId);
    setAvailabilityCounts(availableCounts);
  }, [hotelId]);

  const roomTypes = useMemo(
    () =>
      initialRoomTypes.map((roomType) => ({
        ...roomType,
        availableRoomsCount:
          availabilityCounts[roomType.id] ?? roomType.availableRoomsCount,
      })),
    [availabilityCounts, initialRoomTypes]
  );

  useEffect(() => {
    if (!hotelId) return;
    const initialRefreshId = window.setTimeout(() => {
      void refreshAvailability();
    }, 0);

    const roomsChannel = supabase
      .channel("landing-rooms-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: "hotel_id=eq." + hotelId,
        },
        () => {
          void refreshAvailability();
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel("landing-bookings-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: "hotel_id=eq." + hotelId,
        },
        () => {
          void refreshAvailability();
        }
      )
      .subscribe();

    const intervalId = window.setInterval(() => {
      void refreshAvailability();
    }, 60000);

    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [hotelId, refreshAvailability, supabase]);

  useEffect(function () {
    if (galleryRoom) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";

    }
    return function () {
      document.body.style.overflow = "";
    };
  }, [galleryRoom]);

  if (!roomTypes || roomTypes.length === 0) {
    return (
      <section id="rooms" className="py-16 md:py-24 bg-cream px-4">
        <div className="max-w-7xl mx-auto">
          <SectionTitle
            title="Room Types"
            subtitle="Each room is designed to provide the ultimate comfort with stunning mountain views"
          />
          <div className="text-center py-12">
            <p className="text-earth-light">ยังไม่มีข้อมูลประเภทห้องพัก</p>
          </div>
        </div>
      </section>
    );
  }

  const displayed = roomTypes.slice(0, 3);
  const remaining = roomTypes.slice(3);

  return (
    <section id="rooms" className="py-16 md:py-24 bg-cream px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title="Room Types"
          subtitle="Each room is designed to provide the ultimate comfort with stunning mountain views"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayed.map(function (room) {
            return <RoomCard key={room.id} room={room} onImageClick={setGalleryRoom} />;
          })}
        </div>

        {remaining.length > 0 && (
          <div className="mt-10 text-center">
            <a
              href="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-forest-dark text-forest-dark font-medium rounded-full hover:bg-forest-dark hover:text-white transition-colors duration-300 cursor-pointer"
            >
              <span>เพิ่มเติม</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {galleryRoom && (
        <GalleryModal
          images={buildGalleryImages(galleryRoom)}
          roomName={galleryRoom.name}
          onClose={function () { setGalleryRoom(null); }}
        />
      )}
    </section>
  );
}
