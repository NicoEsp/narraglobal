-- ============================================================================
-- SUSCRIPCIONES Y TABLEROS
-- Dashboard de clientes bajo /suscripcion/{codigo} + back office en /admin.
-- El cliente entra con magic link (email verificado) y ve SOLO su tablero
-- publicado. El equipo (rol admin) gestiona suscripciones y semanas.
-- Modelo según ALTA-checklist: el store de clientes es una sola fuente de
-- verdad; estados pagó→borrador→activo→con_historico→live (+pausado);
-- semanas borrador→programado→publicado (sábado programa, el cron publica).
-- ============================================================================

-- 1) Suscripciones: el store de clientes (una fila por cliente)
create table if not exists public.suscripciones (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,                 -- el slug opaco de la URL
  nombre text not null,                        -- como se muestra ("Ciro · Senador…")
  email text not null,                         -- la llave del magic link
  telefono text,                               -- WhatsApp; lo captura narrachat
  plan text not null default 'base' check (plan in ('base','demo','pro')),
  demo_expira timestamptz,                     -- solo plan demo/cortesía
  estado text not null default 'activo'
    check (estado in ('borrador','activo','con_historico','live','pausado')),
  token uuid not null default gen_random_uuid(), -- one-time: pago ↔ narrachat ↔ tablero
  pulso_dia text not null default 'dom'
    check (pulso_dia in ('lun','mar','mie','jue','vie','sab','dom')),
  pulso_hora time not null default '09:00',
  tz text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suscripciones_email_idx
  on public.suscripciones (lower(email));

-- 2) Tableros: el JSON NARRA (schema_version 1) de cada semana
create table if not exists public.tableros (
  id uuid primary key default gen_random_uuid(),
  suscripcion_id uuid not null references public.suscripciones(id) on delete cascade,
  semana text not null default '',
  datos jsonb not null,
  estado text not null default 'borrador'
    check (estado in ('borrador','programado','publicado')),
  programado_para timestamptz,                 -- cuándo pasa a publicado
  avisado_en timestamptz,                      -- idempotencia del aviso semanal (fase narrachat)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tableros_suscripcion_idx
  on public.tableros (suscripcion_id, estado, updated_at desc);

-- 3) updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists suscripciones_set_updated_at on public.suscripciones;
create trigger suscripciones_set_updated_at
before update on public.suscripciones
for each row execute function public.set_updated_at();

drop trigger if exists tableros_set_updated_at on public.tableros;
create trigger tableros_set_updated_at
before update on public.tableros
for each row execute function public.set_updated_at();

-- 4) RLS: el navegador solo recibe lo del cliente logueado
alter table public.suscripciones enable row level security;
alter table public.tableros enable row level security;

-- El cliente ve su suscripción (por el email verificado del magic link);
-- la pantalla decide qué mostrar según estado (pausado, en espera, live…)
drop policy if exists "Clientes ven su suscripcion" on public.suscripciones;
create policy "Clientes ven su suscripcion"
on public.suscripciones
for select
to authenticated
using (
  lower(email) = lower(coalesce(auth.jwt()->>'email',''))
  or public.has_role(auth.uid(), 'admin')
);

-- Solo admins crean/editan/borran suscripciones
drop policy if exists "Admins gestionan suscripciones" on public.suscripciones;
create policy "Admins gestionan suscripciones"
on public.suscripciones
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- El cliente ve SOLO semanas publicadas de su suscripción no pausada;
-- borradores y programados son del equipo
drop policy if exists "Clientes ven su tablero publicado" on public.tableros;
create policy "Clientes ven su tablero publicado"
on public.tableros
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or (
    estado = 'publicado'
    and exists (
      select 1 from public.suscripciones s
      where s.id = tableros.suscripcion_id
        and s.estado <> 'pausado'
        and lower(s.email) = lower(coalesce(auth.jwt()->>'email',''))
    )
  )
);

drop policy if exists "Admins gestionan tableros" on public.tableros;
create policy "Admins gestionan tableros"
on public.tableros
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 5) Altas de admin por email: el rol llega solo con el primer login
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

drop policy if exists "Admins gestionan admin_emails" on public.admin_emails;
create policy "Admins gestionan admin_emails"
on public.admin_emails
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Para sumar otro admin (p. ej. Lisandro): insertar su email acá y listo.
insert into public.admin_emails (email) values
  ('nicolassespindola@gmail.com')
on conflict (email) do nothing;

create or replace function public.grant_admin_if_listed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(new.email)
  ) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_grant_admin on auth.users;
create trigger on_auth_user_created_grant_admin
after insert on auth.users
for each row execute function public.grant_admin_if_listed();

-- Usuarios que ya existían con email de admin reciben el rol ahora
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
join public.admin_emails a on lower(a.email) = lower(u.email)
on conflict (user_id, role) do nothing;

-- 6) El flip programado→publicado, dentro de la base (pg_cron cada 5 min).
--    "Sábado Lisandro programa → domingo se publica". El aviso de WhatsApp
--    (narrachat) se suma en su fase; avisado_en ya deja la idempotencia lista.
create or replace function public.publicar_tableros_programados()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.tableros
  set estado = 'publicado'
  where estado = 'programado'
    and programado_para is not null
    and programado_para <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'publicar-tableros-programados',
    '*/5 * * * *',
    $cron$select public.publicar_tableros_programados()$cron$
  );
exception when others then
  raise notice 'pg_cron no disponible (%). Habilitar la extensión pg_cron en el dashboard y re-ejecutar este bloque, o publicar manualmente desde el back office.', sqlerrm;
end;
$$;
