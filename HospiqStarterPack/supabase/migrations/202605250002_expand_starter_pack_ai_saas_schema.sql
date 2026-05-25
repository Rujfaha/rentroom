create extension if not exists vector;

create type line_session_status as enum ('open', 'handoff', 'closed');
create type lead_status as enum ('new', 'contacted', 'converted', 'lost');
create type starter_room_status as enum ('available', 'occupied', 'maintenance', 'inactive');

alter table line_sessions
  add column status line_session_status not null default 'open';

alter table line_chat_history
  add column ai_provider text,
  add column ai_model text;

create table line_handoff_events (
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
  add column room_size text,
  add column sort_order integer not null default 0,
  add column is_featured boolean not null default false,
  add column price_note text;

create table rooms (
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
  add column line_session_id uuid references line_sessions(id) on delete set null,
  add column lead_status lead_status not null default 'new',
  add column preferred_contact_channel text,
  add column conversation_summary text,
  add column webbooking_redirected_at timestamptz,
  add column admin_note text;

alter table ai_settings
  add column supported_languages jsonb not null default '["th"]'::jsonb,
  add column booking_cta_policy text,
  add column handoff_policy text,
  add column fallback_policy text,
  add column max_reply_length integer not null default 900;

alter table ai_faqs
  add column language text not null default 'th',
  add column keywords jsonb not null default '[]'::jsonb,
  add column sort_order integer not null default 0,
  add column embedding vector(768);

create table ai_testcases (
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

create trigger rooms_updated_at before update on rooms for each row execute function update_updated_at_column();
create trigger ai_testcases_updated_at before update on ai_testcases for each row execute function update_updated_at_column();

create index line_sessions_hotel_status_idx on line_sessions(hotel_id, status, last_seen_at desc);
create index line_chat_history_user_created_idx on line_chat_history(hotel_id, line_user_id, created_at desc);
create index line_handoff_events_hotel_status_idx on line_handoff_events(hotel_id, status, created_at desc);
create index line_handoff_events_session_idx on line_handoff_events(line_session_id, created_at desc);
create index roomtypes_hotel_sort_idx on roomtypes(hotel_id, is_active, sort_order, base_price);
create index rooms_hotel_roomtype_status_idx on rooms(hotel_id, roomtype_id, is_active, status);
create index bookings_line_session_idx on bookings(line_session_id, created_at desc);
create index bookings_hotel_lead_status_idx on bookings(hotel_id, lead_status, created_at desc);
create index ai_faqs_hotel_language_active_idx on ai_faqs(hotel_id, language, is_active, sort_order);
create index ai_faqs_hotel_keywords_idx on ai_faqs using gin (keywords);
create index ai_faqs_embedding_idx on ai_faqs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index ai_testcases_hotel_language_active_idx on ai_testcases(hotel_id, language, is_active, created_at desc);

alter table line_handoff_events enable row level security;
alter table rooms enable row level security;
alter table ai_testcases enable row level security;

grant select, insert, update, delete on line_handoff_events, rooms, ai_testcases to authenticated;
grant all privileges on line_handoff_events, rooms, ai_testcases to service_role;
