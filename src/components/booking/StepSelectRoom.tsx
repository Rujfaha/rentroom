"use client";

import Image from "next/image";
import type { RoomTypeDisplay } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";

interface StepSelectRoomProps {
  roomTypes: RoomTypeDisplay[];
  checkIn: string;
  checkOut: string;
  adults: number;
  childrenCount: number;
  isSearching: boolean;
  totalGuests: number;
  onCheckInChange: (v: string) => void;
  onCheckOutChange: (v: string) => void;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  onSelect: (room: RoomTypeDisplay) => void;
  labels: BookingLabels;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function StepSelectRoom(props: StepSelectRoomProps) {
  const today = getToday();
  const labels = props.labels.selectRoom;

  return (
    <div>
      <div className="bg-white rounded-xl p-6 shadow-md mb-8">
        <h3 className="font-semibold text-forest-dark mb-4">{labels.title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1">{labels.checkIn}</label>
            <input
              type="date"
              value={props.checkIn}
              min={today}
              onChange={function (e) { props.onCheckInChange(e.target.value); }}
              className="w-full px-3 py-2 border border-stone rounded-lg text-sm focus:ring-2 focus:ring-gold/50 focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1">{labels.checkOut}</label>
            <input
              type="date"
              value={props.checkOut}
              min={props.checkIn || today}
              onChange={function (e) { props.onCheckOutChange(e.target.value); }}
              className="w-full px-3 py-2 border border-stone rounded-lg text-sm focus:ring-2 focus:ring-gold/50 focus:border-gold"
            />
          </div>
          <div>
            <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1">{labels.adults}</label>
            <select
              value={props.adults}
              onChange={function (e) { props.onAdultsChange(Number(e.target.value)); }}
              className="w-full px-3 py-2 border border-stone rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold/50"
            >
              {[1, 2, 3, 4, 5, 6].map(function (n) {
                return <option key={n} value={n}>{n}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="text-xs text-earth uppercase tracking-wider font-medium block mb-1">{labels.children}</label>
            <select
              value={props.childrenCount}
              onChange={function (e) { props.onChildrenChange(Number(e.target.value)); }}
              className="w-full px-3 py-2 border border-stone rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold/50"
            >
              {[0, 1, 2, 3, 4].map(function (n) {
                return <option key={n} value={n}>{n}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-forest-dark mb-4">{labels.chooseRoom}</h3>
      <div className="space-y-4">
        {props.isSearching && (
          <div className="bg-white rounded-xl p-6 shadow-md text-center text-earth">
            {labels.searching}
          </div>
        )}

        {!props.isSearching && props.roomTypes.length === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <p className="font-semibold text-forest-dark">{labels.noRoomsTitle}</p>
            <p className="text-sm text-earth mt-1">{labels.noRoomsHint}</p>
          </div>
        )}

        {props.roomTypes.map(function (room) {
          const hasVacancy = room.availableRoomsCount > 0;
          const fitsGuests = room.maxGuests >= props.totalGuests;
          const isAvailable = hasVacancy && fitsGuests;
          const availabilityText = hasVacancy
            ? labels.availableRooms(room.availableRoomsCount)
            : labels.fullyBooked;
          return (
            <div
              key={room.id}
              className={"bg-white rounded-xl overflow-hidden shadow-md flex flex-col md:flex-row " + (isAvailable ? "" : "opacity-50")}
            >
              <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                <Image src={room.coverImageUrl} alt={room.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 256px" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-forest-dark">{room.name}</h4>
                  <p className="text-sm text-earth mt-1">{room.shortDescription}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-earth-light">
                    <span>{String(room.roomSize) + " sqm"}</span>
                    <span>{room.bedType}</span>
                    <span>{labels.maxGuests(room.maxGuests)}</span>
                    <span className={"inline-flex items-center rounded-full px-2 py-0.5 font-semibold " + (hasVacancy ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                      {availabilityText}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-lg font-bold text-forest-dark">{"THB " + formatPrice(room.basePrice)}</span>
                    <span className="text-sm text-earth">{labels.perNight}</span>
                  </div>
                  <button
                    onClick={function () { if (isAvailable) props.onSelect(room); }}
                    disabled={!isAvailable}
                    className={"px-5 py-2 rounded-lg text-sm font-semibold transition-all " + (isAvailable ? "bg-gold text-white hover:bg-gold-dark cursor-pointer" : "bg-stone-light text-earth cursor-not-allowed")}
                  >
                    {isAvailable ? labels.select : labels.notAvailable}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
