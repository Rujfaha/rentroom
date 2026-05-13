import type { BookingStatus, HousekeepingStatus, RoomStatus } from "@/types/database.types";

export interface AdminRoomTypeImage {
  id: string;
  image_url: string;
  is_cover?: boolean | null;
  sort_order?: number | null;
}

export interface AdminRoomType {
  id: string;
  name: string;
  description?: string | null;
  base_price?: number | string | null;
  max_guests?: number | string | null;
  amenities?: string[] | null;
  is_active?: boolean | null;
  room_type_images?: AdminRoomTypeImage[] | null;
  images?: AdminRoomTypeImage[];
}

export interface AdminRoomBooking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  check_in?: string;
  check_out?: string;
  status: BookingStatus;
  guest_name?: string;
  customers?: {
    full_name?: string | null;
  } | null;
}

export interface AdminRoom {
  id: string;
  room_type_id: string;
  room_number: string;
  floor?: string | null;
  status: RoomStatus;
  housekeeping?: HousekeepingStatus | string | null;
  notes?: string | null;
  is_active?: boolean | null;
  bookings?: AdminRoomBooking[];
  currentBooking?: AdminRoomBooking | null;
}
