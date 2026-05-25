insert into hotels (
  id,
  name,
  slug,
  description,
  contact_phone,
  has_webbooking,
  status,
  admin_verify_code
) values (
  '11111111-1111-1111-1111-111111111111',
  'Hospiq Demo Hotel',
  'hospiq-demo',
  'Demo accommodation for Hospiq Starter Pack development.',
  '000-000-0000',
  false,
  'setup_required',
  'HOSPIQ-DEMO'
) on conflict (id) do nothing;

insert into ai_settings (hotel_id)
values ('11111111-1111-1111-1111-111111111111')
on conflict (hotel_id) do nothing;

insert into roomtypes (
  hotel_id,
  name,
  description,
  mood_description,
  base_price,
  standard_capacity,
  max_capacity,
  total_rooms
) values (
  '11111111-1111-1111-1111-111111111111',
  'Standard',
  'Simple room for two guests.',
  'Quiet and practical room for short stays.',
  900,
  2,
  2,
  5
) on conflict (hotel_id, name) do nothing;
