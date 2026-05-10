// ============================================================
// Mock Data Service — CMS-ready
// จำลองข้อมูลจาก Database/API
// เมื่อเชื่อมต่อกับ Supabase จริง ให้เปลี่ยนจาก mockData เป็น fetch จาก DB
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
    headline: "Valley Retreat",
    subheadline: "หลีกหนีความวุ่นวาย สู่ความสงบกลางหุบเขา",
    sortOrder: 1,
  },
  {
    id: "hero-2",
    imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80",
    altText: "Luxury room interior",
    headline: "ห้องพักหรูระดับพรีเมียม",
    subheadline: "ทุกห้องมองเห็นวิวภูเขา พร้อมสิ่งอำนวยความสะดวกครบครัน",
    sortOrder: 2,
  },
  {
    id: "hero-3",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
    altText: "Infinity pool with mountain view",
    headline: "สระว่ายน้ำ Infinity Pool",
    subheadline: "ดื่มด่ำกับวิวหุบเขาแบบพาโนรามาจากสระว่ายน้ำของเรา",
    sortOrder: 3,
  },
];

const promotions: Promotion[] = [
  {
    id: "promo-1",
    title: "Early Bird ส่วนลด 20%",
    description: "จองล่วงหน้า 30 วัน รับส่วนลดทันที 20% สำหรับทุกประเภทห้องพัก",
    imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    discountPercentage: 20,
    discountText: "ลด 20%",
    validUntil: "2026-12-31",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "promo-2",
    title: "แพ็กเกจฮันนีมูนสุดโรแมนติก",
    description: "ดินเนอร์ใต้แสงเทียน + สปาคู่ + ห้องสวีท 2 คืน ในราคาพิเศษ",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    discountPercentage: null,
    discountText: "ราคาพิเศษ",
    validUntil: "2026-09-30",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "promo-3",
    title: "พัก 3 คืน แถม 1 คืน",
    description: "เข้าพัก 3 คืนขึ้นไป รับฟรี 1 คืน สำหรับวันธรรมดา (จันทร์-พฤหัส)",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    discountPercentage: null,
    discountText: "แถม 1 คืน",
    validUntil: "2026-11-30",
    isActive: true,
    sortOrder: 3,
  },
];

const roomTypes: RoomTypeDisplay[] = [
  {
    id: "room-1",
    name: "Valley Deluxe",
    description:
      "ห้องพักขนาดกว้างขวาง 45 ตร.ม. ตกแต่งด้วยโทนสีธรรมชาติ พร้อมระเบียงส่วนตัวที่มองเห็นวิวหุบเขาแบบพาโนรามา ห้องน้ำหินอ่อนพร้อมอ่างอาบน้ำแยกจากโซนฝักบัว",
    shortDescription: "ห้องดีลักซ์กว้างขวาง พร้อมวิวหุบเขา",
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
      { icon: "wifi", label: "Wi-Fi ฟรี" },
      { icon: "tv", label: "Smart TV 55\"" },
      { icon: "bath", label: "อ่างอาบน้ำ" },
      { icon: "coffee", label: "ชา/กาแฟฟรี" },
      { icon: "ac", label: "เครื่องปรับอากาศ" },
      { icon: "balcony", label: "ระเบียงส่วนตัว" },
    ],
    isActive: true,
    availableRoomsCount: 5,
  },
  {
    id: "room-2",
    name: "Mountain Suite",
    description:
      "ห้องสวีทสุดหรู 65 ตร.ม. พร้อมห้องนั่งเล่นแยกเป็นสัดส่วน ระเบียงกว้างพร้อมจากุซซี่ส่วนตัว เหมาะสำหรับคู่รักที่ต้องการความเป็นส่วนตัวสูงสุด",
    shortDescription: "สวีทหรูพร้อมจากุซซี่ส่วนตัว",
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
      { icon: "wifi", label: "Wi-Fi ฟรี" },
      { icon: "tv", label: "Smart TV 65\"" },
      { icon: "jacuzzi", label: "จากุซซี่ส่วนตัว" },
      { icon: "coffee", label: "Nespresso Machine" },
      { icon: "ac", label: "เครื่องปรับอากาศ" },
      { icon: "balcony", label: "ระเบียงกว้าง" },
      { icon: "minibar", label: "มินิบาร์ฟรี" },
      { icon: "robe", label: "เสื้อคลุมอาบน้ำ" },
    ],
    isActive: true,
    availableRoomsCount: 2,
  },
  {
    id: "room-3",
    name: "Family Villa",
    description:
      "วิลล่าสำหรับครอบครัว 80 ตร.ม. มี 2 ห้องนอน ห้องนั่งเล่นกว้าง และสวนส่วนตัว พร้อมอุปกรณ์สำหรับเด็กเล็ก เหมาะสำหรับครอบครัว 4-6 ท่าน",
    shortDescription: "วิลล่าครอบครัว 2 ห้องนอน พร้อมสวนส่วนตัว",
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
      { icon: "wifi", label: "Wi-Fi ฟรี" },
      { icon: "tv", label: "Smart TV 65\"" },
      { icon: "bath", label: "อ่างอาบน้ำ" },
      { icon: "kitchen", label: "ครัวขนาดเล็ก" },
      { icon: "ac", label: "เครื่องปรับอากาศ" },
      { icon: "garden", label: "สวนส่วนตัว" },
      { icon: "crib", label: "เตียงเด็ก" },
      { icon: "parking", label: "ที่จอดรถส่วนตัว" },
    ],
    isActive: true,
    availableRoomsCount: 0,
  },
];

const contacts: ContactInfo[] = [
  {
    id: "contact-1",
    type: "phone",
    label: "โทรศัพท์",
    value: "+66 81 234 5678",
    iconUrl: null,
    sortOrder: 1,
  },
  {
    id: "contact-2",
    type: "email",
    label: "อีเมล",
    value: "reservation@valleyretreat.com",
    iconUrl: null,
    sortOrder: 2,
  },
  {
    id: "contact-3",
    type: "line",
    label: "LINE",
    value: "@valleyretreat",
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
    value: "@valleyretreat",
    iconUrl: null,
    sortOrder: 5,
  },
];

const attractions: LocalAttraction[] = [
  {
    id: "attr-1",
    name: "น้ำตกห้วยแก้ว",
    description: "น้ำตก 7 ชั้นที่สวยงาม ห่างจากรีสอร์ตเพียง 3 กม. สามารถเดินป่าระยะสั้นถึงได้",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
    distanceKm: 3,
    mapUrl: null,
    sortOrder: 1,
  },
  {
    id: "attr-2",
    name: "จุดชมวิวดอยผาหม่น",
    description: "จุดชมทะเลหมอกยามเช้าที่สวยที่สุดในพื้นที่ ระยะทาง 12 กม. จากรีสอร์ต",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    distanceKm: 12,
    mapUrl: null,
    sortOrder: 2,
  },
  {
    id: "attr-3",
    name: "ไร่ชาเขียวหุบเขา",
    description: "ไร่ชาออร์แกนิกพร้อมคาเฟ่ชมวิว สามารถนั่งจิบชาชมพระอาทิตย์ตกได้",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    distanceKm: 5,
    mapUrl: null,
    sortOrder: 3,
  },
];

const hotelConfig: HotelConfig = {
  name: "Valley Retreat",
  slug: "valley-retreat",
  description: "Valley Retreat คือรีสอร์ตหรูที่ซ่อนตัวอยู่ท่ามกลางหุบเขาอันเงียบสงบ โอบล้อมด้วยธรรมชาติที่บริสุทธิ์ เรามอบประสบการณ์การพักผ่อนที่ผสมผสานความหรูหราเข้ากับความเรียบง่ายของธรรมชาติได้อย่างลงตัว ทุกห้องพักถูกออกแบบมาเพื่อให้คุณได้สัมผัสกับวิวทิวทัศน์ของภูเขาและป่าไม้อย่างใกล้ชิด พร้อมบริการระดับพรีเมียมที่จะทำให้การเข้าพักของคุณเป็นช่วงเวลาที่น่าจดจำ",
  address: "123 หมู่ 5 ต.ห้วยแก้ว อ.แม่ออน จ.เชียงใหม่ 50130",
  contactEmail: "reservation@valleyretreat.com",
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
    copyright: "Valley Retreat. All rights reserved.",
  },
  promptPay: {
    accountId: "0812345678",
    accountName: "Valley Retreat Co., Ltd.",
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

// Mock booking storage (ในอนาคตเปลี่ยนเป็น Supabase query)
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
    guestName: "สมชาย ใจดี",
    guestEmail: "somchai@example.com",
    guestPhone: "+66 81 234 5678",
    roomName: "Valley Deluxe",
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
