"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StepSelectRoom from "./StepSelectRoomLegacy";
import StepGuestInfo from "./StepGuestInfo";
import StepPayment from "./StepPayment";
import StepConfirmation from "./StepConfirmation";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import { createWebsiteBooking, searchAvailableRoomTypes } from "@/app/actions/booking";
import { createClient } from "@/lib/supabase/client";
import { bookingMessages, writeBookingLocaleCookie, type BookingLocale } from "./booking-i18n";
import { clearGuestInfoDraft } from "./useGuestInfoDraft";

interface BookingFlowProps {
  hotelId: string;
  hotelName: string;
  initialRoomTypes: RoomTypeDisplay[];
  initialCheckIn: string;
  initialCheckOut: string;
  initialAdults: number;
  initialChildren: number;
  locale: BookingLocale;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export default function BookingFlow({
  hotelId,
  hotelName,
  initialRoomTypes,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  locale,
}: BookingFlowProps) {
  const searchParams = useSearchParams();
  const labels = bookingMessages[locale];
  const supabase = useMemo(() => createClient(), []);
  const searchRequestIdRef = useRef(0);
  const [formStartedAt] = useState(function () { return Date.now(); });

  // sync cookie จำภาษาที่ user เลือก ให้ครั้งถัดไปเข้ามาแล้วได้ภาษาเดิม
  useEffect(function () {
    writeBookingLocaleCookie(locale);
  }, [locale]);

  const preselectedRoom = searchParams.get("room") || "";
  const preCheckIn = searchParams.get("checkIn") || initialCheckIn;
  const preCheckOut = searchParams.get("checkOut") || initialCheckOut;
  const preAdults = Number(searchParams.get("adults")) || initialAdults;
  const preChildren = Number(searchParams.get("children")) || initialChildren;

  const [step, setStep] = useState(preselectedRoom ? 1 : 0);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDisplay[]>(initialRoomTypes);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeDisplay | null>(
    preselectedRoom ? initialRoomTypes.find(function (r) { return r.id === preselectedRoom; }) || null : null
  );
  const [checkIn, setCheckIn] = useState(preCheckIn);
  const [checkOut, setCheckOut] = useState(preCheckOut);
  const [adults, setAdults] = useState(preAdults);
  const [children, setChildren] = useState(preChildren);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [confirmedTotalAmount, setConfirmedTotalAmount] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);

  function handleSelectRoom(room: RoomTypeDisplay) {
    setSelectedRoom(room);
    setStep(1);
  }

  const [slipUrl, setSlipUrl] = useState("");

  function handleGuestSubmit(info: GuestInfo) {
    setGuestInfo(info);
    setStep(2);
  }

  async function handlePaymentConfirm(uploadedSlipUrl: string, promotionCode?: string) {
    if (!selectedRoom || !guestInfo) return;
    setPaymentError("");
    setIsCreatingBooking(true);
    const result = await createWebsiteBooking({
      hotelId,
      roomTypeId: selectedRoom.id,
      checkIn,
      checkOut,
      adults,
      children,
      guest: guestInfo,
      slipUrl: uploadedSlipUrl,
      promotionCode,
      antiSpam: {
        companyName: guestInfo.companyName || "",
        formStartedAt: formStartedAt,
      },
    });
    setIsCreatingBooking(false);

    if (!result.success || !result.bookingNumber) {
      setPaymentError(result.error || "ไม่สามารถสร้างการจองได้");
      void refreshRoomTypes({ silent: true });
      return;
    }

    setSlipUrl(uploadedSlipUrl);
    setBookingRef(result.bookingNumber);
    setConfirmedTotalAmount(result.netAmount ?? null);
    // จองสำเร็จแล้ว — ล้าง draft ข้อมูลลูกค้าออก
    clearGuestInfoDraft();
    setStep(3);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const totalNights = calculateNights(checkIn, checkOut);
  const totalGuests = adults + children;

  const canSearch = useMemo(function () {
    return Boolean(hotelId && checkIn && checkOut && new Date(checkOut).getTime() > new Date(checkIn).getTime());
  }, [checkIn, checkOut, hotelId]);

  const refreshRoomTypes = useCallback(async function (options?: { silent?: boolean }) {
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;

    if (!canSearch) {
      setRoomTypes([]);
      setSelectedRoom(null);
      return;
    }

    if (!options?.silent) {
      setIsSearching(true);
    }

    const nextRoomTypes = await searchAvailableRoomTypes({
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
    });

    if (requestId !== searchRequestIdRef.current) {
      return;
    }

    setRoomTypes(nextRoomTypes);
    setSelectedRoom(function (current) {
      if (!current) return current;
      return nextRoomTypes.find(function (room) { return room.id === current.id; }) || null;
    });

    if (!options?.silent) {
      setIsSearching(false);
    }
  }, [adults, canSearch, checkIn, checkOut, children, hotelId]);

  useEffect(function () {
    const timeoutId = window.setTimeout(function () {
      void refreshRoomTypes();
    }, 250);

    return function () {
      window.clearTimeout(timeoutId);
    };
  }, [refreshRoomTypes]);

  useEffect(function () {
    if (!hotelId) return;

    const roomsChannel = supabase
      .channel("booking-rooms-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: "hotel_id=eq." + hotelId,
        },
        function () {
          void refreshRoomTypes({ silent: true });
        }
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel("booking-bookings-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: "hotel_id=eq." + hotelId,
        },
        function () {
          void refreshRoomTypes({ silent: true });
        }
      )
      .subscribe();

    const intervalId = window.setInterval(function () {
      void refreshRoomTypes({ silent: true });
    }, 5000);

    return function () {
      window.clearInterval(intervalId);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [hotelId, refreshRoomTypes, supabase]);

  return (
    <div>
      <div className="flex items-center justify-center mb-10">
        {labels.steps.map(function (label, i) {
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
          roomTypes={roomTypes}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          childrenCount={children}
          isSearching={isSearching}
          totalGuests={totalGuests}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onAdultsChange={setAdults}
          onChildrenChange={setChildren}
          onSelect={handleSelectRoom}
          labels={labels}
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
          initialInfo={guestInfo}
          onSubmit={handleGuestSubmit}
          onBack={handleBack}
          labels={labels}
        />
      )}

      {step === 2 && selectedRoom && guestInfo && (
        <StepPayment
          hotelId={hotelId}
          room={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          totalNights={totalNights}
          adults={adults}
          childrenCount={children}
          guest={guestInfo}
          onConfirm={handlePaymentConfirm}
          onBack={handleBack}
          labels={labels}
          error={paymentError}
          isConfirming={isCreatingBooking}
        />
      )}

      {step === 3 && selectedRoom && guestInfo && (
        <StepConfirmation
          room={selectedRoom}
          hotelName={hotelName}
          checkIn={checkIn}
          checkOut={checkOut}
          totalNights={totalNights}
          adults={adults}
          childrenCount={children}
          guest={guestInfo}
          bookingRef={bookingRef}
          slipUrl={slipUrl}
          totalAmount={confirmedTotalAmount ?? undefined}
          labels={labels}
        />
      )}
    </div>
  );
}
