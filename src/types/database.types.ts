// ============================================================
// TypeScript Types — Generated from schema.sql
// สำหรับใช้กับ Supabase Client
// ============================================================

// ========================
// ENUM Types
// ========================

export type UserRole = "super_admin" | "admin" | "staff";
export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentMethod = "cash" | "bank_transfer" | "credit_card" | "promptpay" | "other";
export type RoomStatus = "available" | "occupied" | "maintenance" | "out_of_order";
export type HousekeepingStatus = "clean" | "dirty" | "inspected" | "in_progress" | "out_of_service";
export type BookingSource = "website" | "walk_in" | "phone" | "ota" | "other";
export type DayType = "weekday" | "weekend" | "holiday" | "special";
export type ContactType = "phone" | "email" | "facebook" | "line" | "instagram" | "website" | "tiktok" | "whatsapp" | "map_url" | "other";
export type PromotionType = "automatic" | "code_required" | "private";

// ========================
// Table Row Types
// ========================

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  province: string | null;
  district: string | null;
  sub_district: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserHotel {
  id: string;
  user_id: string;
  hotel_id: string;
  assigned_at: string;
}

export interface StaffPermission {
  id: string;
  user_id: string;
  hotel_id: string;
  permission_key: string;
  is_allowed: boolean;
  created_at: string;
}

export interface CmsPage {
  id: string;
  hotel_id: string;
  title: string;
  slug: string;
  sort_order: number;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsSection {
  id: string;
  page_id: string;
  hotel_id: string;
  section_type: string;
  title: string | null;
  content: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CmsImage {
  id: string;
  hotel_id: string;
  section_id: string | null;
  image_url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface CmsHotelContact {
  id: string;
  hotel_id: string;
  contact_type: ContactType;
  label: string | null;
  value: string;
  icon_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalAttraction {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  distance_km: number | null;
  map_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomType {
  id: string;
  hotel_id: string;
  name: string;
  description: string | null;
  base_price: number;
  max_guests: number;
  amenities: unknown[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  room_type_id: string;
  room_number: string;
  floor: string | null;
  status: RoomStatus;
  housekeeping: HousekeepingStatus;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomTypeImage {
  id: string;
  room_type_id: string;
  hotel_id: string;
  image_url: string;
  alt_text: string | null;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface Customer {
  id: string;
  hotel_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  id_card_number: string | null;
  nationality: string | null;
  notes: string | null;
  total_stays: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  hotel_id: string;
  room_id: string;
  customer_id: string | null;
  booking_number: string;
  check_in_date: string;
  check_out_date: string;
  num_guests: number;
  status: BookingStatus;
  source: BookingSource;
  total_amount: number;
  discount_amount: number;
  net_amount: number;
  special_requests: string | null;
  notes: string | null;
  confirmed_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingGuest {
  id: string;
  booking_id: string;
  hotel_id: string;
  full_name: string;
  phone: string | null;
  id_card_number: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface HousekeepingLog {
  id: string;
  hotel_id: string;
  room_id: string;
  assigned_to: string | null;
  status: HousekeepingStatus;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Season {
  id: string;
  hotel_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingRule {
  id: string;
  hotel_id: string;
  room_type_id: string;
  season_id: string | null;
  day_type: DayType;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  hotel_id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  slip_image_url: string | null;
  transaction_ref: string | null;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_type: "percent" | "fixed";
  discount_percentage: number | null;
  discount_amount: number | null;
  discount_code: string | null;
  discount_text: string | null;
  valid_until: string | null;
  is_active: boolean;
  sort_order: number;
  promotion_type: PromotionType;
  starts_at: string | null;
  ends_at: string | null;
  stay_start_date: string | null;
  stay_end_date: string | null;
  priority: number;
  stackable: boolean;
  exclusive: boolean;
  max_uses: number | null;
  used_count: number;
  max_uses_per_customer: number | null;
  applies_to_all_room_types: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionCode {
  id: string;
  promotion_id: string;
  code: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionRoomType {
  id: string;
  promotion_id: string;
  room_type_id: string;
  created_at: string;
}

export interface PromotionRule {
  id: string;
  promotion_id: string;
  conditions_json: Record<string, unknown>;
  benefits_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PromotionUsage {
  id: string;
  promotion_id: string;
  promotion_code_id: string | null;
  booking_id: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  discount_amount: number;
  used_at: string;
}

export interface BookingPromotion {
  id: string;
  booking_id: string;
  promotion_id: string;
  promotion_name: string;
  promotion_code: string | null;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
  conditions_snapshot: Record<string, unknown>;
  benefits_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  hotel_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  hotel_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  expense_date: string;
  receipt_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ========================
// Supabase Database Type (for typed client)
// ========================

export interface Database {
  public: {
    Tables: {
      hotels: { Row: Hotel; Insert: Partial<Hotel> & Pick<Hotel, "name" | "slug">; Update: Partial<Hotel> };
      users: { Row: User; Insert: Partial<User> & Pick<User, "email" | "password_hash" | "full_name">; Update: Partial<User> };
      user_hotels: { Row: UserHotel; Insert: Partial<UserHotel> & Pick<UserHotel, "user_id" | "hotel_id">; Update: Partial<UserHotel> };
      staff_permissions: { Row: StaffPermission; Insert: Partial<StaffPermission> & Pick<StaffPermission, "user_id" | "hotel_id" | "permission_key">; Update: Partial<StaffPermission> };
      cms_pages: { Row: CmsPage; Insert: Partial<CmsPage> & Pick<CmsPage, "hotel_id" | "title" | "slug">; Update: Partial<CmsPage> };
      cms_sections: { Row: CmsSection; Insert: Partial<CmsSection> & Pick<CmsSection, "page_id" | "hotel_id" | "section_type">; Update: Partial<CmsSection> };
      cms_images: { Row: CmsImage; Insert: Partial<CmsImage> & Pick<CmsImage, "hotel_id" | "image_url">; Update: Partial<CmsImage> };
      cms_hotel_contacts: { Row: CmsHotelContact; Insert: Partial<CmsHotelContact> & Pick<CmsHotelContact, "hotel_id" | "contact_type" | "value">; Update: Partial<CmsHotelContact> };
      local_attractions: { Row: LocalAttraction; Insert: Partial<LocalAttraction> & Pick<LocalAttraction, "hotel_id" | "name">; Update: Partial<LocalAttraction> };
      room_types: { Row: RoomType; Insert: Partial<RoomType> & Pick<RoomType, "hotel_id" | "name">; Update: Partial<RoomType> };
      rooms: { Row: Room; Insert: Partial<Room> & Pick<Room, "hotel_id" | "room_type_id" | "room_number">; Update: Partial<Room> };
      room_type_images: { Row: RoomTypeImage; Insert: Partial<RoomTypeImage> & Pick<RoomTypeImage, "room_type_id" | "hotel_id" | "image_url">; Update: Partial<RoomTypeImage> };
      customers: { Row: Customer; Insert: Partial<Customer> & Pick<Customer, "hotel_id" | "full_name">; Update: Partial<Customer> };
      bookings: { Row: Booking; Insert: Partial<Booking> & Pick<Booking, "hotel_id" | "room_id" | "booking_number" | "check_in_date" | "check_out_date">; Update: Partial<Booking> };
      booking_guests: { Row: BookingGuest; Insert: Partial<BookingGuest> & Pick<BookingGuest, "booking_id" | "hotel_id" | "full_name">; Update: Partial<BookingGuest> };
      housekeeping_logs: { Row: HousekeepingLog; Insert: Partial<HousekeepingLog> & Pick<HousekeepingLog, "hotel_id" | "room_id" | "status">; Update: Partial<HousekeepingLog> };
      seasons: { Row: Season; Insert: Partial<Season> & Pick<Season, "hotel_id" | "name" | "start_date" | "end_date">; Update: Partial<Season> };
      pricing_rules: { Row: PricingRule; Insert: Partial<PricingRule> & Pick<PricingRule, "hotel_id" | "room_type_id" | "price">; Update: Partial<PricingRule> };
      payments: { Row: Payment; Insert: Partial<Payment> & Pick<Payment, "hotel_id" | "booking_id" | "amount">; Update: Partial<Payment> };
      promotions: { Row: Promotion; Insert: Partial<Promotion> & Pick<Promotion, "hotel_id" | "title">; Update: Partial<Promotion> };
      promotion_codes: { Row: PromotionCode; Insert: Partial<PromotionCode> & Pick<PromotionCode, "promotion_id" | "code">; Update: Partial<PromotionCode> };
      promotion_room_types: { Row: PromotionRoomType; Insert: Partial<PromotionRoomType> & Pick<PromotionRoomType, "promotion_id" | "room_type_id">; Update: Partial<PromotionRoomType> };
      promotion_rules: { Row: PromotionRule; Insert: Partial<PromotionRule> & Pick<PromotionRule, "promotion_id">; Update: Partial<PromotionRule> };
      promotion_usages: { Row: PromotionUsage; Insert: Partial<PromotionUsage> & Pick<PromotionUsage, "promotion_id" | "discount_amount">; Update: Partial<PromotionUsage> };
      booking_promotions: { Row: BookingPromotion; Insert: Partial<BookingPromotion> & Pick<BookingPromotion, "booking_id" | "promotion_id" | "promotion_name">; Update: Partial<BookingPromotion> };
      expense_categories: { Row: ExpenseCategory; Insert: Partial<ExpenseCategory> & Pick<ExpenseCategory, "hotel_id" | "name">; Update: Partial<ExpenseCategory> };
      expenses: { Row: Expense; Insert: Partial<Expense> & Pick<Expense, "hotel_id" | "amount">; Update: Partial<Expense> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      room_status: RoomStatus;
      housekeeping_status: HousekeepingStatus;
      booking_source: BookingSource;
      day_type: DayType;
      contact_type: ContactType;
      promotion_type: PromotionType;
    };
  };
}
