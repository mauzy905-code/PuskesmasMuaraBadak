alter table public.settings enable row level security;
create policy "public_read_settings" on public.settings for select using (true);
create policy "admin_write_settings" on public.settings for insert with check (public.is_admin());
create policy "admin_update_settings" on public.settings for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_settings" on public.settings for delete using (public.is_admin());

alter table public.announcements enable row level security;
create policy "public_read_published_announcements" on public.announcements for select using (is_published = true);
create policy "admin_insert_announcements" on public.announcements for insert with check (public.is_admin());
create policy "admin_update_announcements" on public.announcements for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_announcements" on public.announcements for delete using (public.is_admin());

alter table public.registrations enable row level security;
create policy "public_insert_registrations" on public.registrations for insert with check (true);
create policy "admin_select_registrations" on public.registrations for select using (public.is_admin());
create policy "admin_update_registrations" on public.registrations for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_registrations" on public.registrations for delete using (public.is_admin());

alter table public.queue_daily enable row level security;
create policy "public_read_queue_daily" on public.queue_daily for select using (true);
create policy "admin_insert_queue_daily" on public.queue_daily for insert with check (public.is_admin());
create policy "admin_update_queue_daily" on public.queue_daily for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_queue_daily" on public.queue_daily for delete using (public.is_admin());

alter table public.daily_services enable row level security;
create policy "public_read_daily_services" on public.daily_services for select using (true);
create policy "admin_insert_daily_services" on public.daily_services for insert with check (public.is_admin());
create policy "admin_update_daily_services" on public.daily_services for update using (public.is_admin()) with check (public.is_admin());
create policy "admin_delete_daily_services" on public.daily_services for delete using (public.is_admin());

alter table public.feedbacks enable row level security;
create policy "public_insert_feedbacks" on public.feedbacks for insert with check (true);
create policy "admin_read_feedbacks" on public.feedbacks for select using (public.is_admin());
create policy "admin_delete_feedbacks" on public.feedbacks for delete using (public.is_admin());

alter table public.contact_messages enable row level security;
create policy "public_insert_contact_messages" on public.contact_messages for insert with check (true);
create policy "admin_select_contact_messages" on public.contact_messages for select using (public.is_admin());
create policy "admin_delete_contact_messages" on public.contact_messages for delete using (public.is_admin());

alter table public.admin_users enable row level security;
create policy "self_read_admin_users" on public.admin_users for select using (user_id = auth.uid());
create policy "admin_read_admin_users" on public.admin_users for select using (public.is_admin());
