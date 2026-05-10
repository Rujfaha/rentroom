import Link from "next/link";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";

interface StepConfirmationProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  guest: GuestInfo;
  bookingRef: string;
  slipUrl?: string;
  labels: BookingLabels;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepConfirmation(props: StepConfirmationProps) {
  const labels = props.labels.confirmation;
  const totalAmount = props.room.stayTotal ?? props.room.basePrice * props.totalNights;

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
            <div className="flex justify-between">
              <span className="text-earth">{labels.room}</span>
              <span className="font-medium text-forest-dark">{props.room.name}</span>
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

          <div className="mt-6 pt-4 border-t-2 border-gold/30">
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
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-block px-8 py-3 bg-forest text-white rounded-lg hover:bg-forest-light transition-colors font-semibold cursor-pointer text-center">
            {labels.backHome}
          </Link>
          <Link href="/check-booking" className="inline-block px-8 py-3 border-2 border-gold text-gold rounded-lg hover:bg-gold hover:text-white transition-colors font-semibold cursor-pointer text-center">
            {labels.checkStatus}
          </Link>
        </div>
      </div>
    </div>
  );
}
