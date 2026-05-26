create extension if not exists "pgcrypto";

do $$
begin
  create type account_role as enum ('super_admin', 'hotel_admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type account_status as enum ('active', 'inactive', 'pending');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hotel_status as enum ('active', 'inactive', 'setup_required');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type booking_status as enum ('lead', 'pending', 'confirmed', 'cancelled', 'rejected', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type booking_source as enum ('line_ai', 'manual_admin', 'webbooking', 'other');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type line_role as enum ('guest', 'hotel_admin', 'unknown');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type chat_direction as enum ('incoming', 'outgoing');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hotel_image_type as enum ('banner', 'showcase', 'gallery');
exception when duplicate_object then null;
end $$;

create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  description text,
  contact_phone text,
  contact_email text,
  line_oa_id text,
  facebook_url text,
  website_url text,
  map_url text,
  has_webbooking boolean not null default false,
  webbooking_url text,
  onboarding_completed boolean not null default false,
  status hotel_status not null default 'setup_required',
  admin_verify_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role account_role not null,
  hotel_id uuid references hotels(id) on delete set null,
  status account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hotel_admin_requires_hotel check (
    role <> 'hotel_admin' or hotel_id is not null
  )
);

create table if not exists roomtypes (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  description text,
  mood_description text,
  base_price numeric(12,2) not null default 0,
  bed_type text,
  bed_size text,
  standard_capacity integer not null default 2,
  max_capacity integer not null default 2,
  max_extra_beds integer not null default 0,
  extra_bed_price numeric(12,2) not null default 0,
  pet_policy text,
  total_rooms integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table if not exists roomtype_images (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid not null references roomtypes(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists roomtype_amenities (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid not null references roomtypes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (roomtype_id, name)
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid references roomtypes(id) on delete set null,
  guest_name text,
  guest_phone text,
  guest_line_user_id text,
  checkin_date date,
  checkout_date date,
  guest_count integer not null default 1,
  room_count integer not null default 1,
  status booking_status not null default 'lead',
  source booking_source not null default 'line_ai',
  note text,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates_order check (
    checkin_date is null or checkout_date is null or checkout_date > checkin_date
  )
);

create table if not exists line_configs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references hotels(id) on delete cascade,
  channel_id text,
  channel_secret text,
  channel_access_token text,
  webhook_url text,
  is_configured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists line_sessions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  line_user_id text not null,
  display_name text,
  role_in_line line_role not null default 'guest',
  admin_verified_at timestamptz,
  last_intent text,
  memory jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, line_user_id)
);

create table if not exists line_chat_history (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  line_session_id uuid references line_sessions(id) on delete set null,
  line_user_id text,
  direction chat_direction not null,
  message_type text not null default 'text',
  message_text text,
  intent text,
  ai_response_source text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai_settings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null unique references hotels(id) on delete cascade,
  assistant_name text not null default 'Hospiq',
  assistant_gender_tone text not null default 'female_polite',
  language text not null default 'th',
  tone text,
  sale_mode_enabled boolean not null default true,
  fallback_to_admin_enabled boolean not null default true,
  admin_contact_message text,
  system_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_faqs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  question text not null,
  answer text not null,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hotel_images (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  image_type hotel_image_type not null,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists hotels_updated_at on hotels;
create trigger hotels_updated_at before update on hotels for each row execute function update_updated_at_column();
drop trigger if exists accounts_updated_at on accounts;
create trigger accounts_updated_at before update on accounts for each row execute function update_updated_at_column();
drop trigger if exists roomtypes_updated_at on roomtypes;
create trigger roomtypes_updated_at before update on roomtypes for each row execute function update_updated_at_column();
drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings for each row execute function update_updated_at_column();
drop trigger if exists line_configs_updated_at on line_configs;
create trigger line_configs_updated_at before update on line_configs for each row execute function update_updated_at_column();
drop trigger if exists line_sessions_updated_at on line_sessions;
create trigger line_sessions_updated_at before update on line_sessions for each row execute function update_updated_at_column();
drop trigger if exists ai_settings_updated_at on ai_settings;
create trigger ai_settings_updated_at before update on ai_settings for each row execute function update_updated_at_column();
drop trigger if exists ai_faqs_updated_at on ai_faqs;
create trigger ai_faqs_updated_at before update on ai_faqs for each row execute function update_updated_at_column();
drop trigger if exists promotions_updated_at on promotions;
create trigger promotions_updated_at before update on promotions for each row execute function update_updated_at_column();

create index if not exists hotels_status_idx on hotels(status);
create index if not exists accounts_hotel_idx on accounts(hotel_id);
create index if not exists roomtypes_hotel_active_idx on roomtypes(hotel_id, is_active);
create index if not exists roomtype_images_roomtype_idx on roomtype_images(roomtype_id, sort_order);
create index if not exists bookings_hotel_status_idx on bookings(hotel_id, status, created_at desc);
create index if not exists line_sessions_hotel_user_idx on line_sessions(hotel_id, line_user_id);
create index if not exists line_chat_history_session_idx on line_chat_history(line_session_id, created_at desc);
create index if not exists ai_faqs_hotel_active_idx on ai_faqs(hotel_id, is_active);
create index if not exists promotions_hotel_active_idx on promotions(hotel_id, is_active);

alter table hotels enable row level security;
alter table accounts enable row level security;
alter table roomtypes enable row level security;
alter table roomtype_images enable row level security;
alter table roomtype_amenities enable row level security;
alter table bookings enable row level security;
alter table line_configs enable row level security;
alter table line_sessions enable row level security;
alter table line_chat_history enable row level security;
alter table ai_settings enable row level security;
alter table ai_faqs enable row level security;
alter table hotel_images enable row level security;
alter table promotions enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;
grant usage on all sequences in schema public to authenticated, service_role;
