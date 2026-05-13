export type PromotionType = "automatic" | "code_required" | "private";
export type PromotionStatus = "active" | "inactive";
export type PromotionBenefitType = "percent" | "fixed" | "per_night" | "stay_x_pay_y" | "fixed_price" | "tiered_percent";
export type BookingChannel = "website" | "admin" | "walk_in" | "partner";

export interface PromotionCondition {
  min_nights?: number | null;
  max_nights?: number | null;
  min_subtotal?: number | null;
  max_subtotal?: number | null;
  days_of_week?: string[];
  booking_channels?: BookingChannel[];
  guest_count?: {
    min?: number | null;
    max?: number | null;
  };
}

export interface PromotionBenefitTier {
  min_nights: number;
  discount_percent: number;
}

export interface PromotionBenefit {
  type: PromotionBenefitType;
  discount_percent?: number | null;
  discount_amount?: number | null;
  per_night_amount?: number | null;
  stay_nights?: number | null;
  pay_nights?: number | null;
  fixed_price?: number | null;
  tiers?: PromotionBenefitTier[];
  max_discount_amount?: number | null;
}

export interface PromotionRow {
  id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_percentage: number | string | null;
  discount_amount: number | string | null;
  discount_code: string | null;
  discount_text: string | null;
  valid_until: string | null;
  is_active: boolean;
  promotion_type: PromotionType | null;
  starts_at: string | null;
  ends_at: string | null;
  stay_start_date: string | null;
  stay_end_date: string | null;
  priority: number | null;
  stackable: boolean | null;
  exclusive: boolean | null;
  max_uses: number | null;
  used_count: number | null;
  max_uses_per_customer: number | null;
  applies_to_all_room_types: boolean | null;
  promotion_rules?: Array<{
    id: string;
    conditions_json: unknown;
    benefits_json: unknown;
  }> | null;
  promotion_codes?: Array<{
    id: string;
    code: string;
    max_uses: number | null;
    used_count: number | null;
    is_active: boolean;
  }> | null;
  promotion_room_types?: Array<{
    room_type_id: string;
  }> | null;
}

export interface PromotionEvaluationInput {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  quantity: number;
  guests: number;
  subtotal: number;
  bookingChannel: BookingChannel;
  promotionCode?: string;
  customer?: {
    phone?: string;
    email?: string;
  };
  customerUsageByPromotionId?: Record<string, number>;
}

export interface PromotionBreakdown {
  promotionId: string;
  promotionName: string;
  promotionCodeId?: string;
  promotionCode?: string;
  discountType: PromotionBenefitType | "legacy_percent" | "legacy_fixed";
  discountValue: number;
  discountAmount: number;
  conditionsSnapshot: PromotionCondition;
  benefitsSnapshot: PromotionBenefit;
}

export interface PromotionEvaluationResult {
  valid: boolean;
  code: string;
  eligiblePromotions: PromotionBreakdown[];
  selectedPromotion: PromotionBreakdown | null;
  discountAmount: number;
  finalTotal: number;
  message?: string;
}
