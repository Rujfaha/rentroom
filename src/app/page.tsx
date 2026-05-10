import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import SearchBar from "@/components/sections/SearchBar";
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

const sanitizeImageUrl = (url: any) => {
  if (!url || typeof url !== "string") return "/placeholder-room.jpg";
  const trimmed = url.trim();
  if (!trimmed) return "/placeholder-room.jpg";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  const { data: hotelRow } = await (supabase
    .from("hotels") as any)
    .select("id, name, description, address, province, district, sub_district, postal_code, latitude, longitude, logo_url, cover_image_url, phone, email, settings")
    .limit(1)
    .single();

  if (!hotelRow?.id) return buildHotelMetadata({ hotel: hotelRow, pathname: "/" });

  const [{ data: rooms }, { data: images }] = await Promise.all([
    (supabase
      .from("room_types") as any)
      .select("name, description, base_price")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .limit(8),
    (supabase
      .from("hero_slides") as any)
      .select("image_url, alt_text")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3),
  ]);

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
  const { data: hotelRow } = await (supabase
    .from("hotels") as any)
    .select("id, name, description, address, province, district, sub_district, postal_code, latitude, longitude, logo_url, cover_image_url, phone, email, settings")
    .limit(1)
    .single();

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
    const { data: dbSlides } = await (supabase
      .from("hero_slides") as any)
      .select("id, image_url, alt_text, headline, subheadline, sort_order")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (dbSlides) {
      heroSlides = dbSlides.map((s: any) => ({
        id: s.id,
        imageUrl: sanitizeImageUrl(s.image_url),
        altText: s.alt_text || s.headline || "",
        headline: s.headline || "",
        subheadline: s.subheadline || "",
        sortOrder: s.sort_order,
      }));
    }

    // --- Fetch contacts from CMS ---
    const { data: dbContacts } = await (supabase
      .from("cms_hotel_contacts") as any)
      .select("id, contact_type, label, value, icon_url, sort_order")
      .eq("hotel_id", hotelRow.id)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (dbContacts) {
      const mapContact = dbContacts.find((c: any) => c.contact_type === "map_url");
      if (mapContact) {
        hotelMapUrl = mapContact.value;
      }

      contacts = dbContacts
        .filter((c: any) => c.contact_type !== "map_url")
        .map((c: any) => ({
          id: c.id,
          type: c.contact_type,
          label: c.label || c.contact_type,
          value: c.value,
          iconUrl: c.icon_url,
          sortOrder: c.sort_order,
        }));
    }

    // --- Fetch promotions from CMS ---
    const { data: dbPromotions } = await (supabase
      .from("promotions") as any)
      .select("id, title, description, image_url, discount_type, discount_percentage, discount_amount, discount_code, discount_text, valid_until, is_active, sort_order")
      .eq("hotel_id", hotelRow.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (dbPromotions) {
      promotions = dbPromotions.map((promo: any) => ({
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
    const { data: dbAttractions } = await (supabase
      .from("local_attractions") as any)
      .select("id, name, description, image_url, distance_km, map_url, sort_order")
      .eq("hotel_id", hotelRow.id)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (dbAttractions) {
      attractions = dbAttractions.map((attraction: any) => ({
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
    const dbRoomTypes = await getRoomTypesForLanding(hotelRow.id);
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
      <RoomTypesSection initialRoomTypes={roomTypes} hotelId={hotelRow.id} />
      <PromotionsSection promotions={promotions} />
      <AboutSection hotelName={hotelName} description={hotelDescription} attractions={attractions} />
      <ContactSection contacts={contacts} address={hotelAddress} mapUrl={hotelMapUrl} />
      <Footer hotelName={hotelName} navLinks={hotel.navLinks} config={hotel.footerConfig} />
    </>
  );
}
