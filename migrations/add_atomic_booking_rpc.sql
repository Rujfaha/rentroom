CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_hotel_id UUID,
  p_room_type_id UUID,
  p_preferred_room_id UUID,
  p_booking_number VARCHAR,
  p_check_in_date DATE,
  p_check_out_date DATE,
  p_num_guests INT,
  p_source booking_source,
  p_total_amount NUMERIC,
  p_discount_amount NUMERIC,
  p_net_amount NUMERIC,
  p_customer_full_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_email VARCHAR,
  p_customer_notes TEXT,
  p_special_requests TEXT,
  p_booking_notes TEXT,
  p_created_by UUID,
  p_payment_amount NUMERIC DEFAULT NULL,
  p_payment_method payment_method DEFAULT NULL,
  p_payment_status payment_status DEFAULT 'pending',
  p_slip_image_url TEXT DEFAULT NULL,
  p_transaction_ref VARCHAR DEFAULT NULL,
  p_payment_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  booking_number VARCHAR,
  room_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_room_id UUID;
  v_customer_id UUID;
  v_booking_id UUID;
BEGIN
  IF p_check_out_date <= p_check_in_date THEN
    RAISE EXCEPTION 'INVALID_DATE_RANGE';
  END IF;

  SELECT rooms.id
  INTO v_room_id
  FROM rooms
  WHERE rooms.hotel_id = p_hotel_id
    AND rooms.room_type_id = p_room_type_id
    AND rooms.is_active = TRUE
    AND rooms.status IN ('available', 'occupied')
    AND (p_preferred_room_id IS NULL OR rooms.id = p_preferred_room_id)
    AND NOT EXISTS (
      SELECT 1
      FROM bookings
      WHERE bookings.hotel_id = p_hotel_id
        AND bookings.room_id = rooms.id
        AND bookings.status IN ('pending', 'confirmed', 'checked_in')
        AND bookings.check_in_date < p_check_out_date
        AND bookings.check_out_date > p_check_in_date
    )
  ORDER BY rooms.room_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'ROOM_NOT_AVAILABLE';
  END IF;

  SELECT customers.id
  INTO v_customer_id
  FROM customers
  WHERE customers.hotel_id = p_hotel_id
    AND (
      (p_customer_phone IS NOT NULL AND p_customer_phone <> '' AND customers.phone = p_customer_phone)
      OR (p_customer_email IS NOT NULL AND p_customer_email <> '' AND LOWER(customers.email) = LOWER(p_customer_email))
    )
  ORDER BY customers.updated_at DESC
  LIMIT 1
  FOR UPDATE;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (hotel_id, full_name, phone, email, notes)
    VALUES (p_hotel_id, p_customer_full_name, p_customer_phone, p_customer_email, p_customer_notes)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE customers
    SET
      full_name = p_customer_full_name,
      phone = NULLIF(p_customer_phone, ''),
      email = NULLIF(p_customer_email, ''),
      notes = NULLIF(p_customer_notes, ''),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  INSERT INTO bookings (
    hotel_id,
    room_id,
    customer_id,
    booking_number,
    check_in_date,
    check_out_date,
    num_guests,
    status,
    source,
    total_amount,
    discount_amount,
    net_amount,
    special_requests,
    notes,
    created_by
  )
  VALUES (
    p_hotel_id,
    v_room_id,
    v_customer_id,
    p_booking_number,
    p_check_in_date,
    p_check_out_date,
    GREATEST(1, p_num_guests),
    'pending',
    p_source,
    COALESCE(p_total_amount, 0),
    COALESCE(p_discount_amount, 0),
    COALESCE(p_net_amount, 0),
    NULLIF(p_special_requests, ''),
    NULLIF(p_booking_notes, ''),
    p_created_by
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO booking_guests (booking_id, hotel_id, full_name, phone, is_primary)
  VALUES (v_booking_id, p_hotel_id, p_customer_full_name, p_customer_phone, TRUE);

  IF p_payment_amount IS NOT NULL AND p_payment_amount > 0 THEN
    INSERT INTO payments (
      hotel_id,
      booking_id,
      amount,
      method,
      status,
      slip_image_url,
      transaction_ref,
      verified_by,
      verified_at,
      notes
    )
    VALUES (
      p_hotel_id,
      v_booking_id,
      p_payment_amount,
      COALESCE(p_payment_method, 'cash'),
      COALESCE(p_payment_status, 'pending'),
      NULLIF(p_slip_image_url, ''),
      NULLIF(p_transaction_ref, ''),
      CASE WHEN COALESCE(p_payment_status, 'pending') = 'verified' THEN p_created_by ELSE NULL END,
      CASE WHEN COALESCE(p_payment_status, 'pending') = 'verified' THEN NOW() ELSE NULL END,
      NULLIF(p_payment_notes, '')
    );
  END IF;

  RETURN QUERY SELECT v_booking_id, p_booking_number, v_room_id;
END;
$$;
