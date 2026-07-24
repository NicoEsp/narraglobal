-- ============================================================================
-- ALTA · "mirar de cerca" para todos (Narra ID)
-- Antes, elegir competidores era exclusivo del plan PRO y la RPC descartaba lo
-- que mandara una suscripción base/demo. El nuevo onboarding lo incluye en el
-- Narra ID de todos: cualquier alta puede elegir hasta 5 personas o marcas.
--
-- Redefinimos completar_alta para guardar competidores sin mirar el plan,
-- acotando a un máximo de 5 en el servidor (la web ya lo limita, pero la RPC
-- podría llamarse directo). El resto de las invariantes queda igual.
-- ============================================================================

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
    -- competidores: incluido en el Narra ID de todos. Tope de 5 en el servidor.
    competidores    = case
                        when jsonb_typeof(p_datos->'competidores') = 'array'
                          then (
                            select coalesce(jsonb_agg(v), '[]'::jsonb)
                            from (
                              select value as v
                              from jsonb_array_elements(p_datos->'competidores')
                              limit 5
                            ) t
                          )
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
