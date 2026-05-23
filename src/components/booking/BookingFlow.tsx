"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import StepSelectRoom from "./StepSelectRoom";
import StepGuestInfo from "@/components/booking/StepGuestInfo";
import StepPayment from "@/components/booking/StepPayment";
import StepConfirmation from "@/components/booking/StepConfirmation";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import { createWebsiteBooking, searchAvailableRoomTypes } from "@/app/actions/booking";
import { createClient } from "@/lib/supabase/client";
import { bookingMessages, writeBookingLocaleCookie, type BookingLocale } from "@/components/booking/booking-i18n";
import { clearGuestInfoDraft } from "@/components/booking/useGuestInfoDraft";

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

interface StepIconProps {
  index: number;
  state: "active" | "done" | "todo";
}

function StepDot({ index, state }: StepIconProps) {
  const baseClass =
    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ";
  const stateClass =
    state === "active"
      ? "bg-gradient-to-br from-gold to-gold-dark text-white shadow-lg shadow-gold/30 ring-4 ring-gold/20"
      : state === "done"
      ? "bg-forest text-white"
      : "bg-stone-light text-earth";

  if (state === "done") {
    return (
      <div className={baseClass + stateClass}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }

  return <div className={baseClass + stateClass}>{String(index + 1)}</div>;
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
  const [formStartedAt] = useState(function () {
    return Date.now();
  });

  useEffect(
    function () {
      writeBookingLocaleCookie(locale);
    },
    [locale]
  );

  const preselectedRoom = searchParams.get("room") || "";
  const preCheckIn = searchParams.get("checkIn") || initialCheckIn;
  const preCheckOut = searchParams.get("checkOut") || initialCheckOut;
  const preAdults = Number(searchParams.get("adults")) || initialAdults;
  const preChildren = Number(searchParams.get("children")) || initialChildren;

  const [step, setStep] = useState(preselectedRoom ? 1 : 0);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDisplay[]>(initialRoomTypes);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeDisplay | null>(
    preselectedRoom
      ? initialRoomTypes.find(function (r) {
          return r.id === preselectedRoom;
        }) || null
      : null
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
  const [slipUrl, setSlipUrl] = useState("");

  function handleSelectRoom(room: RoomTypeDisplay) {
    setSelectedRoom(room);
    setStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

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
    clearGuestInfoDraft();
    setStep(3);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const totalNights = calculateNights(checkIn, checkOut);
  const totalGuests = adults + children;

  const canSearch = useMemo(
    function () {
      return Boolean(
        hotelId && checkIn && checkOut && new Date(checkOut).getTime() > new Date(checkIn).getTime()
      );
    },
    [checkIn, checkOut, hotelId]
  );

  const refreshRoomTypes = useCallback(
    async function (options?: { silent?: boolean }) {
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
        return (
          nextRoomTypes.find(function (room) {
            return room.id === current.id;
          }) || null
        );
      });

      if (!options?.silent) {
        setIsSearching(false);
      }
    },
    [adults, canSearch, checkIn, checkOut, children, hotelId]
  );

  useEffect(
    function () {
      const timeoutId = window.setTimeout(function () {
        void refreshRoomTypes();
      }, 250);

      return function () {
        window.clearTimeout(timeoutId);
      };
    },
    [refreshRoomTypes]
  );

  useEffect(
    function () {
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
    },
    [hotelId, refreshRoomTypes, supabase]
  );

  return (
    <div>
      {/* Modern step header */}
      <div className="mb-6 rounded-2xl border border-stone/40 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:mb-8 sm:rounded-3xl sm:p-6">
        {/* Mobile: compact "Step X / Y — label" layout */}
        <div className="sm:hidden">
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-earth">
                {labels.locale === "th"
                  ? "ขั้นตอน " + String(step + 1) + " จาก " + String(labels.steps.length)
                  : "Step " + String(step + 1) + " of " + String(labels.steps.length)}
              </div>
              <div className="mt-0.5 text-base font-bold text-forest-dark">
                {labels.steps[step]}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-white shadow-md shadow-gold/30">
              {String(step + 1)}
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-stone-light">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest to-gold transition-all duration-500"
              style={{
                width:
                  String(((step + 1) / labels.steps.length) * 100) + "%",
              }}
            />
          </div>
        </div>

        {/* Desktop: full step indicator */}
        <div className="hidden items-center sm:flex">
          {labels.steps.map(function (label, i) {
            const state: "active" | "done" | "todo" =
              i === step ? "active" : i < step ? "done" : "todo";
            const textClass =
              state === "active"
                ? "text-forest-dark font-semibold"
                : state === "done"
                ? "text-forest"
                : "text-earth-light";
            const isLast = i === labels.steps.length - 1;

            return (
              <div
                key={label}
                className={"flex items-center " + (isLast ? "" : "flex-1")}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <StepDot index={i} state={state} />
                  <span className={"text-[11px] " + textClass}>{label}</span>
                </div>
                {!isLast && (
                  <div
                    className={
                      "mx-3 h-0.5 flex-1 rounded-full transition-colors duration-500 " +
                      (state === "todo" ? "bg-stone-light" : "bg-gradient-to-r from-forest to-gold")
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
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
          totalNights={totalNights}
          onCheckInChange={setCheckIn}
          onCheckOutChange={setCheckOut}
          onAdultsChange={setAdults}
          onChildrenChange={setChildren}
          onSelect={handleSelectRoom}
          labels={labels}
        />
      )}

      {step === 1 && selectedRoom && (
        <div className="mx-auto max-w-4xl">
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
        </div>
      )}

      {step === 2 && selectedRoom && guestInfo && (
        <div className="mx-auto max-w-4xl">
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
        </div>
      )}

      {step === 3 && selectedRoom && guestInfo && (
        <div className="mx-auto max-w-4xl">
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
        </div>
      )}
    </div>
  );
}
