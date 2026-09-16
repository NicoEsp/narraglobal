-- ============================================================================
-- PEDIDOS · la demo del Narra ID y el reporte Santa Fe 2026
-- La landing nueva ya no vende el Narra ID desde el hero: pide una demo sin
-- cargo (/posicion, política o negocios) y regala el reporte (/reporte). Los
-- dos formularios guardan acá; el equipo los ve en el back office y manda la
-- demo o el reporte a mano por WhatsApp, que es lo que promete la landing.
--
-- Seguridad: el mismo modelo que political_contacts. La web no inserta
-- directo: llama a enviar_pedido (SECURITY DEFINER), que valida lo mínimo,
-- corta al que llenó el honeypot y tolera hasta cinco pedidos por teléfono
-- cada 24 h. Leer, editar y borrar es cosa del rol admin.
-- ============================================================================

create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('demo_persona', 'demo_empresa', 'reporte')),
  telefono    text not null,                       -- WhatsApp normalizado: +<dígitos>
  email       text,                                -- en la demo es el alta del tablero
  datos       jsonb not null default '{}'::jsonb,  -- el resto del formulario, según el tipo
  origen      text not null default 'web',
  created_at  timestamptz not null default now()
);

alter table public.pedidos enable row level security;

drop policy if exists "Admins gestionan pedidos" on public.pedidos;
create policy "Admins gestionan pedidos"
on public.pedidos
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create index if not exists idx_pedidos_created_at
  on public.pedidos (created_at desc);
create index if not exists idx_pedidos_telefono_created_at
  on public.pedidos (telefono, created_at desc);

-- enviar_pedido: lo llama la web con la clave anon. Devuelve el id del pedido.
create or replace function public.enviar_pedido(
  p_tipo      text,
  p_telefono  text,
  p_email     text  default null,
  p_datos     jsonb default '{}'::jsonb,
  p_honeypot  text  default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefono text := '+' || regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_email    text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_datos    jsonb := coalesce(p_datos, '{}'::jsonb);
  v_recientes int;
  v_id       uuid;
begin
  -- El campo trampa: una persona no lo ve, un bot lo llena.
  if coalesce(trim(p_honeypot), '') <> '' then
    raise exception 'Bot detected' using errcode = 'P0001';
  end if;

  if p_tipo not in ('demo_persona', 'demo_empresa', 'reporte') then
    raise exception 'pedido_invalido' using hint = 'Tipo de pedido desconocido.';
  end if;
  if jsonb_typeof(v_datos) <> 'object' then
    raise exception 'pedido_invalido' using hint = 'datos debe ser un objeto.';
  end if;

  -- Sin WhatsApp no hay a dónde mandar nada: código de país y número.
  if length(v_telefono) < 9 then
    raise exception 'pedido_invalido' using hint = 'Hace falta un WhatsApp con código de país.';
  end if;
  if v_email is not null and position('@' in v_email) = 0 then
    raise exception 'pedido_invalido' using hint = 'El correo no parece un correo.';
  end if;

  -- La demo se entrega por WhatsApp pero el alta del tablero es por correo.
  if p_tipo in ('demo_persona', 'demo_empresa') and v_email is null then
    raise exception 'pedido_invalido' using hint = 'La demo necesita un correo para el alta del tablero.';
  end if;
  if p_tipo = 'demo_persona' and coalesce(trim(v_datos->>'cuenta'), '') = '' then
    raise exception 'pedido_invalido' using hint = 'La demo de política necesita la cuenta que se mide.';
  end if;
  if p_tipo = 'demo_empresa' and coalesce(trim(v_datos->>'empresa'), '') = '' then
    raise exception 'pedido_invalido' using hint = 'La demo de negocios necesita la empresa.';
  end if;

  -- Tope por teléfono: cinco pedidos por día alcanzan para cualquier persona.
  select count(*) into v_recientes
  from public.pedidos
  where telefono = v_telefono
    and created_at > now() - interval '24 hours';
  if v_recientes >= 5 then
    raise exception 'Rate limit exceeded. Please try again later.' using errcode = 'P0001';
  end if;

  insert into public.pedidos (tipo, telefono, email, datos)
  values (p_tipo, v_telefono, v_email, v_datos)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.enviar_pedido(text, text, text, jsonb, text) from public;
grant execute on function public.enviar_pedido(text, text, text, jsonb, text) to anon, authenticated;
