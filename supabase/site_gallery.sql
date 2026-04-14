insert into storage.buckets (id, name, public)
values ('site-gallery', 'site-gallery', true)
on conflict (id) do update set public = true;

do $$
begin
  create policy "public_read_site_gallery"
  on storage.objects
  for select
  to public
  using (bucket_id = 'site-gallery');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin_insert_site_gallery"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'site-gallery' and public.is_admin());
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin_update_site_gallery"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'site-gallery' and public.is_admin())
  with check (bucket_id = 'site-gallery' and public.is_admin());
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create policy "admin_delete_site_gallery"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'site-gallery' and public.is_admin());
exception
  when duplicate_object then null;
end $$;
