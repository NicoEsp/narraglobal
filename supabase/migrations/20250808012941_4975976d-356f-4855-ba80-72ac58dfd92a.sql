
-- 1) Crear bucket público para logos (idempotente)
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;

-- 2) Políticas de lectura/listado (SELECT) para el bucket "client-logos"
-- Permite que el frontend (visitantes anónimos) pueda listar objetos y así renderizar logos.
create policy "Public can list and read client-logos"
on storage.objects
for select
using (bucket_id = 'client-logos');

-- 3) Solo administradores pueden subir (INSERT) al bucket
create policy "Admins can upload client-logos"
on storage.objects
for insert
with check (
  bucket_id = 'client-logos'
  and has_role(auth.uid(), 'admin'::app_role)
  and lower(name) ~ '\\.(png|jpe?g|svg|webp)$'
);

-- 4) Solo administradores pueden modificar (UPDATE) objetos del bucket
create policy "Admins can update client-logos"
on storage.objects
for update
using (
  bucket_id = 'client-logos'
  and has_role(auth.uid(), 'admin'::app_role)
)
with check (
  bucket_id = 'client-logos'
  and has_role(auth.uid(), 'admin'::app_role)
);

-- 5) Solo administradores pueden borrar (DELETE) objetos del bucket
create policy "Admins can delete client-logos"
on storage.objects
for delete
using (
  bucket_id = 'client-logos'
  and has_role(auth.uid(), 'admin'::app_role)
);
