export interface CmsRoomTypeImage {
  id: string;
  image_url: string;
  alt_text?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
}

export interface CmsRoomType {
  id: string;
  name: string;
  description?: string | null;
  base_price: number;
  max_guests: number;
  bed_type?: string | null;
  room_size?: number | null;
  amenities?: string[] | null;
  is_active?: boolean | null;
  images: CmsRoomTypeImage[];
}
