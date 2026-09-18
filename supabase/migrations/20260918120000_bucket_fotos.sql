-- Álbum único de caras de los tableros: bucket público `fotos`.
-- Se creó a mano por SQL el 17-09-2026; esto lo deja registrado en el repo y es
-- idempotente, así que correrlo de nuevo sobre el proyecto no cambia nada.
-- Mismo patrón que `client-logos`: lectura pública, escritura sólo admin.

-- 1) Bucket público, 200 KB por archivo, sólo imágenes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 204800, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = 204800,
      allowed_mime_types = array['image/webp','image/jpeg','image/png'];

-- 2) Lectura pública (el tablero del cliente arma la cara con la URL pública)
drop policy if exists "Public can list and read fotos" on storage.objects;
create policy "Public can list and read fotos"
on storage.objects
for select
using (bucket_id = 'fotos');

-- 3) Subida sólo admin
drop policy if exists "Admins can upload fotos" on storage.objects;
create policy "Admins can upload fotos"
on storage.objects
for insert
with check (
  bucket_id = 'fotos'
  and has_role(auth.uid(), 'admin'::app_role)
  and lower(name) ~ '\.(png|jpe?g|webp)$'
);

-- 4) Actualización sólo admin
drop policy if exists "Admins can update fotos" on storage.objects;
create policy "Admins can update fotos"
on storage.objects
for update
using (
  bucket_id = 'fotos'
  and has_role(auth.uid(), 'admin'::app_role)
)
with check (
  bucket_id = 'fotos'
  and has_role(auth.uid(), 'admin'::app_role)
);

-- 5) Borrado sólo admin
drop policy if exists "Admins can delete fotos" on storage.objects;
create policy "Admins can delete fotos"
on storage.objects
for delete
using (
  bucket_id = 'fotos'
  and has_role(auth.uid(), 'admin'::app_role)
);
