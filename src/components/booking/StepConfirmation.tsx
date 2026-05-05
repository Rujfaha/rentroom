import Link from "next/link";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";

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
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepConfirmation(props: StepConfirmationProps) {
  const totalAmount = props.room.basePrice * props.totalNights;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forest">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-serif)] text-3xl font-bold text-forest-dark">
          Booking Confirmed!
        </h2>
        <p className="mt-2 text-earth">
          Thank you for choosing Valley Retreat
        </p>

        <div className="mt-6 bg-cream rounded-xl p-4 inline-block">
          <p className="text-xs text-earth uppercase tracking-wider">Booking Reference</p>
          <p className="text-2xl font-bold text-gold tracking-widest mt-1">{props.bookingRef}</p>
        </div>

        <div className="mt-8 text-left">
          <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4">Booking Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-earth">Room</span>
              <span className="font-medium text-forest-dark">{props.room.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Check-in</span>
              <span className="font-medium text-forest-dark">{props.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Check-out</span>
              <span className="font-medium text-forest-dark">{props.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Duration</span>
              <span className="font-medium text-forest-dark">{String(props.totalNights) + " night(s)"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Guests</span>
              <span className="font-medium text-forest-dark">{String(props.adults) + " Adults, " + String(props.childrenCount) + " Children"}</span>
            </div>
          </div>

          <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4 mt-6">Guest Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-earth">Name</span>
              <span className="font-medium text-forest-dark">{props.guest.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Phone</span>
              <span className="font-medium text-forest-dark">{props.guest.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth">Email</span>
              <span className="font-medium text-forest-dark">{props.guest.email}</span>
            </div>
            {props.guest.specialRequests && (
              <div className="flex justify-between">
                <span className="text-earth">Requests</span>
                <span className="font-medium text-forest-dark text-right max-w-[60%]">{props.guest.specialRequests}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gold/30">
            <div className="flex justify-between text-lg font-bold text-forest-dark">
              <span>Total Amount</span>
              <span className="text-gold">{"THB " + formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>

        {props.slipUrl && (
          <div className="mt-6 text-left">
            <h3 className="font-semibold text-forest-dark border-b border-stone-light pb-2 mb-4">Payment</h3>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
              <span className="text-sm text-earth">Payment slip submitted — awaiting verification</span>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-champagne/50 rounded-xl text-sm text-earth">
          <p>A confirmation email will be sent to <strong>{props.guest.email}</strong></p>
          <p className="mt-1">Please save your booking reference for check-in.</p>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-block px-8 py-3 bg-forest text-white rounded-lg hover:bg-forest-light transition-colors font-semibold cursor-pointer text-center">
            Back to Home
          </Link>
          <Link href="/check-booking" className="inline-block px-8 py-3 border-2 border-gold text-gold rounded-lg hover:bg-gold hover:text-white transition-colors font-semibold cursor-pointer text-center">
            Check Booking Status
          </Link>
        </div>
      </div>
    </div>
  );
}
