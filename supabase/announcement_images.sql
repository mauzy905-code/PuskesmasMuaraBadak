alter table public.announcements
add column if not exists image_url text,
add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('announcement-images', 'announcement-images', true)
on conflict (id) do update set public = true;

create policy "public_read_announcement_images"
on storage.objects
for select
to public
using (bucket_id = 'announcement-images');

create policy "admin_insert_announcement_images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'announcement-images' and public.is_admin());

create policy "admin_update_announcement_images"
on storage.objects
for update
to authenticated
using (bucket_id = 'announcement-images' and public.is_admin())
with check (bucket_id = 'announcement-images' and public.is_admin());

create policy "admin_delete_announcement_images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'announcement-images' and public.is_admin());
