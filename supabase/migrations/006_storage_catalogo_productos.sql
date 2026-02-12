-- Create public bucket for product catalog images and secure write access
-- Bucket: catalogo-productos
-- Path convention: productos/<producto_id>/<orden>.webp

-- 1) Create (or update) bucket as public-read
insert into storage.buckets (id, name, public)
values ('catalogo-productos', 'catalogo-productos', true)
on conflict (id) do update
set public = true;

-- 2) Ensure RLS is enabled on storage.objects (usually already enabled)
alter table storage.objects enable row level security;

-- 3) Public read (no auth required)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'catalogo_productos_public_read'
  ) then
    create policy catalogo_productos_public_read
    on storage.objects
    for select
    using (bucket_id = 'catalogo-productos');
  end if;
end $$;

-- 4) Admin-only upload
-- NOTE: storage operations are performed by authenticated users.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'catalogo_productos_admin_insert'
  ) then
    create policy catalogo_productos_admin_insert
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'catalogo-productos'
      and public.es_admin()
    );
  end if;
end $$;

-- 5) Admin-only delete
-- Allows removing/replacing images.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'catalogo_productos_admin_delete'
  ) then
    create policy catalogo_productos_admin_delete
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'catalogo-productos'
      and public.es_admin()
    );
  end if;
end $$;

-- 6) Admin-only update (needed for some upsert flows)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'catalogo_productos_admin_update'
  ) then
    create policy catalogo_productos_admin_update
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'catalogo-productos'
      and public.es_admin()
    )
    with check (
      bucket_id = 'catalogo-productos'
      and public.es_admin()
    );
  end if;
end $$;
