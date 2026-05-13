import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import SearchBar from "@/components/sections/SearchBar";
import StaahSearchCalendarFix from "@/components/sections/StaahSearchCalendarFix";
import RoomTypesSection from "@/components/sections/RoomTypesSection";
import PromotionsSection from "@/components/sections/PromotionsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/sections/Footer";
import { getLandingPageData } from "@/services/mock-data";
import { getRoomTypesForLanding } from "@/app/actions/landing";
import RealtimeRoomSync from "@/components/realtime/RealtimeRoomSync";
import type { HeroSlide, ContactInfo, LocalAttraction, Promotion, RoomTypeDisplay } from "@/types/landing.types";
import { buildHotelJsonLd, buildHotelMetadata } from "@/lib/seo";

interface LandingHotelRow {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  sub_district: string | null;
  postal_code: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  settings: Record<string, unknown> | null;
}

interface LandingRoomSeoRow {
  name: string | null;
  description: string | null;
  base_price: number | string | null;
}

interface LandingHeroImageRow {
  image_url: string | null;
  alt_text: string | null;
}

interface LandingHeroSlideRow extends LandingHeroImageRow {
  id: string;
  headline: string | null;
  subheadline: string | null;
  sort_order: number | null;
}

interface LandingContactRow {
  id: string;
  contact_type: string | null;
  label: string | null;
  value: string;
  icon_url: string | null;
  sort_order: number | null;
}

function isContactType(value: string | null): value is ContactInfo["type"] {
  return value === "phone" ||
    value === "email" ||
    value === "facebook" ||
    value === "line" ||
    value === "instagram" ||
    value === "website" ||
    value === "map_url";
}

interface LandingPromotionRow {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  discount_percentage: number | string | null;
  discount_code: string | null;
  discount_text: string | null;
  valid_until: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

interface LandingAttractionRow {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  distance_km: number | string | null;
  map_url: string | null;
  sort_order: number | null;
}

const sanitizeImageUrl = (url: unknown) => {
  if (!url || typeof url !== "string") return "/placeholder-room.jpg";
  const trimmed = url.trim();
  if (!trimmed) return "/placeholder-room.jpg";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

export const revalidate = 120;

export async function generateMetadata() {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  const { data: hotelData } = await supabase
    .from("hotels")
    .select("id, name, description, address, province, district, sub_district, postal_code, latitude, longitude, logo_url, cover_image_url, phone, email, settings")
    .limit(1)
    .single();
  const hotelRow = hotelData as unknown as LandingHotelRow | null;

  if (!hotelRow?.id) return buildHotelMetadata({ hotel: hotelRow, pathname: "/" });

  const [{ data: roomsData }, { data: imagesData }] = await Promise.all([
    supabase
      .from("room_types")
      .select("name, description, base_price")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .limit(8),
    supabase
      .from("hero_slides")
      .select("image_url, alt_text")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3),
  ]);
  const rooms = (roomsData ?? []) as unknown as LandingRoomSeoRow[];
  const images = (imagesData ?? []) as unknown as LandingHeroImageRow[];

  return buildHotelMetadata({
    hotel: hotelRow,
    rooms: rooms ?? [],
    images: images ?? [],
    pathname: "/",
  });
}

export default async function Home() {
  const mockData = getLandingPageData();
  const hotel = mockData.hotel;

  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  // --- Fetch hotel settings (first hotel) ---
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("id, name, description, address, province, district, sub_district, postal_code, latitude, longitude, logo_url, cover_image_url, phone, email, settings")
    .limit(1)
    .single();
  const hotelRow = hotelData as unknown as LandingHotelRow | null;

  const hotelName = hotelRow?.name || hotel.name;
  const hotelDescription = hotelRow?.description || hotel.description;
  const hotelAddress = hotelRow?.address || hotel.address;
  let hotelMapUrl = "";

  // --- Fetch hero slides from CMS ---
  let heroSlides: HeroSlide[] = mockData.heroSlides;
  let contacts: ContactInfo[] = mockData.contacts;
  let roomTypes: RoomTypeDisplay[] = mockData.roomTypes;
  let promotions: Promotion[] = mockData.promotions;
  let attractions: LocalAttraction[] = mockData.attractions;

  if (hotelRow?.id) {
    const [
      { data: dbSlidesData },
      { data: dbContactsData },
      { data: dbPromotionsData },
      { data: dbAttractionsData },
      dbRoomTypes,
    ] = await Promise.all([
      supabase
        .from("hero_slides")
        .select("id, image_url, alt_text, headline, subheadline, sort_order")
        .eq("hotel_id", hotelRow.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("cms_hotel_contacts")
        .select("id, contact_type, label, value, icon_url, sort_order")
        .eq("hotel_id", hotelRow.id)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("promotions")
        .select("id, title, description, image_url, discount_type, discount_percentage, discount_amount, discount_code, discount_text, valid_until, is_active, sort_order")
        .eq("hotel_id", hotelRow.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("local_attractions")
        .select("id, name, description, image_url, distance_km, map_url, sort_order")
        .eq("hotel_id", hotelRow.id)
        .eq("is_visible", true)
        .order("sort_order", { ascending: true }),
      getRoomTypesForLanding(hotelRow.id),
    ]);
    const dbSlides = dbSlidesData as unknown as LandingHeroSlideRow[] | null;
    const dbContacts = dbContactsData as unknown as LandingContactRow[] | null;
    const dbPromotions = dbPromotionsData as unknown as LandingPromotionRow[] | null;
    const dbAttractions = dbAttractionsData as unknown as LandingAttractionRow[] | null;

    if (dbSlides) {
      heroSlides = dbSlides.map((s) => ({
        id: s.id,
        imageUrl: sanitizeImageUrl(s.image_url),
        altText: s.alt_text || s.headline || "",
        headline: s.headline || "",
        subheadline: s.subheadline || "",
        sortOrder: s.sort_order || 0,
      }));
    }

    // --- Fetch contacts from CMS ---
    if (dbContacts) {
      const mapContact = dbContacts.find((c) => c.contact_type === "map_url");
      if (mapContact) {
        hotelMapUrl = mapContact.value;
      }

      contacts = dbContacts
        .flatMap((c) => {
          if (c.contact_type === "map_url" || !isContactType(c.contact_type)) return [];
          return [{
            id: c.id,
            type: c.contact_type,
            label: c.label || c.contact_type,
            value: c.value,
            iconUrl: c.icon_url,
            sortOrder: c.sort_order || 0,
          }];
        });
    }

    // --- Fetch promotions from CMS ---
    if (dbPromotions) {
      promotions = dbPromotions.map((promo) => ({
        id: promo.id,
        title: promo.title || "",
        description: promo.description || "",
        imageUrl: sanitizeImageUrl(promo.image_url),
        discountPercentage: promo.discount_percentage === null ? null : Number(promo.discount_percentage),
        discountCode: promo.discount_code || null,
        discountText: promo.discount_text || null,
        validUntil: promo.valid_until || "",
        isActive: Boolean(promo.is_active),
        sortOrder: promo.sort_order || 0,
      }));
    }

    // --- Fetch local attractions from CMS ---
    if (dbAttractions) {
      attractions = dbAttractions.map((attraction) => ({
        id: attraction.id,
        name: attraction.name || "",
        description: attraction.description || "",
        imageUrl: sanitizeImageUrl(attraction.image_url),
        distanceKm: Number(attraction.distance_km) || 0,
        mapUrl: attraction.map_url || null,
        sortOrder: attraction.sort_order || 0,
      }));
    }

    // --- Fetch room types from database ---
    if (dbRoomTypes) {
      roomTypes = dbRoomTypes;
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildHotelJsonLd({
              hotel: hotelRow,
              rooms: roomTypes.map((room) => ({
                name: room.name,
                description: room.description,
                base_price: room.basePrice,
              })),
              images: heroSlides.map((slide) => ({
                image_url: slide.imageUrl,
                alt_text: slide.altText,
              })),
            })
          ),
        }}
      />
      {hotelRow?.id && <RealtimeRoomSync hotelId={hotelRow.id} />}
      <Navbar hotelName={hotelName} navLinks={hotel.navLinks} />
      <HeroSection slides={heroSlides} />
      <SearchBar labels={hotel.searchBarLabels} />
      <StaahSearchCalendarFix />
      <RoomTypesSection initialRoomTypes={roomTypes} hotelId={hotelRow?.id || ""} />
      <PromotionsSection promotions={promotions} />
      <AboutSection hotelName={hotelName} description={hotelDescription} attractions={attractions} />
      <ContactSection contacts={contacts} address={hotelAddress} mapUrl={hotelMapUrl} />
      <Footer hotelName={hotelName} navLinks={hotel.navLinks} config={hotel.footerConfig} />
    </>
  );
}
