import Link from "next/link";
import Script from "next/script";
import LoadingLink from "@/components/ui/LoadingLink";
import { bookingMessages, getBookingLocale, type BookingLocale } from "@/components/booking/booking-i18n";
import { buildHotelMetadata } from "@/lib/seo";
import { getHotelConfig } from "@/services/mock-data";

const hotel = getHotelConfig();
const staahPropertyId = "823NTUMiMyoYlz445M9jdJttEoLgrHIoGzsfYoMomu2V7D84NTY=";
const staahWidgetId = "quickbook-widget-" + staahPropertyId + "-" + staahPropertyId;
const staahBookingUrl =
  "https://www.swiftbook.io/inst/#/home?propertyId=" +
  staahPropertyId +
  "&JDRN=Y&ap=1&gsId=" +
  staahPropertyId;
const staahWidgetScriptUrl =
  "https://www.swiftbook.io/cwplugin/displaywidget/preview/booking-service.min.js?propertyId=" +
  staahPropertyId +
  "&scriptId=" +
  staahPropertyId;

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
    .select("id, name, description, address, province, district, sub_district, postal_code, logo_url, cover_image_url, settings")
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
  const locale = getBookingLocale(firstParam(params.lang));
  const labels = bookingMessages[locale];
  const displayHotelName = hotel.name;

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
            <LoadingLink href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-light hover:text-gold transition-colors cursor-pointer" loadingLabel="กำลังกลับหน้าแรก...">
              {labels.header.backHome}
            </LoadingLink>
          </div>
        </div>
      </header>
      <main className="relative z-30 max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-bold text-forest-dark text-center mb-2">
          {labels.header.title}
        </h1>
        <p className="text-earth text-center mb-10">
          {labels.header.subtitle}
        </p>
        <section className="relative z-40 min-h-80 overflow-visible rounded-2xl bg-white p-4 shadow-md md:p-6">
          <div id={staahWidgetId} className="Configure-quickBook-Widget relative z-50 min-h-56 overflow-visible" />
          <div className="relative z-0 mt-8 flex justify-center">
            <a
              href={staahBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
            >
              {locale === "th" ? "เปิดหน้าจองห้องพัก" : "Open booking engine"}
            </a>
          </div>
        </section>
        <Script id="propInfo" src={staahWidgetScriptUrl} strategy="afterInteractive" />
      </main>
    </div>
  );
}
