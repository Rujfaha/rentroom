// ============================================================
// Mock Data Service â€” CMS-ready
// à¸ˆà¸³à¸¥à¸­à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸ˆà¸²à¸ Database/API
// à¹€à¸¡à¸·à¹ˆà¸­à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¸•à¹ˆà¸­à¸à¸±à¸š Supabase à¸ˆà¸£à¸´à¸‡ à¹ƒà¸«à¹‰à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¸ˆà¸²à¸ mockData à¹€à¸›à¹‡à¸™ fetch à¸ˆà¸²à¸ DB
// ============================================================

import type {
  LandingPageData,
  HeroSlide,
  Promotion,
  RoomTypeDisplay,
  ContactInfo,
  LocalAttraction,
  HotelConfig,
  PromptPayConfig,
} from "@/types/landing.types";

const heroSlides: HeroSlide[] = [
  {
    id: "hero-1",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920&q=80",
    altText: "Mountain resort view at sunrise",
    headline: "Arkkarawin",
    subheadline: "à¸«à¸¥à¸µà¸à¸«à¸™à¸µà¸„à¸§à¸²à¸¡à¸§à¸¸à¹ˆà¸™à¸§à¸²à¸¢ à¸ªà¸¹à¹ˆà¸„à¸§à¸²à¸¡à¸ªà¸‡à¸šà¸à¸¥à¸²à¸‡à¸«à¸¸à¸šà¹€à¸‚à¸²",
    sortOrder: 1,
  },
  {
    id: "hero-2",
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80",
    altText: "Luxury room interior",
    headline: "à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸«à¸£à¸¹à¸£à¸°à¸”à¸±à¸šà¸žà¸£à¸µà¹€à¸¡à¸µà¸¢à¸¡",
    subheadline: "à¸—à¸¸à¸à¸«à¹‰à¸­à¸‡à¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™à¸§à¸´à¸§à¸ à¸¹à¹€à¸‚à¸² à¸žà¸£à¹‰à¸­à¸¡à¸ªà¸´à¹ˆà¸‡à¸­à¸³à¸™à¸§à¸¢à¸„à¸§à¸²à¸¡à¸ªà¸°à¸”à¸§à¸à¸„à¸£à¸šà¸„à¸£à¸±à¸™",
    sortOrder: 2,
  },
  {
    id: "hero-3",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
    altText: "Infinity pool with mountain view",
    headline: "à¸ªà¸£à¸°à¸§à¹ˆà¸²à¸¢à¸™à¹‰à¸³ Infinity Pool",
    subheadline: "à¸”à¸·à¹ˆà¸¡à¸”à¹ˆà¸³à¸à¸±à¸šà¸§à¸´à¸§à¸«à¸¸à¸šà¹€à¸‚à¸²à¹à¸šà¸šà¸žà¸²à¹‚à¸™à¸£à¸²à¸¡à¸²à¸ˆà¸²à¸à¸ªà¸£à¸°à¸§à¹ˆà¸²à¸¢à¸™à¹‰à¸³à¸‚à¸­à¸‡à¹€à¸£à¸²",
    sortOrder: 3,
  },
];

const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Early Bird à¸ªà¹ˆà¸§à¸™à¸¥à¸” 20%",
    description: "à¸ˆà¸­à¸‡à¸¥à¹ˆà¸§à¸‡à¸«à¸™à¹‰à¸² 30 à¸§à¸±à¸™ à¸£à¸±à¸šà¸ªà¹ˆà¸§à¸™à¸¥à¸”à¸—à¸±à¸™à¸—à¸µ 20% à¸ªà¸³à¸«à¸£à¸±à¸šà¸—à¸¸à¸à¸›à¸£à¸°à¹€à¸ à¸—à¸«à¹‰à¸­à¸‡à¸žà¸±à¸",
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    discountPercentage: 20,
    discountText: "à¸¥à¸” 20%",
    validUntil: "2026-12-31",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "promo-2",
    title: "à¹à¸žà¹‡à¸à¹€à¸à¸ˆà¸®à¸±à¸™à¸™à¸µà¸¡à¸¹à¸™à¸ªà¸¸à¸”à¹‚à¸£à¹à¸¡à¸™à¸•à¸´à¸",
    description: "à¸”à¸´à¸™à¹€à¸™à¸­à¸£à¹Œà¹ƒà¸•à¹‰à¹à¸ªà¸‡à¹€à¸—à¸µà¸¢à¸™ + à¸ªà¸›à¸²à¸„à¸¹à¹ˆ + à¸«à¹‰à¸­à¸‡à¸ªà¸§à¸µà¸— 2 à¸„à¸·à¸™ à¹ƒà¸™à¸£à¸²à¸„à¸²à¸žà¸´à¹€à¸¨à¸©",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    discountPercentage: null,
    discountText: "à¸£à¸²à¸„à¸²à¸žà¸´à¹€à¸¨à¸©",
    validUntil: "2026-09-30",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "promo-3",
    title: "à¸žà¸±à¸ 3 à¸„à¸·à¸™ à¹à¸–à¸¡ 1 à¸„à¸·à¸™",
    description: "à¹€à¸‚à¹‰à¸²à¸žà¸±à¸ 3 à¸„à¸·à¸™à¸‚à¸¶à¹‰à¸™à¹„à¸› à¸£à¸±à¸šà¸Ÿà¸£à¸µ 1 à¸„à¸·à¸™ à¸ªà¸³à¸«à¸£à¸±à¸šà¸§à¸±à¸™à¸˜à¸£à¸£à¸¡à¸”à¸² (à¸ˆà¸±à¸™à¸—à¸£à¹Œ-à¸žà¸¤à¸«à¸±à¸ª)",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    discountPercentage: null,
    discountText: "à¹à¸–à¸¡ 1 à¸„à¸·à¸™",
    validUntil: "2026-11-30",
    isActive: true,
    sortOrder: 3,
  },
];

const roomTypes: RoomTypeDisplay[] = [
  {
    id: "room-1",
    name: "Arkkarawin Deluxe",
    description:
      "à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸‚à¸™à¸²à¸”à¸à¸§à¹‰à¸²à¸‡à¸‚à¸§à¸²à¸‡ 45 à¸•à¸£.à¸¡. à¸•à¸à¹à¸•à¹ˆà¸‡à¸”à¹‰à¸§à¸¢à¹‚à¸—à¸™à¸ªà¸µà¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´ à¸žà¸£à¹‰à¸­à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸‡à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§à¸—à¸µà¹ˆà¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™à¸§à¸´à¸§à¸«à¸¸à¸šà¹€à¸‚à¸²à¹à¸šà¸šà¸žà¸²à¹‚à¸™à¸£à¸²à¸¡à¸² à¸«à¹‰à¸­à¸‡à¸™à¹‰à¸³à¸«à¸´à¸™à¸­à¹ˆà¸­à¸™à¸žà¸£à¹‰à¸­à¸¡à¸­à¹ˆà¸²à¸‡à¸­à¸²à¸šà¸™à¹‰à¸³à¹à¸¢à¸à¸ˆà¸²à¸à¹‚à¸‹à¸™à¸à¸±à¸à¸šà¸±à¸§",
    shortDescription: "à¸«à¹‰à¸­à¸‡à¸”à¸µà¸¥à¸±à¸à¸‹à¹Œà¸à¸§à¹‰à¸²à¸‡à¸‚à¸§à¸²à¸‡ à¸žà¸£à¹‰à¸­à¸¡à¸§à¸´à¸§à¸«à¸¸à¸šà¹€à¸‚à¸²",
    coverImageUrl: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80",
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80",
    ],
    basePrice: 4500,
    maxGuests: 2,
    bedType: "King Size",
    roomSize: 45,
    amenities: [
      { icon: "wifi", label: "Wi-Fi à¸Ÿà¸£à¸µ" },
      { icon: "tv", label: "Smart TV 55\"" },
      { icon: "bath", label: "à¸­à¹ˆà¸²à¸‡à¸­à¸²à¸šà¸™à¹‰à¸³" },
      { icon: "coffee", label: "à¸Šà¸²/à¸à¸²à¹à¸Ÿà¸Ÿà¸£à¸µ" },
      { icon: "ac", label: "à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸›à¸£à¸±à¸šà¸­à¸²à¸à¸²à¸¨" },
      { icon: "balcony", label: "à¸£à¸°à¹€à¸šà¸µà¸¢à¸‡à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§" },
    ],
    isActive: true,
    availableRoomsCount: 5,
  },
  {
    id: "room-2",
    name: "Mountain Suite",
    description:
      "à¸«à¹‰à¸­à¸‡à¸ªà¸§à¸µà¸—à¸ªà¸¸à¸”à¸«à¸£à¸¹ 65 à¸•à¸£.à¸¡. à¸žà¸£à¹‰à¸­à¸¡à¸«à¹‰à¸­à¸‡à¸™à¸±à¹ˆà¸‡à¹€à¸¥à¹ˆà¸™à¹à¸¢à¸à¹€à¸›à¹‡à¸™à¸ªà¸±à¸”à¸ªà¹ˆà¸§à¸™ à¸£à¸°à¹€à¸šà¸µà¸¢à¸‡à¸à¸§à¹‰à¸²à¸‡à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸²à¸à¸¸à¸‹à¸‹à¸µà¹ˆà¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸„à¸¹à¹ˆà¸£à¸±à¸à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸„à¸§à¸²à¸¡à¹€à¸›à¹‡à¸™à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§à¸ªà¸¹à¸‡à¸ªà¸¸à¸”",
    shortDescription: "à¸ªà¸§à¸µà¸—à¸«à¸£à¸¹à¸žà¸£à¹‰à¸­à¸¡à¸ˆà¸²à¸à¸¸à¸‹à¸‹à¸µà¹ˆà¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§",
    coverImageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    ],
    basePrice: 7500,
    maxGuests: 2,
    bedType: "King Size",
    roomSize: 65,
    amenities: [
      { icon: "wifi", label: "Wi-Fi à¸Ÿà¸£à¸µ" },
      { icon: "tv", label: "Smart TV 65\"" },
      { icon: "jacuzzi", label: "à¸ˆà¸²à¸à¸¸à¸‹à¸‹à¸µà¹ˆà¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§" },
      { icon: "coffee", label: "Nespresso Machine" },
      { icon: "ac", label: "à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸›à¸£à¸±à¸šà¸­à¸²à¸à¸²à¸¨" },
      { icon: "balcony", label: "à¸£à¸°à¹€à¸šà¸µà¸¢à¸‡à¸à¸§à¹‰à¸²à¸‡" },
      { icon: "minibar", label: "à¸¡à¸´à¸™à¸´à¸šà¸²à¸£à¹Œà¸Ÿà¸£à¸µ" },
      { icon: "robe", label: "à¹€à¸ªà¸·à¹‰à¸­à¸„à¸¥à¸¸à¸¡à¸­à¸²à¸šà¸™à¹‰à¸³" },
    ],
    isActive: true,
    availableRoomsCount: 2,
  },
  {
    id: "room-3",
    name: "Family Villa",
    description:
      "à¸§à¸´à¸¥à¸¥à¹ˆà¸²à¸ªà¸³à¸«à¸£à¸±à¸šà¸„à¸£à¸­à¸šà¸„à¸£à¸±à¸§ 80 à¸•à¸£.à¸¡. à¸¡à¸µ 2 à¸«à¹‰à¸­à¸‡à¸™à¸­à¸™ à¸«à¹‰à¸­à¸‡à¸™à¸±à¹ˆà¸‡à¹€à¸¥à¹ˆà¸™à¸à¸§à¹‰à¸²à¸‡ à¹à¸¥à¸°à¸ªà¸§à¸™à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§ à¸žà¸£à¹‰à¸­à¸¡à¸­à¸¸à¸›à¸à¸£à¸“à¹Œà¸ªà¸³à¸«à¸£à¸±à¸šà¹€à¸”à¹‡à¸à¹€à¸¥à¹‡à¸ à¹€à¸«à¸¡à¸²à¸°à¸ªà¸³à¸«à¸£à¸±à¸šà¸„à¸£à¸­à¸šà¸„à¸£à¸±à¸§ 4-6 à¸—à¹ˆà¸²à¸™",
    shortDescription: "à¸§à¸´à¸¥à¸¥à¹ˆà¸²à¸„à¸£à¸­à¸šà¸„à¸£à¸±à¸§ 2 à¸«à¹‰à¸­à¸‡à¸™à¸­à¸™ à¸žà¸£à¹‰à¸­à¸¡à¸ªà¸§à¸™à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§",
    coverImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    galleryUrls: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    ],
    basePrice: 9500,
    maxGuests: 6,
    bedType: "King + Twin",
    roomSize: 80,
    amenities: [
      { icon: "wifi", label: "Wi-Fi à¸Ÿà¸£à¸µ" },
      { icon: "tv", label: "Smart TV 65\"" },
      { icon: "bath", label: "à¸­à¹ˆà¸²à¸‡à¸­à¸²à¸šà¸™à¹‰à¸³" },
      { icon: "kitchen", label: "à¸„à¸£à¸±à¸§à¸‚à¸™à¸²à¸”à¹€à¸¥à¹‡à¸" },
      { icon: "ac", label: "à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸›à¸£à¸±à¸šà¸­à¸²à¸à¸²à¸¨" },
      { icon: "garden", label: "à¸ªà¸§à¸™à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§" },
      { icon: "crib", label: "à¹€à¸•à¸µà¸¢à¸‡à¹€à¸”à¹‡à¸" },
      { icon: "parking", label: "à¸—à¸µà¹ˆà¸ˆà¸­à¸”à¸£à¸–à¸ªà¹ˆà¸§à¸™à¸•à¸±à¸§" },
    ],
    isActive: true,
    availableRoomsCount: 0,
  },
];

const contacts: ContactInfo[] = [
  {
    id: "contact-1",
    type: "phone",
    label: "à¹‚à¸—à¸£à¸¨à¸±à¸žà¸—à¹Œ",
    value: "+66 81 234 5678",
    iconUrl: null,
    sortOrder: 1,
  },
  {
    id: "contact-2",
    type: "email",
    label: "à¸­à¸µà¹€à¸¡à¸¥",
    value: "reservation@arkkarawin.com",
    iconUrl: null,
    sortOrder: 2,
  },
  {
    id: "contact-3",
    type: "line",
    label: "LINE",
    value: "@arkkarawin",
    iconUrl: null,
    sortOrder: 3,
  },
  {
    id: "contact-4",
    type: "facebook",
    label: "Facebook",
    value: "ValleyRetreatResort",
    iconUrl: null,
    sortOrder: 4,
  },
  {
    id: "contact-5",
    type: "instagram",
    label: "Instagram",
    value: "@arkkarawin",
    iconUrl: null,
    sortOrder: 5,
  },
];

const attractions: LocalAttraction[] = [
  {
    id: "attr-1",
    name: "à¸™à¹‰à¸³à¸•à¸à¸«à¹‰à¸§à¸¢à¹à¸à¹‰à¸§",
    description: "à¸™à¹‰à¸³à¸•à¸ 7 à¸Šà¸±à¹‰à¸™à¸—à¸µà¹ˆà¸ªà¸§à¸¢à¸‡à¸²à¸¡ à¸«à¹ˆà¸²à¸‡à¸ˆà¸²à¸à¸£à¸µà¸ªà¸­à¸£à¹Œà¸•à¹€à¸žà¸µà¸¢à¸‡ 3 à¸à¸¡. à¸ªà¸²à¸¡à¸²à¸£à¸–à¹€à¸”à¸´à¸™à¸›à¹ˆà¸²à¸£à¸°à¸¢à¸°à¸ªà¸±à¹‰à¸™à¸–à¸¶à¸‡à¹„à¸”à¹‰",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
    distanceKm: 3,
    mapUrl: null,
    sortOrder: 1,
  },
  {
    id: "attr-2",
    name: "à¸ˆà¸¸à¸”à¸Šà¸¡à¸§à¸´à¸§à¸”à¸­à¸¢à¸œà¸²à¸«à¸¡à¹ˆà¸™",
    description: "à¸ˆà¸¸à¸”à¸Šà¸¡à¸—à¸°à¹€à¸¥à¸«à¸¡à¸­à¸à¸¢à¸²à¸¡à¹€à¸Šà¹‰à¸²à¸—à¸µà¹ˆà¸ªà¸§à¸¢à¸—à¸µà¹ˆà¸ªà¸¸à¸”à¹ƒà¸™à¸žà¸·à¹‰à¸™à¸—à¸µà¹ˆ à¸£à¸°à¸¢à¸°à¸—à¸²à¸‡ 12 à¸à¸¡. à¸ˆà¸²à¸à¸£à¸µà¸ªà¸­à¸£à¹Œà¸•",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    distanceKm: 12,
    mapUrl: null,
    sortOrder: 2,
  },
  {
    id: "attr-3",
    name: "à¹„à¸£à¹ˆà¸Šà¸²à¹€à¸‚à¸µà¸¢à¸§à¸«à¸¸à¸šà¹€à¸‚à¸²",
    description: "à¹„à¸£à¹ˆà¸Šà¸²à¸­à¸­à¸£à¹Œà¹à¸à¸™à¸´à¸à¸žà¸£à¹‰à¸­à¸¡à¸„à¸²à¹€à¸Ÿà¹ˆà¸Šà¸¡à¸§à¸´à¸§ à¸ªà¸²à¸¡à¸²à¸£à¸–à¸™à¸±à¹ˆà¸‡à¸ˆà¸´à¸šà¸Šà¸²à¸Šà¸¡à¸žà¸£à¸°à¸­à¸²à¸—à¸´à¸•à¸¢à¹Œà¸•à¸à¹„à¸”à¹‰",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    distanceKm: 5,
    mapUrl: null,
    sortOrder: 3,
  },
];

const hotelConfig: HotelConfig = {
  name: "Arkkarawin",
  slug: "arkkarawin",
  description: "Arkkarawin à¸„à¸·à¸­à¸£à¸µà¸ªà¸­à¸£à¹Œà¸•à¸«à¸£à¸¹à¸—à¸µà¹ˆà¸‹à¹ˆà¸­à¸™à¸•à¸±à¸§à¸­à¸¢à¸¹à¹ˆà¸—à¹ˆà¸²à¸¡à¸à¸¥à¸²à¸‡à¸«à¸¸à¸šà¹€à¸‚à¸²à¸­à¸±à¸™à¹€à¸‡à¸µà¸¢à¸šà¸ªà¸‡à¸š à¹‚à¸­à¸šà¸¥à¹‰à¸­à¸¡à¸”à¹‰à¸§à¸¢à¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´à¸—à¸µà¹ˆà¸šà¸£à¸´à¸ªà¸¸à¸—à¸˜à¸´à¹Œ à¹€à¸£à¸²à¸¡à¸­à¸šà¸›à¸£à¸°à¸ªà¸šà¸à¸²à¸£à¸“à¹Œà¸à¸²à¸£à¸žà¸±à¸à¸œà¹ˆà¸­à¸™à¸—à¸µà¹ˆà¸œà¸ªà¸¡à¸œà¸ªà¸²à¸™à¸„à¸§à¸²à¸¡à¸«à¸£à¸¹à¸«à¸£à¸²à¹€à¸‚à¹‰à¸²à¸à¸±à¸šà¸„à¸§à¸²à¸¡à¹€à¸£à¸µà¸¢à¸šà¸‡à¹ˆà¸²à¸¢à¸‚à¸­à¸‡à¸˜à¸£à¸£à¸¡à¸Šà¸²à¸•à¸´à¹„à¸”à¹‰à¸­à¸¢à¹ˆà¸²à¸‡à¸¥à¸‡à¸•à¸±à¸§ à¸—à¸¸à¸à¸«à¹‰à¸­à¸‡à¸žà¸±à¸à¸–à¸¹à¸à¸­à¸­à¸à¹à¸šà¸šà¸¡à¸²à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰à¸„à¸¸à¸“à¹„à¸”à¹‰à¸ªà¸±à¸¡à¸œà¸±à¸ªà¸à¸±à¸šà¸§à¸´à¸§à¸—à¸´à¸§à¸—à¸±à¸¨à¸™à¹Œà¸‚à¸­à¸‡à¸ à¸¹à¹€à¸‚à¸²à¹à¸¥à¸°à¸›à¹ˆà¸²à¹„à¸¡à¹‰à¸­à¸¢à¹ˆà¸²à¸‡à¹ƒà¸à¸¥à¹‰à¸Šà¸´à¸” à¸žà¸£à¹‰à¸­à¸¡à¸šà¸£à¸´à¸à¸²à¸£à¸£à¸°à¸”à¸±à¸šà¸žà¸£à¸µà¹€à¸¡à¸µà¸¢à¸¡à¸—à¸µà¹ˆà¸ˆà¸°à¸—à¸³à¹ƒà¸«à¹‰à¸à¸²à¸£à¹€à¸‚à¹‰à¸²à¸žà¸±à¸à¸‚à¸­à¸‡à¸„à¸¸à¸“à¹€à¸›à¹‡à¸™à¸Šà¹ˆà¸§à¸‡à¹€à¸§à¸¥à¸²à¸—à¸µà¹ˆà¸™à¹ˆà¸²à¸ˆà¸”à¸ˆà¸³",
  address: "123 à¸«à¸¡à¸¹à¹ˆ 5 à¸•.à¸«à¹‰à¸§à¸¢à¹à¸à¹‰à¸§ à¸­.à¹à¸¡à¹ˆà¸­à¸­à¸™ à¸ˆ.à¹€à¸Šà¸µà¸¢à¸‡à¹ƒà¸«à¸¡à¹ˆ 50130",
  contactEmail: "reservation@arkkarawin.com",
  latitude: 18.7883,
  longitude: 98.9853,
  navLinks: [
    { href: "#rooms", label: "Room Types" },
    { href: "#promotions", label: "Promotions" },
    { href: "#about", label: "About Us" },
    { href: "#contact", label: "Contact" },
  ],
  searchBarLabels: {
    checkIn: "Check-in",
    checkOut: "Check-out",
    adults: "Adults",
    children: "Children",
    button: "Check Availability",
  },
  footerConfig: {
    description: "A luxury mountain resort offering tranquility and premium services amidst nature.",
    bookCtaTitle: "Book Your Stay",
    bookCtaText: "Experience the perfect blend of luxury and nature. Book directly for the best rates.",
    bookCtaButton: "Reserve Now",
    quickLinksTitle: "Quick Links",
    copyright: "Arkkarawin. All rights reserved.",
  },
  promptPay: {
    accountId: "0812345678",
    accountName: "Arkkarawin Co., Ltd.",
    type: "phone",
  },
};

export function getHotelConfig(): HotelConfig {
  return hotelConfig;
}

export function getPromptPayConfig(): PromptPayConfig {
  return hotelConfig.promptPay;
}

export function getLandingPageData(): LandingPageData {
  return {
    hotel: hotelConfig,
    heroSlides,
    promotions,
    roomTypes,
    contacts,
    attractions,
  };
}

export function getRoomTypeById(id: string): RoomTypeDisplay | undefined {
  return roomTypes.find((room) => room.id === id);
}

export function getPromotionById(id: string): Promotion | undefined {
  return promotions.find((promo) => promo.id === id);
}

export function generateBookingReference(): string {
  const prefix = "VR";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Mock booking storage (à¹ƒà¸™à¸­à¸™à¸²à¸„à¸•à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™à¹€à¸›à¹‡à¸™ Supabase query)
export interface MockBooking {
  bookingRef: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  children: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled" | "checked_in" | "checked_out";
  paymentStatus: "pending" | "verified" | "rejected";
  slipUrl: string;
  createdAt: string;
}

const mockBookings: MockBooking[] = [
  {
    bookingRef: "VR-DEMO01-ABCD",
    guestName: "à¸ªà¸¡à¸Šà¸²à¸¢ à¹ƒà¸ˆà¸”à¸µ",
    guestEmail: "somchai@example.com",
    guestPhone: "+66 81 234 5678",
    roomName: "Arkkarawin Deluxe",
    checkIn: "2026-06-01",
    checkOut: "2026-06-03",
    totalNights: 2,
    adults: 2,
    children: 0,
    totalAmount: 9000,
    status: "confirmed",
    paymentStatus: "verified",
    slipUrl: "/mock-slip.jpg",
    createdAt: "2026-05-01T10:00:00Z",
  },
  {
    bookingRef: "VR-DEMO02-EFGH",
    guestName: "Jane Smith",
    guestEmail: "jane@example.com",
    guestPhone: "+66 92 345 6789",
    roomName: "Mountain Suite",
    checkIn: "2026-07-10",
    checkOut: "2026-07-13",
    totalNights: 3,
    adults: 2,
    children: 0,
    totalAmount: 22500,
    status: "pending",
    paymentStatus: "pending",
    slipUrl: "/mock-slip.jpg",
    createdAt: "2026-05-05T08:30:00Z",
  },
];

export function lookupBooking(ref: string, email: string): MockBooking | null {
  const found = mockBookings.find(function (b) {
    return b.bookingRef.toUpperCase() === ref.toUpperCase() && b.guestEmail.toLowerCase() === email.toLowerCase();
  });
  return found || null;
}

export function addMockBooking(booking: MockBooking): void {
  mockBookings.push(booking);
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

