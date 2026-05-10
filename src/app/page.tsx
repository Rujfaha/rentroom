import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import SearchBar from "@/components/sections/SearchBar";
import RoomTypesSection from "@/components/sections/RoomTypesSection";
import PromotionsSection from "@/components/sections/PromotionsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/sections/Footer";
import { getLandingPageData } from "@/services/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getRoomTypesForLanding } from "@/app/actions/landing";
import RealtimeRoomSync from "@/components/realtime/RealtimeRoomSync";
import type { HeroSlide, ContactInfo, RoomTypeDisplay } from "@/types/landing.types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const mockData = getLandingPageData();
  const hotel = mockData.hotel;

  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();

  // --- Fetch hotel settings (first hotel) ---
  const { data: hotelRow } = await (supabase
    .from("hotels") as any)
    .select("id, name, description, address")
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

  if (hotelRow?.id) {
    const { data: dbSlides } = await (supabase
      .from("hero_slides") as any)
      .select("id, image_url, alt_text, headline, subheadline, sort_order")
      .eq("hotel_id", hotelRow.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (dbSlides && dbSlides.length > 0) {
      heroSlides = dbSlides.map((s: any) => ({
        id: s.id,
        imageUrl: s.image_url,
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

    if (dbContacts && dbContacts.length > 0) {
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

    // --- Fetch room types from database ---
    const dbRoomTypes = await getRoomTypesForLanding(hotelRow.id);
    if (dbRoomTypes.length > 0) {
      roomTypes = dbRoomTypes;
    }
  }

  return (
    <>
      {hotelRow?.id && <RealtimeRoomSync hotelId={hotelRow.id} />}
      <Navbar hotelName={hotelName} navLinks={hotel.navLinks} />
      <HeroSection slides={heroSlides} />
      <SearchBar labels={hotel.searchBarLabels} />
      <RoomTypesSection initialRoomTypes={roomTypes} hotelId={hotelRow.id} />
      <PromotionsSection promotions={mockData.promotions} />
      <AboutSection hotelName={hotelName} description={hotelDescription} attractions={mockData.attractions} />
      <ContactSection contacts={contacts} address={hotelAddress} mapUrl={hotelMapUrl} />
      <Footer hotelName={hotelName} navLinks={hotel.navLinks} config={hotel.footerConfig} />
    </>
  );
}
