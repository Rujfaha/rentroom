"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";
import { evaluateBookingPromotion } from "@/app/actions/promotion-engine";
import { calculateBookingRoomTotal } from "@/lib/booking/pricing-summary";

interface StepPaymentProps {
  hotelId: string;
  /** ห้องในตะกร้า — รองรับ multi-room */
  rooms: RoomTypeDisplay[];
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  guest: GuestInfo;
  cartSubtotal: number;
  onConfirm: (slipUrl: string, promotionCode?: string) => void;
  onBack: () => void;
  labels: BookingLabels;
  error?: string;
  isConfirming?: boolean;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepPayment(props: StepPaymentProps) {
  const labels = props.labels.payment;
  const subtotalAmount = props.cartSubtotal;
  const primaryRoom = props.rooms[0];
  const totalGuests = props.adults + props.childrenCount;
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedPromotionCode, setAppliedPromotionCode] = useState<string | undefined>();
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountLabel, setDiscountLabel] = useState("");
  const [discountMessage, setDiscountMessage] = useState("");
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slipPreview, setSlipPreview] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(function () {
    let active = true;
    const primaryId = primaryRoom?.id || "";
    if (!primaryId) return;
    const timeoutId = window.setTimeout(function () {
      setIsCheckingDiscount(true);
      evaluateBookingPromotion({
        hotelId: props.hotelId,
        roomTypeId: primaryId,
        checkInDate: props.checkIn,
        checkOutDate: props.checkOut,
        nights: props.totalNights,
        quantity: props.rooms.length,
        guests: Math.max(1, props.adults + props.childrenCount),
        subtotal: subtotalAmount,
        bookingChannel: "website",
        customer: {
          phone: props.guest.phone,
          email: props.guest.email,
        },
      }).then(function (result) {
        if (!active) return;
        if (result.selectedPromotion) {
          setDiscountAmount(result.discountAmount);
          setDiscountLabel(result.selectedPromotion.promotionName);
          setDiscountMessage("ระบบใช้โปรโมชั่นที่เหมาะสมให้แล้ว");
          setAppliedPromotionCode(undefined);
        } else {
          setDiscountAmount(0);
          setDiscountLabel("");
          setDiscountMessage("");
          setAppliedPromotionCode(undefined);
        }
        setIsCheckingDiscount(false);
      }).catch(function () {
        if (!active) return;
        setIsCheckingDiscount(false);
      });
    }, 0);

    return function () {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    props.adults,
    props.checkIn,
    props.checkOut,
    props.childrenCount,
    props.guest.email,
    props.guest.phone,
    props.hotelId,
    primaryRoom?.id,
    props.rooms.length,
    props.totalNights,
    subtotalAmount,
  ]);

  useEffect(function () {
    const timeoutId = window.setTimeout(function () {
      setLoading(true);
      setError("");
      fetch("/api/promptpay-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount, hotelId: props.hotelId }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.error) {
            setError(data.error);
          } else {
            setQrDataUrl(data.qrDataUrl);
            setAccountName(data.accountName);
            setAccountId(data.accountId);
          }
          setLoading(false);
        })
        .catch(function () {
          setError(labels.qrError);
          setLoading(false);
        });
    }, 0);

    return function () {
      window.clearTimeout(timeoutId);
    };
  }, [labels.qrError, props.hotelId, totalAmount]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = function (ev) {
      setSlipPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleApplyPromotion() {
    const code = promotionCode.trim().toUpperCase();
    if (!code) {
      setDiscountAmount(0);
      setDiscountLabel("");
      setDiscountMessage("กรุณากรอก code ส่วนลด");
      return;
    }

    setIsCheckingDiscount(true);
    const result = await evaluateBookingPromotion({
      hotelId: props.hotelId,
      roomTypeId: primaryRoom?.id || "",
      checkInDate: props.checkIn,
      checkOutDate: props.checkOut,
      nights: props.totalNights,
      quantity: props.rooms.length,
      guests: Math.max(1, props.adults + props.childrenCount),
      subtotal: subtotalAmount,
      bookingChannel: "website",
      promotionCode: code,
      customer: {
        phone: props.guest.phone,
        email: props.guest.email,
      },
    });
    setIsCheckingDiscount(false);

    if (result.valid && result.selectedPromotion) {
      setDiscountAmount(result.discountAmount);
      setDiscountLabel(result.selectedPromotion.promotionName || code);
      setDiscountMessage("ใช้ code ส่วนลดสำเร็จ");
      setAppliedPromotionCode(code);
    } else {
      setDiscountAmount(0);
      setDiscountLabel("");
      setDiscountMessage(result.message || "code ส่วนลดไม่ถูกต้อง");
      setAppliedPromotionCode(undefined);
    }
  }

  async function handleConfirm() {
    if (!slipFile) return;
    setUploadError("");
    setIsUploadingSlip(true);

    const formData = new FormData();
    formData.append("file", slipFile);

    try {
      const response = await fetch("/api/booking/upload-slip", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok || result.error || !result.url) {
        setUploadError(result.error || "Unable to upload payment slip");
        return;
      }

      props.onConfirm(
        result.url,
        appliedPromotionCode
      );
    } catch {
      setUploadError("Unable to upload payment slip");
    } finally {
      setIsUploadingSlip(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-forest-dark text-lg mb-2">{labels.title}</h3>
          <p className="text-sm text-earth mb-6">{labels.subtitle}</p>

          <div className="flex flex-col items-center">
            <div className="mb-6 w-full max-w-sm rounded-xl border border-stone-light bg-cream/50 p-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-earth mb-2">
                Code ส่วนลด
              </label>
              <input
                type="text"
                value={promotionCode}
                onChange={(e) => {
                  setPromotionCode(e.target.value.toUpperCase());
                  setAppliedPromotionCode(undefined);
                  if (discountAmount > 0 && appliedPromotionCode) {
                    setDiscountAmount(0);
                    setDiscountLabel("");
                  }
                  setDiscountMessage("");
                }}
                className="w-full rounded-lg border border-stone bg-white px-3 py-2 text-sm text-forest-dark outline-none transition-colors focus:border-gold"
                placeholder="กรอก code ส่วนลด"
              />
              <button
                type="button"
                onClick={handleApplyPromotion}
                disabled={isCheckingDiscount || !promotionCode.trim()}
                className="mt-3 w-full rounded-lg bg-forest px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:bg-stone"
              >
                {isCheckingDiscount ? "กำลังตรวจสอบ..." : "ใช้ส่วนลด"}
              </button>
              {(discountMessage || isCheckingDiscount) && (
                <p className={"mt-2 text-xs " + (discountAmount > 0 ? "text-forest" : "text-earth-light")}>
                  {isCheckingDiscount ? "กำลังตรวจสอบ code..." : discountMessage}
                </p>
              )}
            </div>

            {loading && (
              <div className="w-64 h-64 bg-stone-light/50 rounded-xl flex items-center justify-center animate-pulse">
                <span className="text-earth text-sm">{labels.generatingQr}</span>
              </div>
            )}

            {error && (
              <div className="w-64 h-64 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            {!loading && !error && qrDataUrl && (
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-gold/30 rounded-2xl p-4 shadow-lg">
                  <Image
                    src={qrDataUrl}
                    alt="PromptPay QR Code"
                    width={280}
                    height={280}
                    unoptimized
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-earth uppercase tracking-wider">{labels.account}</p>
                  <p className="text-forest-dark font-semibold">{accountName}</p>
                  <p className="text-sm text-earth">{accountId}</p>
                </div>
              </div>
            )}

            <div className="mt-6 bg-gold/10 rounded-xl px-6 py-4 text-center w-full max-w-sm">
              <p className="text-xs text-earth uppercase tracking-wider">{labels.amountToPay}</p>
              {discountAmount > 0 && (
                <p className="text-sm text-earth-light line-through mt-1">
                  {props.labels.shared.thb + formatPrice(subtotalAmount)}
                </p>
              )}
              <p className="text-3xl font-bold text-gold mt-1">
                {props.labels.shared.thb + formatPrice(totalAmount)}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-stone-light pt-6">
            <h4 className="font-semibold text-forest-dark mb-3">{labels.uploadTitle}</h4>
            <p className="text-sm text-earth mb-4">{labels.uploadHint}</p>

            {slipPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full max-w-xs h-64 rounded-xl overflow-hidden border-2 border-forest/20">
                  <Image
                    src={slipPreview}
                    alt="Payment slip preview"
                    fill
                    className="object-contain bg-white"
                    unoptimized
                  />
                </div>
                <button
                  onClick={function () {
                    setSlipPreview("");
                    setSlipFile(null);
                    setUploadError("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  {labels.removeSlip}
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-earth mb-2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-earth font-medium">{labels.uploadCta}</span>
                <span className="text-xs text-earth-light mt-1">{labels.uploadTypeHint}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            {(props.error || uploadError) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm w-full">
                {props.error || uploadError}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-3">
            <button
              onClick={props.onBack}
              disabled={props.isConfirming || isUploadingSlip}
              className="px-6 py-3 border-2 border-stone text-earth rounded-lg hover:bg-stone-light/50 transition-colors font-medium cursor-pointer"
            >
              {labels.back}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!slipFile || props.isConfirming || isUploadingSlip}
              className={
                "flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all " +
                (slipFile && !props.isConfirming && !isUploadingSlip
                  ? "bg-gold text-white hover:bg-gold-dark shadow-lg shadow-gold/20 cursor-pointer"
                  : "bg-stone-light text-earth cursor-not-allowed")
              }
            >
              {(isUploadingSlip || props.isConfirming) && (
                <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
              )}
              <span>
                {isUploadingSlip
                  ? "กำลังอัปโหลดสลิป..."
                  : props.isConfirming
                  ? "กำลังบันทึกการจอง..."
                  : labels.confirm}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl p-5 shadow-md sticky top-24">
          <h4 className="font-semibold text-forest-dark mb-3">{labels.summary}</h4>
          {primaryRoom && (
            <div className="relative h-32 rounded-lg overflow-hidden mb-3">
              <Image
                src={primaryRoom.coverImageUrl}
                alt={primaryRoom.name}
                fill
                className="object-cover"
                sizes="300px"
              />
              {props.rooms.length > 1 && (
                <div className="absolute top-2 right-2 rounded-full bg-forest-dark/90 px-2.5 py-1 text-[11px] font-bold text-white">
                  {props.labels.locale === "th"
                    ? "+" + String(props.rooms.length - 1) + " ห้อง"
                    : "+" + String(props.rooms.length - 1) + " more"}
                </div>
              )}
            </div>
          )}
          <ul className="space-y-1.5 mb-3">
            {props.rooms.map(function (room, index) {
              return (
                <li
                  key={room.id + "-" + String(index)}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <span className="font-[family-name:var(--font-serif)] font-semibold text-forest-dark flex-1 min-w-0 truncate">
                    {room.name}
                  </span>
                  <span className="text-forest-dark font-medium whitespace-nowrap">
                    {props.labels.shared.thb +
                      formatPrice(
                        calculateBookingRoomTotal(room, props.totalNights, totalGuests)
                      )}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 space-y-2 text-sm text-earth border-t border-stone-light pt-3">
            <div className="flex justify-between">
              <span>{props.labels.shared.checkIn}</span>
              <span className="font-medium text-forest-dark">{props.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>{props.labels.shared.checkOut}</span>
              <span className="font-medium text-forest-dark">{props.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.guest}</span>
              <span className="font-medium text-forest-dark">{props.guest.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.duration}</span>
              <span className="font-medium text-forest-dark">
                {props.labels.guestInfo.nights(props.totalNights)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-light">
            <div className="flex justify-between text-sm text-earth">
              <span>
                {props.labels.locale === "th"
                  ? "ราคารวม " + String(props.rooms.length) + " ห้อง"
                  : "Subtotal (" + String(props.rooms.length) + " room" + (props.rooms.length === 1 ? "" : "s") + ")"}
              </span>
              <span>{props.labels.shared.thb + formatPrice(subtotalAmount)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between mt-2 text-sm text-forest">
                <span>{"ส่วนลด " + (discountLabel ? "(" + discountLabel + ")" : "")}</span>
                <span>{"-" + props.labels.shared.thb + formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between mt-2 text-lg font-bold text-forest-dark">
              <span>{labels.total}</span>
              <span className="text-gold">{props.labels.shared.thb + formatPrice(totalAmount)}</span>
            </div>
          </div>


          <div className="mt-4 pt-3 border-t border-stone-light">
            <div className="flex items-center gap-2">
              <div className={"w-2.5 h-2.5 rounded-full " + (slipFile ? "bg-forest" : "bg-stone")} />
              <span className="text-xs text-earth">
                {slipFile ? labels.slipReady : labels.slipWaiting}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
