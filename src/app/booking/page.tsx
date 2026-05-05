import { Suspense } from "react";
import BookingFlow from "@/components/booking/BookingFlow";
import Link from "next/link";
import { getHotelConfig } from "@/services/mock-data";

const hotel = getHotelConfig();

export const metadata = {
  title: "Book Your Stay - " + hotel.name,
  description: "Reserve your luxury mountain retreat experience",
};

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest-dark py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-2xl font-bold text-white tracking-wider cursor-pointer">
            {hotel.name}
          </Link>
          <Link href="/" className="text-sm text-stone-light hover:text-gold transition-colors cursor-pointer">
            Back to Home
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-bold text-forest-dark text-center mb-2">
          Book Your Stay
        </h1>
        <p className="text-earth text-center mb-10">
          Complete the steps below to reserve your room
        </p>
        <Suspense fallback={<div className="text-center text-earth py-12">Loading booking...</div>}>
          <BookingFlow />
        </Suspense>
      </main>
    </div>
  );
}
