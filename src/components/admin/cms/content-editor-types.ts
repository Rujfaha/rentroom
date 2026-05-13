export interface CmsHeroSlide {
  id: string;
  image_url?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  is_active?: boolean | null;
}

export interface CmsAttraction {
  id: string;
  name?: string | null;
  description?: string | null;
  image_url?: string | null;
  distance_km?: number | string | null;
  map_url?: string | null;
  is_visible?: boolean | null;
}

export type CmsDiscountType = "percent" | "fixed";

export interface CmsPromotion {
  id: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  discount_type?: CmsDiscountType | null;
  discount_percentage?: number | string | null;
  discount_amount?: number | string | null;
  discount_code?: string | null;
  discount_text?: string | null;
  valid_until?: string | null;
  is_active?: boolean | null;
}
