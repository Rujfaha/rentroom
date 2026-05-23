"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { RoomTypeDisplay } from "@/types/landing.types";
import type { BookingLabels } from "@/components/booking/booking-i18n";
import DateRangePicker from "./DateRangePicker";
import GuestSelector from "./GuestSelector";

interface StepSelectRoomProps {
  roomTypes: RoomTypeDisplay[];
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
  isSearching: boolean;
  totalGuests: number;
  totalNights: number;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  onSelect: (room: RoomTypeDisplay) => void;
  labels: BookingLabels;
}

type SortKey = "recommended" | "price-asc" | "price-desc" | "size-desc";

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

interface AmenityIconProps {
  icon: string;
  label: string;
}

function AmenityIcon({ icon, label }: AmenityIconProps) {
  let path: React.ReactNode = null;
  switch (icon) {
    case "wifi":
      path = (
        <>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" x2="12.01" y1="20" y2="20" />
        </>
      );
      break;
    case "ac":
      path = (
        <>
          <path d="M12 2v20" />
          <path d="m4.93 4.93 14.14 14.14" />
          <path d="m4.93 19.07 14.14-14.14" />
        </>
      );
      break;
    case "tv":
      path = (
        <>
          <rect width="20" height="15" x="2" y="3" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </>
      );
      break;
    case "minibar":
      path = (
        <>
          <rect width="14" height="20" x="5" y="2" rx="2" />
          <line x1="5" x2="19" y1="10" y2="10" />
        </>
      );
      break;
    case "balcony":
      path = (
        <>
          <path d="M3 22h18" />
          <path d="M5 22V8h14v14" />
          <path d="M9 22v-6h6v6" />
        </>
      );
      break;
    case "bath":
      path = (
        <>
          <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
          <line x1="10" x2="8" y1="5" y2="7" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <line x1="7" x2="7" y1="19" y2="21" />
          <line x1="17" x2="17" y1="19" y2="21" />
        </>
      );
      break;
    case "coffee":
      path = (
        <>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </>
      );
      break;
    case "jacuzzi":
      path = (
        <>
          <path d="M5 13h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" />
          <path d="M7 13V7a3 3 0 0 1 6 0" />
          <path d="M7 21v1" />
          <path d="M17 21v1" />
        </>
      );
      break;
    default:
      path = (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-light/60 px-2.5 py-1 text-[11px] font-medium text-forest-dark">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {path}
      </svg>
      {label}
    </span>
  );
}

export default function StepSelectRoom(props: StepSelectRoomProps) {
  const labels = props.labels.selectRoom;
  const locale = props.labels.locale;
  const [selectingRoomId, setSelectingRoomId] = useState("");
  const [activeImageByRoom, setActiveImageByRoom] = useState<Record<string, number>>({});
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const filteredRooms = useMemo(
    function () {
      const list = onlyAvailable
        ? props.roomTypes.filter(function (room) {
            return room.availableRoomsCount > 0 && room.maxGuests >= props.totalGuests;
          })
        : props.roomTypes;

      const sorted = [...list];
      sorted.sort(function (a, b) {
        if (sortKey === "price-asc") return a.basePrice - b.basePrice;
        if (sortKey === "price-desc") return b.basePrice - a.basePrice;
        if (sortKey === "size-desc") return b.roomSize - a.roomSize;
        // recommended: available first, then by price asc
        const aAvail = a.availableRoomsCount > 0 ? 1 : 0;
        const bAvail = b.availableRoomsCount > 0 ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        return a.basePrice - b.basePrice;
      });
      return sorted;
    },
    [onlyAvailable, props.roomTypes, props.totalGuests, sortKey]
  );

  const availableCount = useMemo(
    function () {
      return props.roomTypes.filter(function (r) {
        return r.availableRoomsCount > 0 && r.maxGuests >= props.totalGuests;
      }).length;
    },
    [props.roomTypes, props.totalGuests]
  );

  const totalNights = props.totalNights;
  const sortLabels: Record<SortKey, string> = {
    recommended: locale === "th" ? "แนะนำ" : "Recommended",
    "price-asc": locale === "th" ? "ราคาต่ำ→สูง" : "Price: low to high",
    "price-desc": locale === "th" ? "ราคาสูง→ต่ำ" : "Price: high to low",
    "size-desc": locale === "th" ? "ขนาดใหญ่ที่สุด" : "Largest first",
  };

  return (
    <div className="space-y-6">
      {/* Search bar - non-sticky, but kept above room cards so dropdowns float over them */}
      <div className="relative z-20 rounded-2xl border border-stone/40 bg-white/95 p-3 shadow-sm backdrop-blur-md sm:rounded-3xl sm:p-5 sm:shadow-lg sm:shadow-forest-dark/5">
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1fr_320px] sm:gap-3">
          <DateRangePicker
            checkIn={props.checkIn}
            checkOut={props.checkOut}
            onChange={function (next) {
              props.onCheckInChange(next.checkIn);
              props.onCheckOutChange(next.checkOut);
            }}
            locale={locale}
            totalNights={totalNights}
          />
          <GuestSelector
            adults={props.adults}
            childrenCount={props.childrenCount}
            onAdultsChange={props.onAdultsChange}
            onChildrenChange={props.onChildrenChange}
            locale={locale}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-stone/30 pt-2.5 sm:mt-3 sm:gap-3 sm:pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-earth sm:gap-2 sm:text-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="text-gold-dark"
            >
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
            {props.isSearching ? (
              <span className="font-medium text-forest-dark">{labels.searching}</span>
            ) : (
              <span>
                {locale === "th"
                  ? "พบ " + String(availableCount) + " ห้อง พร้อมเข้าพัก"
                  : String(availableCount) + " stay options found"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone bg-white px-3 py-1.5 text-xs font-medium text-forest-dark transition-colors hover:border-gold">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={function (e) {
                  setOnlyAvailable(e.target.checked);
                }}
                className="h-3.5 w-3.5 cursor-pointer accent-gold"
              />
              {locale === "th" ? "แสดงเฉพาะห้องว่าง" : "Available only"}
            </label>

            <div className="relative">
              <select
                value={sortKey}
                onChange={function (e) {
                  setSortKey(e.target.value as SortKey);
                }}
                className="cursor-pointer appearance-none rounded-full border border-stone bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-forest-dark transition-colors hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
              >
                <option value="recommended">{sortLabels.recommended}</option>
                <option value="price-asc">{sortLabels["price-asc"]}</option>
                <option value="price-desc">{sortLabels["price-desc"]}</option>
                <option value="size-desc">{sortLabels["size-desc"]}</option>
              </select>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-earth"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Room cards */}
      {props.isSearching && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3].map(function (i) {
            return (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-stone/40 bg-white shadow-sm"
              >
                <div className="aspect-[16/10] animate-pulse bg-stone-light" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-stone-light" />
                  <div className="h-3 w-full animate-pulse rounded bg-stone-light/70" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-stone-light/70" />
                  <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-stone-light" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!props.isSearching && filteredRooms.length === 0 && (
        <div className="rounded-3xl border border-stone/40 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-light text-earth">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <p className="text-base font-semibold text-forest-dark">{labels.noRoomsTitle}</p>
          <p className="mt-1 text-sm text-earth">{labels.noRoomsHint}</p>
        </div>
      )}

      {!props.isSearching && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredRooms.map(function (room) {
            const hasVacancy = room.availableRoomsCount > 0;
            const fitsGuests = room.maxGuests >= props.totalGuests;
            const isAvailable = hasVacancy && fitsGuests;
            const isSelecting = selectingRoomId === room.id;
            const galleryImages = room.galleryUrls.length
              ? room.galleryUrls
              : [room.coverImageUrl];
            const activeImageIndex = activeImageByRoom[room.id] ?? 0;
            const activeImage = galleryImages[activeImageIndex] || room.coverImageUrl;
            const stayTotal = room.stayTotal ?? room.basePrice * Math.max(1, totalNights);

            return (
              <article
                key={room.id}
                className={
                  "group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-xl hover:shadow-forest-dark/10 " +
                  (isAvailable ? "border-stone/40" : "border-stone/40 opacity-75")
                }
              >
                {/* Image with gallery */}
                <div className="relative aspect-[16/10] overflow-hidden bg-stone-light">
                  <Image
                    src={activeImage}
                    alt={room.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />

                  {/* Gradient overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />

                  {/* Status badge */}
                  <div className="absolute left-3 top-3 flex flex-col gap-2">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md " +
                        (hasVacancy
                          ? "bg-emerald-500/90 text-white"
                          : "bg-red-500/90 text-white")
                      }
                    >
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (hasVacancy ? "bg-white animate-pulse" : "bg-white/70")
                        }
                      />
                      {hasVacancy
                        ? labels.availableRooms(room.availableRoomsCount)
                        : labels.fullyBooked}
                    </span>
                  </div>

                  {/* Price badge */}
                  <div className="absolute right-3 top-3 rounded-2xl bg-white/95 px-3 py-1.5 text-right shadow-md backdrop-blur">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-earth">
                      {locale === "th" ? "เริ่มต้น" : "from"}
                    </div>
                    <div className="text-base font-bold leading-tight text-forest-dark">
                      ฿{formatPrice(room.basePrice)}
                    </div>
                  </div>

                  {/* Gallery dots */}
                  {galleryImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {galleryImages.map(function (_url, idx) {
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={function () {
                              setActiveImageByRoom(function (current) {
                                return { ...current, [room.id]: idx };
                              });
                            }}
                            aria-label={"View image " + String(idx + 1)}
                            className={
                              "h-1.5 rounded-full transition-all " +
                              (idx === activeImageIndex
                                ? "w-6 bg-white"
                                : "w-1.5 bg-white/60 hover:bg-white/80")
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <h4 className="font-[family-name:var(--font-serif)] text-xl font-bold text-forest-dark">
                    {room.name}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-sm text-earth">
                    {room.shortDescription}
                  </p>

                  {/* Specs */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-charcoal">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-light/60 px-2.5 py-1 font-medium">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2" />
                        <path d="M3 14h18" />
                        <path d="M3 10V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
                        <path d="M5 18v2" />
                        <path d="M19 18v2" />
                      </svg>
                      {room.bedType}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-light/60 px-2.5 py-1 font-medium">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M9 3v18" />
                        <path d="M3 9h18" />
                      </svg>
                      {String(room.roomSize)} sqm
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-light/60 px-2.5 py-1 font-medium">
                      <svg
                        width="12"
                        height="12"
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
                      {labels.maxGuests(room.maxGuests)}
                    </span>
                  </div>

                  {/* Amenities (top 4) */}
                  {room.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 4).map(function (amenity, idx) {
                        return (
                          <AmenityIcon key={idx} icon={amenity.icon} label={amenity.label} />
                        );
                      })}
                      {room.amenities.length > 4 && (
                        <span className="inline-flex items-center rounded-full bg-stone-light/60 px-2.5 py-1 text-[11px] font-medium text-earth">
                          +{String(room.amenities.length - 4)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer with price + CTA */}
                  <div className="mt-auto pt-5 space-y-2.5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-earth">
                          {locale === "th"
                            ? "รวม " + String(totalNights) + " คืน"
                            : "Total " +
                              String(totalNights) +
                              " night" +
                              (totalNights === 1 ? "" : "s")}
                        </div>
                        <div className="text-xl font-bold leading-tight text-forest-dark">
                          ฿{formatPrice(stayTotal)}
                        </div>
                        <div className="text-[11px] text-earth-light">
                          ฿{formatPrice(room.basePrice)}
                          {labels.perNight}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={function () {
                          if (!isAvailable) return;
                          setSelectingRoomId(room.id);
                          window.setTimeout(function () {
                            props.onSelect(room);
                            setSelectingRoomId("");
                          }, 150);
                        }}
                        disabled={!isAvailable || Boolean(selectingRoomId)}
                        className={
                          "inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all " +
                          (isAvailable && !selectingRoomId
                            ? "bg-gradient-to-br from-gold to-gold-dark text-white shadow-md shadow-gold/30 hover:shadow-lg hover:shadow-gold/40 active:scale-95"
                            : "cursor-not-allowed bg-stone-light text-earth")
                        }
                      >
                        {isSelecting ? (
                          <>
                            <span
                              className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
                              aria-hidden="true"
                            />
                            {locale === "th" ? "กำลังโหลด..." : "Loading..."}
                          </>
                        ) : (
                          <>
                            {isAvailable ? labels.select : labels.notAvailable}
                            {isAvailable && (
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
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            )}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Detail link */}
                    <a
                      href={"/rooms/" + room.id}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-stone/60 py-2 text-xs font-medium text-earth transition-colors hover:border-gold/60 hover:text-gold"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      {locale === "th" ? "ดูรายละเอียดห้อง" : "View room details"}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
