create extension if not exists vector;

do $$
begin
  create type line_session_status as enum ('open', 'handoff', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type lead_status as enum ('new', 'contacted', 'converted', 'lost');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type starter_room_status as enum ('available', 'occupied', 'maintenance', 'inactive');
exception when duplicate_object then null;
end $$;

alter table line_sessions
  add column if not exists status line_session_status not null default 'open';

alter table line_chat_history
  add column if not exists ai_provider text,
  add column if not exists ai_model text;

create table if not exists line_handoff_events (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  line_session_id uuid references line_sessions(id) on delete set null,
  line_user_id text,
  reason text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  source_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table roomtypes
  add column if not exists room_size text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_featured boolean not null default false,
  add column if not exists price_note text;

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  roomtype_id uuid not null references roomtypes(id) on delete restrict,
  room_number text not null,
  floor text,
  status starter_room_status not null default 'available',
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, room_number)
);

alter table bookings
  add column if not exists line_session_id uuid references line_sessions(id) on delete set null,
  add column if not exists lead_status lead_status not null default 'new',
  add column if not exists preferred_contact_channel text,
  add column if not exists conversation_summary text,
  add column if not exists webbooking_redirected_at timestamptz,
  add column if not exists admin_note text;

alter table ai_settings
  add column if not exists supported_languages jsonb not null default '["th"]'::jsonb,
  add column if not exists booking_cta_policy text,
  add column if not exists handoff_policy text,
  add column if not exists fallback_policy text,
  add column if not exists max_reply_length integer not null default 900;

alter table ai_faqs
  add column if not exists language text not null default 'th',
  add column if not exists keywords jsonb not null default '[]'::jsonb,
  add column if not exists sort_order integer not null default 0,
  add column if not exists embedding vector(768);

create table if not exists ai_testcases (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  user_message text not null,
  expected_intent text,
  expected_entities jsonb not null default '{}'::jsonb,
  expected_behavior text,
  golden_reply text,
  language text not null default 'th',
  tags jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists rooms_updated_at on rooms;
create trigger rooms_updated_at before update on rooms for each row execute function update_updated_at_column();
drop trigger if exists ai_testcases_updated_at on ai_testcases;
create trigger ai_testcases_updated_at before update on ai_testcases for each row execute function update_updated_at_column();

create index if not exists line_sessions_hotel_status_idx on line_sessions(hotel_id, status, last_seen_at desc);
create index if not exists line_chat_history_user_created_idx on line_chat_history(hotel_id, line_user_id, created_at desc);
create index if not exists line_handoff_events_hotel_status_idx on line_handoff_events(hotel_id, status, created_at desc);
create index if not exists line_handoff_events_session_idx on line_handoff_events(line_session_id, created_at desc);
create index if not exists roomtypes_hotel_sort_idx on roomtypes(hotel_id, is_active, sort_order, base_price);
create index if not exists rooms_hotel_roomtype_status_idx on rooms(hotel_id, roomtype_id, is_active, status);
create index if not exists bookings_line_session_idx on bookings(line_session_id, created_at desc);
create index if not exists bookings_hotel_lead_status_idx on bookings(hotel_id, lead_status, created_at desc);
create index if not exists ai_faqs_hotel_language_active_idx on ai_faqs(hotel_id, language, is_active, sort_order);
create index if not exists ai_faqs_hotel_keywords_idx on ai_faqs using gin (keywords);
create index if not exists ai_faqs_embedding_idx on ai_faqs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists ai_testcases_hotel_language_active_idx on ai_testcases(hotel_id, language, is_active, created_at desc);

alter table line_handoff_events enable row level security;
alter table rooms enable row level security;
alter table ai_testcases enable row level security;

grant select, insert, update, delete on line_handoff_events, rooms, ai_testcases to authenticated;
grant all privileges on line_handoff_events, rooms, ai_testcases to service_role;
