-- Safe production indexes for current app/admin queries.
-- This version is compatible with the Supabase SQL Editor, which may execute
-- statements inside a transaction block. Run during a low-traffic window.

CREATE INDEX idx_hotels_active_created ON hotels(is_active, created_at);

CREATE INDEX idx_hero_slides_live_sort ON hero_slides(hotel_id, is_active, sort_order);

CREATE INDEX idx_promotions_live_sort ON promotions(hotel_id, is_active, sort_order, created_at DESC);

CREATE INDEX idx_promotions_code_active ON promotions(hotel_id, lower(discount_code), is_active, valid_until) WHERE discount_code IS NOT NULL;

CREATE INDEX idx_contacts_live_sort ON cms_hotel_contacts(hotel_id, is_visible, sort_order);

CREATE INDEX idx_attractions_live_sort ON local_attractions(hotel_id, is_visible, sort_order);

CREATE INDEX idx_room_type_images_sort ON room_type_images(hotel_id, room_type_id, is_cover DESC, sort_order);

CREATE INDEX idx_rooms_available_by_type ON rooms(hotel_id, room_type_id, is_active, status, room_number);

CREATE INDEX idx_bookings_overlap_lookup ON bookings(hotel_id, room_id, status, check_in_date, check_out_date);

CREATE INDEX idx_customers_email_lookup ON customers(hotel_id, lower(email)) WHERE email IS NOT NULL;

CREATE INDEX idx_payments_booking_created ON payments(booking_id, created_at DESC);
