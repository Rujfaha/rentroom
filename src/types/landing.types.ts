// ============================================================
// Landing Page Types — CMS-ready interfaces
// รองรับการดึงข้อมูลจาก Database/API
// ============================================================

export interface HeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  headline: string;
  subheadline: string;
  sortOrder: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  discountPercentage: number | null;
  discountText: string | null;
  validUntil: string;
  isActive: boolean;
  sortOrder: number;
}

export interface RoomAmenity {
  icon: string;
  label: string;
}

export interface RoomTypeDisplay {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  coverImageUrl: string;
  galleryUrls: string[];
  basePrice: number;
  maxGuests: number;
  bedType: string;
  roomSize: number;
  amenities: RoomAmenity[];
  isActive: boolean;
}

export interface ContactInfo {
  id: string;
  type: "phone" | "email" | "facebook" | "line" | "instagram" | "website" | "map_url";
  label: string;
  value: string;
  iconUrl: string | null;
  sortOrder: number;
}

export interface LocalAttraction {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  distanceKm: number;
  mapUrl: string | null;
  sortOrder: number;
}

export interface SearchParams {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
}

export interface GuestInfo {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
}

export interface BookingSummary {
  roomType: RoomTypeDisplay;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalNights: number;
  pricePerNight: number;
  totalAmount: number;
  guest: GuestInfo;
}

export interface BookingConfirmation {
  bookingReference: string;
  bookingSummary: BookingSummary;
  confirmedAt: string;
}

export interface PromptPayConfig {
  accountId: string;
  accountName: string;
  type: "phone" | "national_id";
}

export interface NavLink {
  href: string;
  label: string;
}

export interface SearchBarLabels {
  checkIn: string;
  checkOut: string;
  adults: string;
  children: string;
  button: string;
}

export interface FooterConfig {
  description: string;
  bookCtaTitle: string;
  bookCtaText: string;
  bookCtaButton: string;
  quickLinksTitle: string;
  copyright: string;
}

export interface HotelConfig {
  name: string;
  slug: string;
  description: string;
  address: string;
  contactEmail: string;
  latitude: number;
  longitude: number;
  navLinks: NavLink[];
  searchBarLabels: SearchBarLabels;
  footerConfig: FooterConfig;
  promptPay: PromptPayConfig;
}

export interface LandingPageData {
  hotel: HotelConfig;
  heroSlides: HeroSlide[];
  promotions: Promotion[];
  roomTypes: RoomTypeDisplay[];
  contacts: ContactInfo[];
  attractions: LocalAttraction[];
}
