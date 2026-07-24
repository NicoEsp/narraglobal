-- ============================================================================
-- LEMON SQUEEZY · identidad de la suscripción de pago
-- El webhook (supabase/functions/lemonsqueezy-webhook) pasa de "solo alta" a
-- acompañar el ciclo de vida completo: created/updated/cancelled/resumed/
-- expired/paused/unpaused. Para eso el store de clientes guarda quién es el
-- cliente en LS y en qué estado está su cobro, sin mezclarlo con nuestro
-- `estado` operativo (borrador→activo→con_historico→live / pausado).
--
-- Todas las columnas son NULL para altas manuales del back office: nada de lo
-- existente cambia. Solo el webhook (service role) las escribe.
-- ============================================================================

alter table public.suscripciones
  add column if not exists ls_customer_id text,      -- customer_id en LS
  add column if not exists ls_subscription_id text,  -- data.id de subscription_*
  add column if not exists ls_variant_id text,       -- variante comprada (mapea al plan)
  add column if not exists ls_estado text,           -- status de LS: on_trial|active|cancelled|expired|past_due|unpaid|paused
  add column if not exists ls_renueva_en timestamptz, -- renews_at: próximo cobro
  add column if not exists ls_termina_en timestamptz, -- ends_at: fin del acceso pago (si canceló)
  add column if not exists ls_test_mode boolean;      -- true = compra en test mode de LS

-- El webhook matchea subscription_* por el id de la suscripción en LS.
create index if not exists suscripciones_ls_subscription_idx
  on public.suscripciones (ls_subscription_id)
  where ls_subscription_id is not null;

-- Un email = una suscripción (el modelo del store, y la llave del magic link).
-- Hasta ahora era solo una convención: el webhook dedupeaba por lookup previo,
-- con una ventana de carrera si dos reintentos de LS entraban a la vez. El
-- índice único la cierra: el segundo insert choca (23505) y el webhook lo trata
-- como dedup. Best-effort: si la tabla ya tuviera emails duplicados, avisa por
-- notice y sigue sin romper la migración (se resuelve a mano y se re-ejecuta).
do $$
begin
  create unique index if not exists suscripciones_email_unico
    on public.suscripciones (lower(email));
exception when others then
  raise notice 'No se pudo crear el índice único de email (%). ¿Hay emails duplicados en suscripciones? Resolver los duplicados y re-ejecutar: create unique index suscripciones_email_unico on public.suscripciones (lower(email));', sqlerrm;
end;
$$;
