import { Suspense } from "react";
import BookingFlow from "@/components/booking/BookingFlow";
import Link from "next/link";
import { getHotelConfig } from "@/services/mock-data";
import { getBookingPageData } from "@/app/actions/booking";
import { bookingMessages, getBookingLocale, type BookingLocale } from "@/components/booking/booking-i18n";

const hotel = getHotelConfig();

export const metadata = {
  title: "Book Your Stay - " + hotel.name,
  description: "Reserve your luxury mountain retreat experience",
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildLanguageHref(
  params: Record<string, string | string[] | undefined>,
  locale: BookingLocale
): string {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => nextParams.append(key, item));
      return;
    }
    nextParams.set(key, value);
  });

  nextParams.set("lang", locale);
  return "/booking?" + nextParams.toString();
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const checkIn = firstParam(params.checkIn) || formatDate(today);
  const checkOut = firstParam(params.checkOut) || formatDate(tomorrow);
  const adults = Number(firstParam(params.adults)) || 2;
  const children = Number(firstParam(params.children)) || 0;
  const locale = getBookingLocale(firstParam(params.lang));
  const labels = bookingMessages[locale];
  const bookingData = await getBookingPageData(checkIn, checkOut, adults, children);
  const displayHotelName = bookingData.hotel?.name || hotel.name;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest-dark py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="font-[family-name:var(--font-serif)] text-2xl font-bold text-white tracking-wider cursor-pointer">
            {displayHotelName}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-white/20 bg-white/10 p-1 text-xs font-semibold">
              <Link
                href={buildLanguageHref(params, "th")}
                className={"rounded-full px-3 py-1 transition-colors " + (locale === "th" ? "bg-gold text-white" : "text-stone-light hover:text-white")}
              >
                TH
              </Link>
              <Link
                href={buildLanguageHref(params, "en")}
                className={"rounded-full px-3 py-1 transition-colors " + (locale === "en" ? "bg-gold text-white" : "text-stone-light hover:text-white")}
              >
                ENG
              </Link>
            </div>
            <Link href="/" className="text-sm text-stone-light hover:text-gold transition-colors cursor-pointer">
              {labels.header.backHome}
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-bold text-forest-dark text-center mb-2">
          {labels.header.title}
        </h1>
        <p className="text-earth text-center mb-10">
          {labels.header.subtitle}
        </p>
        <Suspense fallback={<div className="text-center text-earth py-12">{labels.header.loading}</div>}>
          <BookingFlow
            hotelId={bookingData.hotel?.id || ""}
            initialRoomTypes={bookingData.roomTypes}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialAdults={adults}
            initialChildren={children}
            locale={locale}
          />
        </Suspense>
      </main>
    </div>
  );
}
