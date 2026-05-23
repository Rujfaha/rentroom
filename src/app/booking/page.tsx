import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import LoadingLink from "@/components/ui/LoadingLink";
import BookingFlow from "@/components/booking/BookingFlow";
import { getBookingPageData } from "@/app/actions/booking";
import {
  BOOKING_LOCALE_COOKIE,
  bookingMessages,
  getBookingLocale,
  isBookingLocale,
  type BookingLocale,
} from "@/components/booking/booking-i18n";
import { buildHotelMetadata } from "@/lib/seo";
import { getHotelConfig } from "@/services/mock-data";

const hotel = getHotelConfig();

interface BookingMetadataHotelRow {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  sub_district: string | null;
  postal_code: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  settings: Record<string, unknown> | null;
}

interface BookingMetadataRoomRow {
  name: string | null;
  description: string | null;
  base_price: number | string | null;
}

export async function generateMetadata() {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select(
      "id, name, description, address, province, district, sub_district, postal_code, logo_url, cover_image_url, settings"
    )
    .eq("is_active", true)
    .limit(1)
    .single();
  const hotelRow = hotelData as unknown as BookingMetadataHotelRow | null;
  const { data: roomsData } = hotelRow?.id
    ? await supabase
        .from("room_types")
        .select("name, description, base_price")
        .eq("hotel_id", hotelRow.id)
        .eq("is_active", true)
        .limit(8)
    : { data: [] };
  const rooms = (roomsData ?? []) as unknown as BookingMetadataRoomRow[];

  return buildHotelMetadata({
    hotel: hotelRow,
    rooms,
    pathname: "/booking",
    pageTitle: `จองห้องพัก - ${hotelRow?.name || hotel.name}`,
    pageDescription: `จองห้องพักออนไลน์สำหรับ ${hotelRow?.name || hotel.name} ดูห้องว่าง ราคา และยืนยันการจองได้สะดวก`,
  });
}

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

  // เลือกภาษาตามลำดับความสำคัญ: query string > cookie > default(th)
  const langParam = firstParam(params.lang);
  let locale: BookingLocale;
  if (langParam) {
    locale = getBookingLocale(langParam);
  } else {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get(BOOKING_LOCALE_COOKIE)?.value;
    locale = isBookingLocale(cookieLang) ? cookieLang : "th";
  }
  const labels = bookingMessages[locale];
  const bookingData = await getBookingPageData(checkIn, checkOut, adults, children);
  const displayHotelName = bookingData.hotel?.name || hotel.name;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-[#fbf7ec] to-white">
      <header className="sticky top-0 z-30 border-b h-16 sm:h-20 border-white/40 bg-forest-dark/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Mobile back button */}
            <LoadingLink
              href="/"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-stone-light transition-colors hover:border-gold/60 hover:text-gold sm:hidden"
              loadingLabel="กำลังกลับหน้าแรก..."
              aria-label={labels.header.backHome}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </LoadingLink>

            <Link
              href="/"
              className="truncate font-[family-name:var(--font-serif)] text-lg font-bold tracking-wider text-white sm:text-2xl"
            >
              {displayHotelName}
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex rounded-full border border-white/20 bg-white/10 p-1 text-xs font-semibold">
              <Link
                href={buildLanguageHref(params, "th")}
                className={
                  "rounded-full px-3 py-1 transition-colors " +
                  (locale === "th" ? "bg-gold text-white" : "text-stone-light hover:text-white")
                }
              >
                TH
              </Link>
              <Link
                href={buildLanguageHref(params, "en")}
                className={
                  "rounded-full px-3 py-1 transition-colors " +
                  (locale === "en" ? "bg-gold text-white" : "text-stone-light hover:text-white")
                }
              >
                ENG
              </Link>
            </div>

            <LoadingLink
              href="/"
              className="group hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-stone-light backdrop-blur-sm transition-all duration-200 hover:border-gold/50 hover:bg-gold/10 hover:text-gold sm:inline-flex whitespace-nowrap flex-shrink-0"
              loadingLabel="กำลังกลับหน้าแรก..."
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:-translate-x-0.5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              {labels.header.backHome}
            </LoadingLink>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-[family-name:var(--font-serif)] text-3xl font-bold leading-tight text-forest-dark sm:text-4xl md:text-5xl">
            {labels.header.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-earth sm:text-base">
            {labels.header.subtitle}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="rounded-3xl border border-stone/40 bg-white/70 p-12 text-center text-earth shadow-sm">
              {labels.header.loading}
            </div>
          }
        >
          <BookingFlow
            hotelId={bookingData.hotel?.id || ""}
            hotelName={displayHotelName}
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
