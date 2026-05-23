"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";
import LoadingLink from "@/components/ui/LoadingLink";
import { downloadBookingReceipt, type BookingReceiptData } from "@/lib/booking/receipt";

interface StepConfirmationProps {
  rooms: RoomTypeDisplay[];
  hotelName: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  guest: GuestInfo;
  bookingRef: string;
  slipUrl?: string;
  totalAmount?: number;
  labels: BookingLabels;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepConfirmation(props: StepConfirmationProps) {
  const room = props.rooms[0];
  const labels = props.labels.confirmation;
  const totalAmount = props.totalAmount ?? room.stayTotal ?? room.basePrice * props.totalNights;
  const totalGuests = props.adults + props.childrenCount;
  const standardMax = room.maxGuests || 2;
  const extraGuests = Math.max(0, totalGuests - standardMax);
  const extraBedPrice = room.extraBedPrice || 0;
  const extraBedTotal = extraGuests * extraBedPrice * props.totalNights;
  const baseRoomTotal = room.basePrice * props.totalNights;
  const hasDownloadedRef = useRef(false);
  const receiptLabels = props.labels.locale === "th"
    ? {
        download: "ดาวน์โหลดใบจอง",
        downloadedHint: "ระบบจะดาวน์โหลดใบจองให้อัตโนมัติ หากไม่พบไฟล์สามารถกดดาวน์โหลดอีกครั้งได้",
      }
    : {
        download: "Download Receipt",
        downloadedHint: "Your receipt will download automatically. If you do not see it, you can download it again.",
      };
  const receiptData = useMemo<BookingReceiptData>(function () {
    const combinedRoomName = props.rooms.map(function (r) { return r.name; }).join(", ");
    return {
      bookingRef: props.bookingRef,
      hotelName: props.hotelName,
      roomName: combinedRoomName || room.name,
      checkIn: props.checkIn,
      checkOut: props.checkOut,
      totalNights: props.totalNights,
      adults: props.adults,
      childrenCount: props.childrenCount,
      guestName: props.guest.fullName,
      guestPhone: props.guest.phone,
      guestEmail: props.guest.email,
      specialRequests: props.guest.specialRequests,
      totalAmount,
      slipSubmitted: Boolean(props.slipUrl),
      locale: props.labels.locale,
      createdAt: new Date(),
      basePrice: room.basePrice,
      extraBedPrice: room.extraBedPrice,
      maxGuests: room.maxGuests,
      checkBookingUrl: typeof window === "undefined" ? "/check-booking" : window.location.origin + "/check-booking",
    };
  }, [
    props.adults,
    props.bookingRef,
    props.checkIn,
    props.checkOut,
    props.childrenCount,
    props.guest.email,
    props.guest.fullName,
    props.guest.phone,
    props.guest.specialRequests,
    props.hotelName,
    props.labels.locale,
    props.rooms,
    room,
    props.slipUrl,
    props.totalNights,
    totalAmount,
  ]);

  useEffect(function () {
    if (!props.bookingRef || hasDownloadedRef.current) return;
    hasDownloadedRef.current = true;
    downloadBookingReceipt(receiptData);
  }, [props.bookingRef, receiptData]);

  function handleDownloadReceipt() {
    downloadBookingReceipt(receiptData);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-forest-dark">
          {labels.title}
        </h2>
        <p className="mt-2 text-earth">{labels.subtitle}</p>

        <div className="mt-6 bg-cream rounded-xl p-4 inline-block">
          <p className="text-xs text-earth uppercase tracking-wider">{labels.reference}</p>
          <p className="text-2xl font-bold text-gold tracking-widest mt-1">{props.bookingRef}</p>
        </div>

        <div className="mt-8 text-left">
          <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4">{labels.bookingDetails}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-earth flex-shrink-0">{labels.room}</span>
              <div className="flex-1 min-w-0 text-right">
                {props.rooms.length === 1 ? (
                  <span className="font-medium text-forest-dark">{props.rooms[0].name}</span>
                ) : (
                  <ul className="space-y-1">
                    {props.rooms.map(function (r, i) {
                      return (
                        <li key={r.id + "-" + String(i)} className="font-medium text-forest-dark">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gold/15 text-gold-dark text-[10px] font-bold mr-1.5 align-middle">
                            {String(i + 1)}
                          </span>
                          {r.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{props.labels.shared.checkIn}</span>
              <span className="font-medium text-forest-dark">{props.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{props.labels.shared.checkOut}</span>
              <span className="font-medium text-forest-dark">{props.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{labels.duration}</span>
              <span className="font-medium text-forest-dark">{props.labels.guestInfo.nights(props.totalNights)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{labels.guests}</span>
              <span className="font-medium text-forest-dark">{props.labels.guestInfo.guestCount(props.adults, props.childrenCount)}</span>
            </div>
          </div>

          <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4 mt-6">{labels.guestInfo}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-earth">{labels.name}</span>
              <span className="font-medium text-forest-dark">{props.guest.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{labels.phone}</span>
              <span className="font-medium text-forest-dark">{props.guest.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">{labels.email}</span>
              <span className="font-medium text-forest-dark">{props.guest.email}</span>
            </div>
            {props.guest.specialRequests && (
              <div className="flex justify-between">
                <span className="text-earth">{labels.requests}</span>
                <span className="font-medium text-forest-dark text-right max-w-[60%]">{props.guest.specialRequests}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-light">
            {props.rooms.length === 1 ? (
              <>
                <div className="flex justify-between text-sm text-earth">
                  <span>
                    {props.labels.shared.thb +
                      formatPrice(room.basePrice) +
                      " x " +
                      props.labels.guestInfo.nights(props.totalNights)}
                  </span>
                  <span>{props.labels.shared.thb + formatPrice(baseRoomTotal)}</span>
                </div>
                {extraGuests > 0 && extraBedPrice > 0 && (
                  <div className="flex justify-between text-xs text-earth mt-1">
                    <span>{props.labels.locale === "th" ? `เตียงเสริม (${extraGuests} คน) x ${props.totalNights} คืน` : `Extra Bed (${extraGuests} guests) x ${props.totalNights} nights`}</span>
                    <span>{props.labels.shared.thb + formatPrice(extraBedTotal)}</span>
                  </div>
                )}
              </>
            ) : (
              <ul className="space-y-1.5 text-sm text-earth">
                {props.rooms.map(function (r, i) {
                  const stay = r.stayTotal ?? r.basePrice * props.totalNights;
                  return (
                    <li key={r.id + "-" + String(i)} className="flex justify-between gap-3">
                      <span className="truncate">{r.name}</span>
                      <span className="text-forest-dark font-medium whitespace-nowrap">
                        {props.labels.shared.thb + formatPrice(stay)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-4 pt-4 border-t-2 border-gold/30">
            <div className="flex justify-between text-lg font-bold text-forest-dark">
              <span>{labels.totalAmount}</span>
              <span className="text-gold">{props.labels.shared.thb + formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {props.slipUrl && (
          <div className="mt-6 text-left">
            <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4">{labels.payment}</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
              <span className="text-sm text-earth">{labels.slipSubmitted}</span>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-champagne/50 rounded-xl text-sm text-earth">
          <p>{labels.emailNotice(props.guest.email)}</p>
          <p className="mt-1">{labels.saveReference}</p>
          <p className="mt-1">{receiptLabels.downloadedHint}</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark cursor-pointer text-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{receiptLabels.download}</span>
          </button>
          <LoadingLink href="/" className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-forest px-5 text-sm font-semibold text-white transition-colors hover:bg-forest-light cursor-pointer text-center" loadingLabel="กำลังกลับหน้าแรก...">
            {labels.backHome}
          </LoadingLink>
          <Link href="/check-booking" className="inline-flex h-11 w-full sm:w-auto items-center justify-center whitespace-nowrap rounded-lg border-2 border-gold px-5 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-white cursor-pointer text-center">
            {labels.checkStatus}
          </Link>
        </div>
      </div>
    </div>
  );
}
