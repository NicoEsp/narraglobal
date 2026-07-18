-- ============================================================================
-- ALTA · onboarding post-login
-- El cliente que pagó entra en estado 'borrador' y completa su alta en la web
-- (/alta/{codigo}): nombre como se muestra, de dónde comunica, categoría, sus
-- @ públicos por red, competidores (solo PRO), tamaño de equipo y su WhatsApp.
-- Al terminar pasa a 'activo'. Modelo del ALTA-checklist: guardamos los campos
-- confirmados, no la conversación; pedimos SOLO los @ públicos (no login a redes).
--
-- Seguridad: el cliente NO recibe un UPDATE amplio sobre suscripciones (podría
-- tocar plan/estado/demo). En su lugar hay una función SECURITY DEFINER que
-- valida el email del magic link y el estado 'borrador', y escribe únicamente
-- los campos del alta. El resto sigue siendo cosa del equipo (rol admin).
-- ============================================================================

-- 1) Campos del alta en el store de clientes
alter table public.suscripciones
  add column if not exists pais_de text,
  add column if not exists pais_para text,
  add column if not exists categoria text,
  add column if not exists redes jsonb not null default '[]'::jsonb,        -- [{red, usuario}]
  add column if not exists competidores jsonb not null default '[]'::jsonb,  -- ["Trump", "Milei", …] (PRO)
  add column if not exists equipo_tamano int not null default 0,            -- 0 = trabaja solo
  add column if not exists equipo_telefono text,                            -- WhatsApp del compañero (opcional)
  add column if not exists alta_completada_en timestamptz;

-- 2) completar_alta: el cliente confirma su alta y pasa a 'activo'.
--    Devuelve la fila para que la web siga al tablero sin otra consulta.
create or replace function public.completar_alta(p_codigo text, p_datos jsonb)
returns public.suscripciones
language plpgsql
security definer
set search_path = public
as $$
declare
  fila public.suscripciones;
begin
  -- Invariantes del alta, validadas en el servidor: no alcanza con que la web
  -- valide. Un cliente autenticado podría llamar la RPC directo con datos
  -- incompletos y pasar a 'activo' sin sus @ ni su teléfono.
  if coalesce(nullif(trim(p_datos->>'nombre'), ''), '') = ''
     or coalesce(nullif(trim(p_datos->>'telefono'), ''), '') = ''
     or coalesce(nullif(trim(p_datos->>'categoria'), ''), '') = '' then
    raise exception 'alta_incompleta'
      using hint = 'Faltan nombre, teléfono o categoría.';
  end if;
  if coalesce(jsonb_typeof(p_datos->'redes'), '') <> 'array' then
    raise exception 'alta_incompleta' using hint = 'redes debe ser una lista.';
  end if;
  if jsonb_array_length(p_datos->'redes') < 1 then
    raise exception 'alta_incompleta' using hint = 'Hace falta al menos una red con su @.';
  end if;

  update public.suscripciones s
  set
    nombre          = coalesce(nullif(trim(p_datos->>'nombre'), ''), s.nombre),
    telefono        = nullif(trim(p_datos->>'telefono'), ''),
    pais_de         = nullif(trim(p_datos->>'pais_de'), ''),
    pais_para       = nullif(trim(p_datos->>'pais_para'), ''),
    categoria       = nullif(trim(p_datos->>'categoria'), ''),
    redes           = coalesce(p_datos->'redes', '[]'::jsonb),
    -- competidores es solo PRO: en base/demo se ignora lo que mande el cliente.
    competidores    = case
                        when s.plan = 'pro' then coalesce(p_datos->'competidores', '[]'::jsonb)
                        else '[]'::jsonb
                      end,
    equipo_tamano   = greatest(0, coalesce((p_datos->>'equipo_tamano')::int, 0)),
    equipo_telefono = nullif(trim(p_datos->>'equipo_telefono'), ''),
    alta_completada_en = now(),
    estado          = 'activo'
  where s.codigo = p_codigo
    and s.estado = 'borrador'
    and lower(s.email) = lower(coalesce(auth.jwt()->>'email', ''))
  returning s.* into fila;

  if not found then
    raise exception 'alta_no_disponible'
      using hint = 'La suscripción no existe, no está en borrador, o el email no coincide.';
  end if;

  return fila;
end;
$$;

revoke all on function public.completar_alta(text, jsonb) from public;
grant execute on function public.completar_alta(text, jsonb) to authenticated;
