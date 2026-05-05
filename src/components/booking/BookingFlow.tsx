"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import StepSelectRoom from "./StepSelectRoom";
import StepGuestInfo from "./StepGuestInfo";
import StepPayment from "./StepPayment";
import StepConfirmation from "./StepConfirmation";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import { getLandingPageData, generateBookingReference, calculateNights } from "@/services/mock-data";

const STEPS = ["Select Room", "Guest Info", "Payment", "Confirmation"];

export default function BookingFlow() {
  const searchParams = useSearchParams();
  const data = getLandingPageData();

  const preselectedRoom = searchParams.get("room") || "";
  const preCheckIn = searchParams.get("checkIn") || new Date().toISOString().split("T")[0];
  const preCheckOut = searchParams.get("checkOut") || new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const preAdults = Number(searchParams.get("adults")) || 2;
  const preChildren = Number(searchParams.get("children")) || 0;

  const [step, setStep] = useState(preselectedRoom ? 1 : 0);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeDisplay | null>(
    preselectedRoom ? data.roomTypes.find(function (r) { return r.id === preselectedRoom; }) || null : null
  );
  const [checkIn, setCheckIn] = useState(preCheckIn);
  const [checkOut, setCheckOut] = useState(preCheckOut);
  const [adults, setAdults] = useState(preAdults);
  const [children, setChildren] = useState(preChildren);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [bookingRef, setBookingRef] = useState("");

  function handleSelectRoom(room: RoomTypeDisplay) {
    setSelectedRoom(room);
    setStep(1);
  }

  const [slipUrl, setSlipUrl] = useState("");

  function handleGuestSubmit(info: GuestInfo) {
    setGuestInfo(info);
    setStep(2);
  }

  function handlePaymentConfirm(uploadedSlipUrl: string) {
    setSlipUrl(uploadedSlipUrl);
    setBookingRef(generateBookingReference());
    setStep(3);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const totalNights = calculateNights(checkIn, checkOut);

  return (
    <div>
      <div className="flex items-center justify-center mb-10">
        {STEPS.map(function (label, i) {
          const isActive = i === step;
          const isDone = i < step;
          const circleClass = isActive
            ? "bg-gold text-white"
            : isDone
            ? "bg-forest text-white"
            : "bg-stone-light text-earth";
          const textClass = isActive ? "text-gold font-semibold" : isDone ? "text-forest" : "text-earth-light";
          return (
            <div key={label} className="flex items-center">
              {i > 0 && (
                <div className={isDone || isActive ? "w-12 h-0.5 bg-gold mx-2" : "w-12 h-0.5 bg-stone mx-2"} />
              )}
              <div className="flex flex-col items-center gap-1">
                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + circleClass}>
                  {isDone ? "\u2713" : String(i + 1)}
                </div>
                <span className={"text-xs hidden sm:block " + textClass}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 0 && (
        <StepSelectRoom
          roomTypes={data.roomTypes}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          childrenCount={children}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onAdultsChange={setAdults}
          onChildrenChange={setChildren}
          onSelect={handleSelectRoom}
        />
      )}

      {step === 1 && selectedRoom && (
        <StepGuestInfo
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          totalNights={totalNights}
          adults={adults}
          childrenCount={children}
          onSubmit={handleGuestSubmit}
          onBack={handleBack}
        />
      )}

      {step === 2 && selectedRoom && guestInfo && (
        <StepPayment
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          totalNights={totalNights}
          adults={adults}
          childrenCount={children}
          guest={guestInfo}
          onConfirm={handlePaymentConfirm}
          onBack={handleBack}
        />
      )}

      {step === 3 && selectedRoom && guestInfo && (
        <StepConfirmation
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          totalNights={totalNights}
          adults={adults}
          childrenCount={children}
          guest={guestInfo}
          bookingRef={bookingRef}
          slipUrl={slipUrl}
        />
      )}
    </div>
  );
}
