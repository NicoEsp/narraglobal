-- ============================================================================
-- PEDIDOS · activar el Narra ID desde la landing (/activar)
--
-- La landing ya no pide una demo: el botón «Activá tu Narra ID» lleva a
-- /activar, que guarda el pedido acá (tipo 'narra_id') y manda a pagar con
-- un link fijo: Mercado Pago (suscripción en pesos), PayPal o efectivo
-- coordinado por WhatsApp. Con links fijos el sitio no se entera solo del
-- pago: el equipo lo cruza con el mail de MP o PayPal y lo marca en el back
-- office, que es lo que guarda pagado_en.
--
-- Cambios: el tipo nuevo en el check, la columna pagado_en y enviar_pedido
-- aceptando 'narra_id' (pide correo y la cuenta a medir). El resto de la
-- función queda igual a 20260916151418_enviar_pedido_tope_en_serie.sql.
-- ============================================================================

alter table public.pedidos drop constraint if exists pedidos_tipo_check;
alter table public.pedidos
  add constraint pedidos_tipo_check
  check (tipo in ('demo_persona', 'demo_empresa', 'reporte', 'narra_id'));

alter table public.pedidos add column if not exists pagado_en timestamptz;

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
  v_telefono text := regexp_replace(coalesce(p_telefono, ''), '[\s().-]', '', 'g');
  v_email    text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_datos    jsonb := coalesce(p_datos, '{}'::jsonb);
  v_recientes int;
  v_id       uuid;
begin
  -- El campo trampa: una persona no lo ve, un bot lo llena.
  if coalesce(trim(p_honeypot), '') <> '' then
    raise exception 'Bot detected' using errcode = 'P0001';
  end if;

  if p_tipo not in ('demo_persona', 'demo_empresa', 'reporte', 'narra_id') then
    raise exception 'pedido_invalido' using hint = 'Tipo de pedido desconocido.';
  end if;
  if jsonb_typeof(v_datos) <> 'object' then
    raise exception 'pedido_invalido' using hint = 'datos debe ser un objeto.';
  end if;

  -- Sin el «+» y el código de país no hay a dónde mandar nada.
  if v_telefono !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'pedido_invalido'
      using hint = 'Escribí tu WhatsApp con el código de país y el + adelante: +54 9 341 555 1234.';
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

  -- Activar el Narra ID: el correo es el alta del tablero y la cuenta, lo que se mide.
  if p_tipo = 'narra_id' and v_email is null then
    raise exception 'pedido_invalido' using hint = 'Hace falta un correo para el alta del tablero.';
  end if;
  if p_tipo = 'narra_id' and coalesce(trim(v_datos->>'cuenta'), '') = '' then
    raise exception 'pedido_invalido' using hint = 'Hace falta la cuenta que medimos.';
  end if;

  -- Tope por teléfono: cinco pedidos por día alcanzan para cualquier persona.
  -- El lock pone en fila a las llamadas con el mismo número, así el conteo y
  -- el insert van juntos; se suelta solo cuando termina la transacción.
  perform pg_advisory_xact_lock(0, hashtext(v_telefono));

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
