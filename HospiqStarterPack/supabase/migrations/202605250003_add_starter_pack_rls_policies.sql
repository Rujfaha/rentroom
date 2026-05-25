create schema if not exists app_private;

create or replace function app_private.current_account_role()
returns account_role
language sql
security definer
set search_path = public
stable
as $$
  select role
  from accounts
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

create or replace function app_private.current_account_hotel_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hotel_id
  from accounts
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

create or replace function app_private.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(app_private.current_account_role() = 'super_admin', false)
$$;

create or replace function app_private.can_access_hotel(target_hotel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    app_private.is_super_admin()
    or app_private.current_account_hotel_id() = target_hotel_id,
    false
  )
$$;

grant usage on schema app_private to authenticated, service_role;
grant execute on all functions in schema app_private to authenticated, service_role;

grant select, insert, update, delete on
  accounts,
  hotels,
  roomtypes,
  roomtype_images,
  roomtype_amenities,
  rooms,
  bookings,
  line_configs,
  line_sessions,
  line_chat_history,
  line_handoff_events,
  ai_settings,
  ai_faqs,
  ai_testcases,
  hotel_images,
  promotions
to authenticated;

grant all privileges on
  accounts,
  hotels,
  roomtypes,
  roomtype_images,
  roomtype_amenities,
  rooms,
  bookings,
  line_configs,
  line_sessions,
  line_chat_history,
  line_handoff_events,
  ai_settings,
  ai_faqs,
  ai_testcases,
  hotel_images,
  promotions
to service_role;

create policy accounts_select_own_or_super_admin on accounts
  for select
  to authenticated
  using (id = auth.uid() or app_private.is_super_admin());

create policy accounts_update_super_admin on accounts
  for update
  to authenticated
  using (app_private.is_super_admin())
  with check (app_private.is_super_admin());

create policy accounts_insert_super_admin on accounts
  for insert
  to authenticated
  with check (app_private.is_super_admin());

create policy hotels_select_accessible on hotels
  for select
  to authenticated
  using (app_private.can_access_hotel(id));

create policy hotels_update_accessible on hotels
  for update
  to authenticated
  using (app_private.can_access_hotel(id))
  with check (app_private.can_access_hotel(id));

create policy hotels_insert_super_admin on hotels
  for insert
  to authenticated
  with check (app_private.is_super_admin());

create policy roomtypes_all_accessible on roomtypes
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy roomtype_images_all_accessible on roomtype_images
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy roomtype_amenities_all_accessible on roomtype_amenities
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy rooms_all_accessible on rooms
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy bookings_all_accessible on bookings
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy line_configs_all_accessible on line_configs
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy line_sessions_all_accessible on line_sessions
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy line_chat_history_all_accessible on line_chat_history
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy line_handoff_events_all_accessible on line_handoff_events
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy ai_settings_all_accessible on ai_settings
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy ai_faqs_all_accessible on ai_faqs
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy ai_testcases_all_accessible on ai_testcases
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy hotel_images_all_accessible on hotel_images
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));

create policy promotions_all_accessible on promotions
  for all
  to authenticated
  using (app_private.can_access_hotel(hotel_id))
  with check (app_private.can_access_hotel(hotel_id));
