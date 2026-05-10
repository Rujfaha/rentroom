import type { Metadata } from "next";

type SeoSettings = {
  siteName?: string;
  titleTemplate?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImageUrl?: string;
  canonicalBaseUrl?: string;
  allowIndex?: boolean;
  googleSiteVerification?: string;
};

type HotelSeoSource = {
  id?: string;
  name?: string | null;
  description?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  sub_district?: string | null;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  phone?: string | null;
  email?: string | null;
  settings?: Record<string, unknown> | null;
};

type RoomSeoSource = {
  name?: string | null;
  description?: string | null;
  base_price?: number | string | null;
};

type ImageSeoSource = {
  image_url?: string | null;
  alt_text?: string | null;
};

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const DEFAULT_HOTEL_NAME = "Arkkarawin";

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "...";
}

function absoluteUrl(pathOrUrl: string | null | undefined, baseUrl: string): string | undefined {
  const value = cleanText(pathOrUrl);
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return new URL(value, baseUrl).toString();
  return new URL("/" + value, baseUrl).toString();
}

function getSeoSettings(hotel?: HotelSeoSource | null): SeoSettings {
  const settings = hotel?.settings;
  if (!settings || typeof settings !== "object") return {};
  const seo = (settings as Record<string, unknown>).seo;
  return seo && typeof seo === "object" ? (seo as SeoSettings) : {};
}

export function getCanonicalBaseUrl(hotel?: HotelSeoSource | null): string {
  const seo = getSeoSettings(hotel);
  return cleanText(seo.canonicalBaseUrl).replace(/\/+$/, "") || DEFAULT_BASE_URL;
}

export function buildHotelMetadata({
  hotel,
  rooms = [],
  images = [],
  pathname = "/",
  pageTitle,
  pageDescription,
  noIndex = false,
}: {
  hotel?: HotelSeoSource | null;
  rooms?: RoomSeoSource[];
  images?: ImageSeoSource[];
  pathname?: string;
  pageTitle?: string;
  pageDescription?: string;
  noIndex?: boolean;
}): Metadata {
  const seo = getSeoSettings(hotel);
  const baseUrl = getCanonicalBaseUrl(hotel);
  const hotelName = cleanText(hotel?.name) || DEFAULT_HOTEL_NAME;
  const area = [hotel?.sub_district, hotel?.district, hotel?.province].map(cleanText).filter(Boolean).join(", ");
  const roomNames = rooms.map((room) => cleanText(room.name)).filter(Boolean).slice(0, 4);
  const minPrice = rooms
    .map((room) => Number(room.base_price))
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b)[0];

  const generatedTitle = [hotelName, area || "ที่พักและห้องพัก"].filter(Boolean).join(" | ");
  const title = cleanText(pageTitle || seo.metaTitle) || generatedTitle;
  const template = cleanText(seo.titleTemplate) || `%s | ${cleanText(seo.siteName) || hotelName}`;

  const detailParts = [
    cleanText(pageDescription || seo.metaDescription || hotel?.description),
    roomNames.length ? `มีห้องพัก ${roomNames.join(", ")}` : "",
    minPrice ? `ราคาเริ่มต้น ${minPrice.toLocaleString("th-TH")} บาทต่อคืน` : "",
    area ? `ทำเล ${area}` : cleanText(hotel?.address),
  ].filter(Boolean);
  const description = truncate(detailParts.join(" "), 160) || `จองห้องพักและดูข้อมูลที่พัก ${hotelName}`;

  const keywords = cleanText(seo.keywords) || [hotelName, "ที่พัก", "ห้องพัก", "จองที่พัก", ...roomNames, area].filter(Boolean).join(", ");
  const imageUrl = absoluteUrl(seo.ogImageUrl || hotel?.cover_image_url || images[0]?.image_url || hotel?.logo_url, baseUrl);
  const canonical = new URL(pathname, baseUrl).toString();
  const allowIndex = seo.allowIndex !== false && !noIndex;

  return {
    metadataBase: new URL(baseUrl),
    title: { default: title, template },
    description,
    keywords,
    alternates: { canonical },
    robots: allowIndex
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
    openGraph: {
      type: "website",
      locale: "th_TH",
      siteName: cleanText(seo.siteName) || hotelName,
      title,
      description,
      url: canonical,
      images: imageUrl ? [{ url: imageUrl, alt: hotelName }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export function buildHotelJsonLd({
  hotel,
  rooms = [],
  images = [],
}: {
  hotel?: HotelSeoSource | null;
  rooms?: RoomSeoSource[];
  images?: ImageSeoSource[];
}) {
  const baseUrl = getCanonicalBaseUrl(hotel);
  const hotelName = cleanText(hotel?.name) || DEFAULT_HOTEL_NAME;
  const imageUrls = [
    absoluteUrl(hotel?.cover_image_url, baseUrl),
    ...images.map((image) => absoluteUrl(image.image_url, baseUrl)),
  ].filter(Boolean);
  const prices = rooms.map((room) => Number(room.base_price)).filter((price) => Number.isFinite(price) && price > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotelName,
    description: cleanText(hotel?.description) || undefined,
    url: baseUrl,
    telephone: cleanText(hotel?.phone) || undefined,
    email: cleanText(hotel?.email) || undefined,
    image: imageUrls.length ? imageUrls : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: cleanText(hotel?.address) || undefined,
      addressLocality: cleanText(hotel?.district) || undefined,
      addressRegion: cleanText(hotel?.province) || undefined,
      postalCode: cleanText(hotel?.postal_code) || undefined,
      addressCountry: "TH",
    },
    geo:
      hotel?.latitude && hotel?.longitude
        ? { "@type": "GeoCoordinates", latitude: Number(hotel.latitude), longitude: Number(hotel.longitude) }
        : undefined,
    priceRange: prices.length ? `THB ${Math.min(...prices).toLocaleString("th-TH")}+` : undefined,
    makesOffer: rooms.slice(0, 8).map((room) => ({
      "@type": "Offer",
      name: cleanText(room.name),
      description: cleanText(room.description) || undefined,
      price: Number(room.base_price) || undefined,
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
    })),
  };
}
