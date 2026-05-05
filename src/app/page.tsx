import Navbar from "@/components/sections/Navbar";
import HeroSection from "@/components/sections/HeroSection";
import SearchBar from "@/components/sections/SearchBar";
import RoomTypesSection from "@/components/sections/RoomTypesSection";
import PromotionsSection from "@/components/sections/PromotionsSection";
import AboutSection from "@/components/sections/AboutSection";
import ContactSection from "@/components/sections/ContactSection";
import Footer from "@/components/sections/Footer";
import { getLandingPageData } from "@/services/mock-data";

export default function Home() {
  const data = getLandingPageData();
  const hotel = data.hotel;

  return (
    <>
      <Navbar hotelName={hotel.name} navLinks={hotel.navLinks} />
      <HeroSection slides={data.heroSlides} />
      <SearchBar labels={hotel.searchBarLabels} />
      <RoomTypesSection roomTypes={data.roomTypes} />
      <PromotionsSection promotions={data.promotions} />
      <AboutSection hotelName={hotel.name} description={hotel.description} attractions={data.attractions} />
      <ContactSection contacts={data.contacts} address={hotel.address} />
      <Footer hotelName={hotel.name} navLinks={hotel.navLinks} config={hotel.footerConfig} />
    </>
  );
}
