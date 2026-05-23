"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StepSelectRoom from "./StepSelectRoom";
import StepGuestInfo from "@/components/booking/StepGuestInfo";
import StepPayment from "@/components/booking/StepPayment";
import StepConfirmation from "@/components/booking/StepConfirmation";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import { createWebsiteBookingGroup, searchAvailableRoomTypes } from "@/app/actions/booking";
import { createClient } from "@/lib/supabase/client";
import { bookingMessages, writeBookingLocaleCookie, type BookingLocale } from "@/components/booking/booking-i18n";
import { clearGuestInfoDraft } from "@/components/booking/useGuestInfoDraft";
import { useBookingCart } from "./useBookingCart";
import { readTripState, writeTripState, clearTripState } from "./useTripContext";
import { calculateBookingRoomsTotal } from "@/lib/booking/pricing-summary";

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
  const router = useRouter();
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

  // ดึงค่าจาก URL query
  // - legacy: ?room=<id> (auto-step1)
  // - จาก /rooms/[id]: ?addRoom=<id>&qty=<n> เท่านั้น (ไม่ส่งวัน/จำนวนคนกลับ)
  // - จาก search bar / landing: ?checkIn&checkOut&adults&children (ครั้งแรกของ trip)
  const preselectedRoomLegacy = searchParams.get("room") || "";
  const preAddRoomId = searchParams.get("addRoom") || "";
  const preAddRoomQty = (() => {
    const n = Number(searchParams.get("qty"));
    return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 5) : 1;
  })();

  // อ่าน trip state จาก sessionStorage ก่อน (สำหรับการกลับมาจาก /rooms/[id])
  // ถ้าไม่มีใน session ใช้ URL query (search bar) และ fallback เป็น initial
  const queryCheckIn = searchParams.get("checkIn");
  const queryCheckOut = searchParams.get("checkOut");
  const queryAdults = searchParams.get("adults");
  const queryChildren = searchParams.get("children");

  // initialState: ถ้า user มาด้วย ?addRoom (จาก rooms) — ใช้ trip จาก sessionStorage
  // ถ้ามี ?checkIn ใน URL (search bar / direct link) — ใช้ค่านั้น
  // ที่เหลือ fallback ไปที่ initial
  const cameFromRooms = Boolean(preAddRoomId);
  const sessionTrip = typeof window !== "undefined" ? readTripState() : null;

  const resolvedCheckIn = (function () {
    if (cameFromRooms && sessionTrip) return sessionTrip.checkIn;
    if (cameFromRooms) return initialCheckIn;
    if (queryCheckIn) return queryCheckIn;
    if (sessionTrip) return sessionTrip.checkIn;
    return initialCheckIn;
  })();
  const resolvedCheckOut = (function () {
    if (cameFromRooms && sessionTrip) return sessionTrip.checkOut;
    if (cameFromRooms) return initialCheckOut;
    if (queryCheckOut) return queryCheckOut;
    if (sessionTrip) return sessionTrip.checkOut;
    return initialCheckOut;
  })();
  const resolvedAdults = (function () {
    const n = Number(queryAdults);
    if (cameFromRooms && sessionTrip) return sessionTrip.adults;
    if (cameFromRooms) return initialAdults;
    if (Number.isFinite(n) && n > 0) return n;
    if (sessionTrip) return sessionTrip.adults;
    return initialAdults;
  })();
  const resolvedChildren = (function () {
    const n = Number(queryChildren);
    if (cameFromRooms && sessionTrip) return sessionTrip.children;
    if (cameFromRooms) return initialChildren;
    if (Number.isFinite(n) && n >= 0) return n;
    if (sessionTrip) return sessionTrip.children;
    return initialChildren;
  })();

  const cart = useBookingCart();
  const addRoomToCart = cart.addRoom;
  const syncCartSnapshots = cart.syncSnapshots;
  const [directOriginRoomId] = useState(preAddRoomId);
  const isDirectRoomBooking = Boolean(directOriginRoomId);
  const [directRoomItem, setDirectRoomItem] = useState<{ room: RoomTypeDisplay; quantity: number } | null>(null);

  // เริ่มที่ step 0 เป็น default — ยกเว้น user มาจาก /rooms/[id] (?addRoom=) หรือ legacy ?room=
  // ให้ข้าม cart ไป step 1 (กรอกข้อมูลผู้เข้าพัก) ทันที
  const [step, setStep] = useState(function () {
    if (preAddRoomId || preselectedRoomLegacy) return 1;
    return 0;
  });

  // safety: ถ้าตะกร้าว่างแต่ดันอยู่ที่ step 1/2 ให้กลับไป step 0
  // ข้ามไว้ถ้ายังมี deeplink (?addRoom / ?room) ที่ยังไม่ถูก consume
  // ป้องกัน race condition: cart hydrate ก่อน addRoom effect ทำงาน
  useEffect(
    function () {
      if (!cart.isHydrated) return;
      if (isDirectRoomBooking || preAddRoomId || preselectedRoomLegacy) return;
      if ((step === 1 || step === 2) && cart.items.length === 0) {
        window.setTimeout(function () {
          setStep(0);
        }, 0);
      }
    },
    [cart.isHydrated, cart.items.length, isDirectRoomBooking, step, preAddRoomId, preselectedRoomLegacy]
  );
  const [roomTypes, setRoomTypes] = useState<RoomTypeDisplay[]>(initialRoomTypes);
  const [isSearching, setIsSearching] = useState(false);
  const [checkIn, setCheckIn] = useState(resolvedCheckIn);
  const [checkOut, setCheckOut] = useState(resolvedCheckOut);
  const [adults, setAdults] = useState(resolvedAdults);
  const [children, setChildren] = useState(resolvedChildren);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [confirmedRooms, setConfirmedRooms] = useState<RoomTypeDisplay[]>([]);
  const [confirmedTotalAmount, setConfirmedTotalAmount] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  // sync trip state ลง sessionStorage ทุกครั้งที่ checkIn/checkOut/guests เปลี่ยน
  // เพื่อให้กลับมาจาก /rooms/[id] แล้วค่ายังอยู่ (ไม่ต้องส่งกลับผ่าน URL)
  useEffect(
    function () {
      writeTripState({
        checkIn,
        checkOut,
        adults,
        children,
      });
    },
    [checkIn, checkOut, adults, children]
  );

  // เพิ่มห้องที่ระบุใน URL เข้าตะกร้าครั้งเดียวตอน mount (deep link จาก /rooms/[id])
  const consumedAddRoomRef = useRef("");
  useEffect(
    function () {
      if (!cart.isHydrated) return;
      const targetId = preAddRoomId || preselectedRoomLegacy;
      if (!targetId) return;
      const consumeKey = targetId + "|" + String(preAddRoomQty);
      if (consumedAddRoomRef.current === consumeKey) return;
      const room =
        roomTypes.find(function (r) { return r.id === targetId; }) ||
        initialRoomTypes.find(function (r) { return r.id === targetId; });
      if (!room) return;
      consumedAddRoomRef.current = consumeKey;
      // ถ้ามาจาก /rooms/[id] (มี ?addRoom & ?qty) ใช้ qty ที่ส่งมา; legacy ?room ให้ qty=1
      const addQty = preAddRoomId ? preAddRoomQty : 1;
      if (preAddRoomId) {
        window.setTimeout(function () {
          setDirectRoomItem({ room, quantity: addQty });
        }, 0);
      } else {
        addRoomToCart(room, addQty);
      }
      // เคลียร์ query ทั้งหมดเพื่อกัน re-add ตอน refresh และให้ URL สะอาด
      // (trip state อยู่ใน sessionStorage แล้ว — ไม่จำเป็นต้องคงค่าใน URL)
      const next = new URLSearchParams(searchParams.toString());
      next.delete("addRoom");
      next.delete("qty");
      next.delete("room");
      next.delete("checkIn");
      next.delete("checkOut");
      next.delete("adults");
      next.delete("children");
      const nextQs = next.toString();
      router.replace(nextQs ? "/booking?" + nextQs : "/booking", { scroll: false });
    },
    [cart.isHydrated, preAddRoomId, preselectedRoomLegacy, preAddRoomQty, roomTypes, initialRoomTypes, addRoomToCart, router, searchParams]
  );

  function handleAddToCart(room: RoomTypeDisplay) {
    cart.addRoom(room);
  }

  function handleRemoveFromCart(roomTypeId: string) {
    cart.removeRoom(roomTypeId);
  }

  function handleSetQuantity(roomTypeId: string, qty: number) {
    cart.setQuantity(roomTypeId, qty);
  }

  function handleContinueFromCart() {
    if (cart.items.length === 0) return;
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
    const checkoutItems = directRoomItem
      ? [{ roomTypeId: directRoomItem.room.id, quantity: directRoomItem.quantity, snapshot: directRoomItem.room }]
      : cart.items;
    if (checkoutItems.length === 0 || !guestInfo) return;
    setPaymentError("");
    setIsCreatingBooking(true);
    // แตก quantity เป็น roomTypeIds ซ้ำตามจำนวนห้องที่เลือก (1 booking = 1 ห้องจริง)
    const flattenedRoomTypeIds = checkoutItems.flatMap(function (item) {
      return Array(item.quantity).fill(item.roomTypeId) as string[];
    });
    const result = await createWebsiteBookingGroup({
      hotelId,
      roomTypeIds: flattenedRoomTypeIds,
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

    if (!result.success || !result.primaryBookingNumber) {
      setPaymentError(result.error || "ไม่สามารถสร้างการจองได้");
      void refreshRoomTypes({ silent: true });
      return;
    }

    setSlipUrl(uploadedSlipUrl);
    setBookingRef(result.primaryBookingNumber);
    // ขยาย items ตาม quantity เพื่อแสดง 1 ห้อง = 1 บรรทัดในใบยืนยัน
    setConfirmedRooms(
      checkoutItems.flatMap(function (item) {
        return Array(item.quantity).fill(item.snapshot) as RoomTypeDisplay[];
      })
    );
    setConfirmedTotalAmount(result.netAmount ?? null);
    clearGuestInfoDraft();
    if (!directRoomItem) {
      cart.clearCart();
    }
    clearTripState();
    setStep(3);
  }

  function handleBack() {
    if (step === 1 && isDirectRoomBooking && directOriginRoomId) {
      router.push("/rooms/" + directOriginRoomId);
      return;
    }
    if (step > 0) setStep(step - 1);
  }

  const totalNights = calculateNights(checkIn, checkOut);
  const totalGuests = adults + children;

  // ขยาย cart items ตาม quantity เป็น array แบนสำหรับแสดงผลใน summary และ confirm
  const activeBookingItems = useMemo(
    function () {
      if (directRoomItem) {
        return [
          {
            roomTypeId: directRoomItem.room.id,
            quantity: directRoomItem.quantity,
            snapshot: directRoomItem.room,
          },
        ];
      }
      return cart.items;
    },
    [cart.items, directRoomItem]
  );

  const expandedRooms = useMemo(
    function () {
      return activeBookingItems.flatMap(function (item) {
        return Array(Math.max(1, item.quantity)).fill(item.snapshot) as RoomTypeDisplay[];
      });
    },
    [activeBookingItems]
  );

  // ราคารวมตะกร้า (subtotal ก่อนส่วนลด) — ใช้สำหรับ summary ใน step 1/2
  const cartSubtotal = useMemo(
    function () {
      return calculateBookingRoomsTotal(expandedRooms, totalNights, totalGuests);
    },
    [expandedRooms, totalGuests, totalNights]
  );
  const isBookingSelectionReady = isDirectRoomBooking ? Boolean(directRoomItem) : cart.isHydrated;

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
      if (!isDirectRoomBooking) {
        syncCartSnapshots(nextRoomTypes);
      }

      if (!options?.silent) {
        setIsSearching(false);
      }
    },
    [adults, canSearch, checkIn, checkOut, children, hotelId, isDirectRoomBooking, syncCartSnapshots]
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

      {!isBookingSelectionReady && (
        <div className="rounded-3xl border border-stone/40 bg-white/70 p-12 text-center text-earth shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3">
            <svg
              className="animate-spin text-gold"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium">{labels.header.loading}</span>
          </div>
        </div>
      )}

      {!isDirectRoomBooking && cart.isHydrated && step === 0 && (
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
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onSetQuantity={handleSetQuantity}
          onContinue={handleContinueFromCart}
          cartItems={cart.items}
          labels={labels}
        />
      )}

      {isBookingSelectionReady && step === 1 && activeBookingItems.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <StepGuestInfo
            rooms={expandedRooms}
            checkIn={checkIn}
            checkOut={checkOut}
            totalNights={totalNights}
            adults={adults}
            childrenCount={children}
            initialInfo={guestInfo}
            cartSubtotal={cartSubtotal}
            onSubmit={handleGuestSubmit}
            onBack={handleBack}
            labels={labels}
          />
        </div>
      )}

      {isBookingSelectionReady && step === 2 && activeBookingItems.length > 0 && guestInfo && (
        <div className="mx-auto max-w-4xl">
          <StepPayment
            hotelId={hotelId}
            rooms={expandedRooms}
            checkIn={checkIn}
            checkOut={checkOut}
            totalNights={totalNights}
            adults={adults}
            childrenCount={children}
            guest={guestInfo}
            cartSubtotal={cartSubtotal}
            onConfirm={handlePaymentConfirm}
            onBack={handleBack}
            labels={labels}
            error={paymentError}
            isConfirming={isCreatingBooking}
          />
        </div>
      )}

      {isBookingSelectionReady && step === 3 && confirmedRooms.length > 0 && guestInfo && (
        <div className="mx-auto max-w-4xl">
          <StepConfirmation
            rooms={confirmedRooms}
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
