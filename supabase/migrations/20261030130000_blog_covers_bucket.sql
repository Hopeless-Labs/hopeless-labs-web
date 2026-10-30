-- Public bucket for blog cover images.
-- Objects are world-readable so <img src> works from the static site; only
-- admins may upload, replace, or delete.

insert into storage.buckets (id, name, public)
values ('blog-covers', 'blog-covers', true)
on conflict (id) do nothing;

create policy "blog-covers: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'blog-covers');

create policy "blog-covers: admins insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-covers' and public.is_admin());

create policy "blog-covers: admins update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-covers' and public.is_admin())
  with check (bucket_id = 'blog-covers' and public.is_admin());

create policy "blog-covers: admins delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-covers' and public.is_admin());
