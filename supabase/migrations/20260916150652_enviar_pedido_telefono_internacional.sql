-- ============================================================================
-- enviar_pedido · el WhatsApp tiene que venir en formato internacional explícito
--
-- La primera versión sacaba todo lo que no fuera dígito, le pegaba un «+» y
-- solo miraba el largo. Con eso «341 555 1234» (un número local, sin código
-- de país) pasaba y quedaba guardado como «+3415551234»: un destino al que el
-- equipo no puede escribir, y el link wa.me del back office apuntaba a nada.
--
-- Ahora el número tiene que llegar con el «+», el código de país y 8 a 15
-- dígitos en total (E.164); espacios, paréntesis y guiones se toleran y se
-- sacan. La web valida lo mismo antes de llamar (telefonoValido en
-- src/lib/pedidos.ts); acá se repite para quien llame a la RPC directo.
-- ============================================================================

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

  if p_tipo not in ('demo_persona', 'demo_empresa', 'reporte') then
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
