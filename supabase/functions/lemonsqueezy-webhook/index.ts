// ============================================================================
// LEMON SQUEEZY · webhook
// Recibe los eventos de pago de Lemon Squeezy y los mapea al store de clientes.
// Automatiza el "+ Nueva suscripción" del back office y acompaña el ciclo de
// vida completo del cobro (docs/SUSCRIPCIONES.md §5).
//
//   order_created / subscription_created → alta en `suscripciones` ('borrador')
//     · si el email ya existía pausado, lo reactiva (recompra = intención clara)
//   subscription_resumed / _unpaused     → reactiva ('activo' o 'borrador' si
//     nunca completó su alta)
//   subscription_expired / _paused       → 'pausado'
//   subscription_cancelled               → NO pausa: el cliente ya pagó el
//     período; LS manda subscription_expired cuando de verdad termina
//   subscription_updated                 → sincroniza los datos de LS y pausa
//     si el status quedó terminal (unpaid/expired/paused). Nunca des-pausa
//     solo: reactivar tras una pausa de operación es decisión del equipo o del
//     propio cliente (resumed/unpaused/recompra).
//   subscription_payment_*               → solo sincronizan identidad (el
//     payload es la FACTURA, no la suscripción: su status es de factura)
//
// El estado operativo (borrador→activo→con_historico→live / pausado) sigue
// siendo nuestro; las columnas ls_* guardan la identidad y el estado del cobro
// (migración 20260724150000_lemon_squeezy_suscripcion.sql).
//
// Config (dashboard → Edge Functions → Secrets):
//   LEMONSQUEEZY_WEBHOOK_SECRET   el signing secret del webhook en LS  (obligatorio)
//   LS_VARIANT_PRO                variant_id del plan PRO en LS         (opcional)
//   LS_VARIANT_BASE               variant_id del plan base en LS        (opcional)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   los inyecta la plataforma
//
// La firma es HMAC-SHA256 hex del body crudo, en el header `X-Signature`
// (así lo manda LS). Sin secret válido, cualquiera podría postear pagos falsos.
// ============================================================================

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SECRET = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Alfabeto sin caracteres ambiguos (0/o, 1/l/i), igual a src/lib/narra.ts.
const ALFABETO_CODIGO = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Código corto opaco para la URL /suscripcion/{codigo}. */
function generarCodigo(largo = 8): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
}

/** HMAC-SHA256 del body crudo → hex, para comparar contra X-Signature. */
async function firmaHex(raw: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparación en tiempo constante (evita timing attacks sobre la firma). */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

type Attrs = Record<string, unknown>;

const texto = (v: unknown): string | null => {
  const s = String(v ?? '').trim();
  return s === '' || s === 'null' || s === 'undefined' ? null : s;
};

/** variant_id del evento: subscription_* lo trae plano; order_created, en first_order_item. */
function variantDeEvento(attrs: Attrs): string {
  const item = (attrs.first_order_item ?? {}) as Attrs;
  return String(item.variant_id ?? attrs.variant_id ?? '');
}

/** Plan según los LS_VARIANT_* configurados. null = la variante no mapea. */
function planPorVariante(attrs: Attrs): 'base' | 'pro' | null {
  const variantId = variantDeEvento(attrs);
  if (variantId && variantId === (Deno.env.get('LS_VARIANT_PRO') ?? '')) return 'pro';
  if (variantId && variantId === (Deno.env.get('LS_VARIANT_BASE') ?? '')) return 'base';
  return null;
}

/** Plan para un alta: variante configurada, o fallback por nombre de producto. */
function planDeEvento(attrs: Attrs): 'base' | 'pro' {
  const porVariante = planPorVariante(attrs);
  if (porVariante) return porVariante;
  const item = (attrs.first_order_item ?? {}) as Attrs;
  const nombre = String(
    item.product_name ?? attrs.product_name ?? item.variant_name ?? attrs.variant_name ?? '',
  ).toLowerCase();
  return nombre.includes('pro') ? 'pro' : 'base';
}

/** Qué objeto vino en data: orden, suscripción o factura de suscripción. */
type TipoPayload = 'orders' | 'subscriptions' | 'subscription-invoices' | '';

/** Columnas ls_* a sincronizar. Cuidado con el tipo del payload: el status de
    una orden ('paid') o de una factura ('pending'|'paid'…) NO es el status de
    la suscripción — solo un payload de suscripción escribe ls_estado/fechas. */
function columnasLS(payload: TipoPayload, subscriptionId: string | null, attrs: Attrs): Attrs {
  const out: Attrs = {};
  if (subscriptionId) out.ls_subscription_id = subscriptionId;
  const customer = texto(attrs.customer_id);
  if (customer) out.ls_customer_id = customer;
  if (typeof attrs.test_mode === 'boolean') out.ls_test_mode = attrs.test_mode;
  if (payload === 'orders' || payload === 'subscriptions') {
    const variant = texto(variantDeEvento(attrs));
    if (variant) out.ls_variant_id = variant;
  }
  if (payload === 'subscriptions') {
    const status = texto(attrs.status);
    if (status) out.ls_estado = status;
    if ('renews_at' in attrs) out.ls_renueva_en = texto(attrs.renews_at);
    if ('ends_at' in attrs) out.ls_termina_en = texto(attrs.ends_at);
  }
  return out;
}

interface Fila {
  id: string;
  codigo: string;
  estado: string;
  alta_completada_en: string | null;
  ls_subscription_id: string | null;
}

/** Estado operativo al reactivar: si nunca onboardeó vuelve a 'borrador'
    (la web lo lleva al wizard de /alta), si ya lo hizo vuelve a 'activo'. */
const estadoReactivado = (fila: Fila) => (fila.alta_completada_en ? 'activo' : 'borrador');

/** Busca la fila del cliente: primero por la suscripción de LS, después por email. */
async function buscarFila(
  db: SupabaseClient,
  subscriptionId: string | null,
  email: string,
): Promise<{ fila: Fila | null; error: unknown }> {
  const cols = 'id, codigo, estado, alta_completada_en, ls_subscription_id';
  if (subscriptionId) {
    const { data, error } = await db
      .from('suscripciones')
      .select(cols)
      .eq('ls_subscription_id', subscriptionId)
      .limit(1)
      .maybeSingle();
    if (error) return { fila: null, error };
    if (data) return { fila: data as Fila, error: null };
  }
  if (!email) return { fila: null, error: null };
  // ilike da el match case-insensitive, pero % y _ son comodines de LIKE:
  // escapados, un email como a_b@mail.com no puede matchear otra fila.
  const patron = email.replace(/([%_\\])/g, '\\$1');
  const { data, error } = await db
    .from('suscripciones')
    .select(cols)
    .ilike('email', patron)
    .limit(1)
    .maybeSingle();
  return { fila: (data as Fila | null) ?? null, error };
}

const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!SECRET || !SERVICE_ROLE) {
    console.error('Faltan LEMONSQUEEZY_WEBHOOK_SECRET o SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'misconfigured' }, 500);
  }

  // 1) Verificar la firma sobre el body CRUDO (no el parseado).
  const raw = await req.text();
  const firma = req.headers.get('x-signature') ?? '';
  const esperada = await firmaHex(raw);
  if (!firma || !igualSeguro(firma, esperada)) {
    return json({ error: 'invalid_signature' }, 401);
  }

  // 2) Parsear el evento ya verificado.
  let evento: {
    meta?: { event_name?: string; test_mode?: boolean; custom_data?: Record<string, unknown> };
    data?: { type?: string; id?: string; attributes?: Attrs };
  };
  try {
    evento = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const tipo = evento.meta?.event_name ?? '';
  const attrs = evento.data?.attributes ?? {};
  const payload = (evento.data?.type ?? '') as TipoPayload;
  const email = String(attrs.user_email ?? '').trim().toLowerCase();
  // El id de la suscripción de LS: en subscription_* es data.id; en los
  // subscription_payment_* el data es la FACTURA y viene en attrs.subscription_id.
  const subscriptionId =
    payload === 'subscriptions'
      ? texto(evento.data?.id)
      : payload === 'subscription-invoices'
        ? texto(attrs.subscription_id)
        : null;
  const testMode = attrs.test_mode === true || evento.meta?.test_mode === true;
  const marca = testMode ? ' [test-mode]' : '';

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── order_created / subscription_created → alta (o reactivación) ─────────
  // El cliente que paga entra en 'borrador'; al abrir su tablero se lo lleva
  // al wizard de /alta/{codigo}. El token (pago ↔ narrachat ↔ tablero) lo pone
  // la DB por default. Los dos eventos son válidos como alta: cubre configs de
  // LS que solo suscriban uno de los dos, y el que llegue segundo solo
  // sincroniza columnas ls_*.
  //
  // Supuesto de diseño: el store de LS vende SOLO planes del tablero. Si algún
  // día se vende otra cosa por LS (un workshop, un informe), filtrar acá por
  // variant/product antes de dar de alta — hoy cualquier orden del store crea
  // (o reactiva) una suscripción.
  if (tipo === 'order_created' || tipo === 'subscription_created') {
    if (!email) return json({ error: 'sin_email' }, 400);

    const { fila: existente, error: errBusca } = await buscarFila(db, subscriptionId, email);
    if (errBusca) {
      console.error(`${tipo} · lookup`, errBusca);
      return json({ error: 'db_error' }, 500);
    }

    if (existente) {
      // Ya existe: sincronizamos identidad LS y, si estaba pausado, la compra
      // nueva lo reactiva (autoservicio: nadie del equipo tiene que intervenir).
      const cambios: Attrs = { ...columnasLS(payload, subscriptionId, attrs) };
      let reactivada = false;
      if (existente.estado === 'pausado') {
        cambios.estado = estadoReactivado(existente);
        cambios.plan = planDeEvento(attrs);
        reactivada = true;
      } else {
        // Cliente vigente que compra de nuevo (upgrade/downgrade autoservicio):
        // el plan sigue a lo que compró, pero solo con LS_VARIANT_* configurados
        // — el fallback por nombre es demasiado frágil para pisar un plan vivo.
        const plan = planPorVariante(attrs);
        if (plan) cambios.plan = plan;
      }
      const { error } = await db.from('suscripciones').update(cambios).eq('id', existente.id);
      if (error) {
        console.error(`${tipo} · update existente`, error);
        return json({ error: 'db_error' }, 500);
      }
      console.log(
        `${tipo}${marca} · ${email} ya existía (${existente.estado})` +
          (reactivada ? ' → reactivada' : ' · sync ls_*'),
      );
      return json({ ok: true, dedup: !reactivada, reactivada, codigo: existente.codigo });
    }

    const nombre = String(attrs.user_name ?? '').trim() || email;
    const plan = planDeEvento(attrs);

    // Un choque de código es astronómicamente improbable (31^8); reintentamos
    // una vez ante violación de unique por las dudas.
    for (let intento = 0; intento < 2; intento++) {
      const { data: fila, error } = await db
        .from('suscripciones')
        .insert({
          codigo: generarCodigo(),
          nombre,
          email,
          plan,
          estado: 'borrador',
          ...columnasLS(payload, subscriptionId, attrs),
        })
        .select('codigo')
        .single();
      if (!error) {
        console.log(`${tipo}${marca} · alta ${email} plan=${plan} codigo=${fila.codigo}`);
        return json({ ok: true, codigo: fila.codigo });
      }
      if (error.code !== '23505') {
        console.error(`${tipo} · insert`, error);
        return json({ error: 'db_error' }, 500);
      }
      // 23505 en el email único = el evento gemelo insertó primero (en cada
      // venta LS manda order_created Y subscription_created casi juntos).
      // No basta con responder dedup: este evento trae datos que el gemelo no
      // tenía (p.ej. subscription_created trae el ls_subscription_id) y LS no
      // lo va a reintentar después de un 200 — re-buscamos y sincronizamos.
      // 23505 en codigo = choque de código: reintentar con otro.
      if (String(error.message ?? '').includes('suscripciones_email_unico')) {
        const { fila: ganadora, error: errRe } = await buscarFila(db, subscriptionId, email);
        if (errRe || !ganadora) {
          // Transitorio raro (el gemelo todavía no es visible): 500 para que
          // LS reintente y el camino de "ya existe" lo resuelva.
          console.error(`${tipo} · re-lookup tras 23505`, errRe);
          return json({ error: 'db_error' }, 500);
        }
        const { error: errSync } = await db
          .from('suscripciones')
          .update(columnasLS(payload, subscriptionId, attrs))
          .eq('id', ganadora.id);
        if (errSync) {
          console.error(`${tipo} · sync tras 23505`, errSync);
          return json({ error: 'db_error' }, 500);
        }
        console.log(`${tipo}${marca} · ${email} insertado por el evento gemelo, sync ls_*`);
        return json({ ok: true, dedup: true, codigo: ganadora.codigo });
      }
    }
    return json({ error: 'codigo_colision' }, 500);
  }

  // ── el resto de los eventos de suscripción ───────────────────────────────
  const EVENTOS_SUB = new Set([
    'subscription_updated',
    'subscription_cancelled',
    'subscription_resumed',
    'subscription_expired',
    'subscription_paused',
    'subscription_unpaused',
    'subscription_payment_success',
    'subscription_payment_failed',
    'subscription_payment_recovered',
    'subscription_payment_refunded',
  ]);

  if (EVENTOS_SUB.has(tipo)) {
    if (!email && !subscriptionId) return json({ error: 'sin_email' }, 400);

    const { fila, error: errBusca } = await buscarFila(db, subscriptionId, email);
    if (errBusca) {
      console.error(`${tipo} · lookup`, errBusca);
      return json({ error: 'db_error' }, 500);
    }
    if (!fila) {
      // Suscripción de LS que no está en nuestro store (p.ej. anterior al
      // sistema, o borrada a mano). 200 para que LS no reintente; queda en el
      // log para revisarlo.
      console.warn(`${tipo}${marca} · sin fila para ${email || subscriptionId}, ignorado`);
      return json({ ok: true, sin_fila: true });
    }

    // La fila matcheó por email pero está atada a OTRA suscripción de LS:
    // es un evento tardío de una sub vieja (p.ej. el expired de la sub
    // anterior reintentado después de una recompra). No puede pausar ni
    // tocar al cliente vigente.
    if (subscriptionId && fila.ls_subscription_id && fila.ls_subscription_id !== subscriptionId) {
      console.warn(
        `${tipo}${marca} · sub ${subscriptionId} no es la vigente (${fila.ls_subscription_id}) de ${email || fila.codigo}, ignorado`,
      );
      return json({ ok: true, sub_no_vigente: true });
    }

    const cambios: Attrs = { ...columnasLS(payload, subscriptionId, attrs) };

    if (tipo === 'subscription_resumed' || tipo === 'subscription_unpaused') {
      // El cliente retomó su suscripción él mismo → vuelve a entrar.
      if (fila.estado === 'pausado') cambios.estado = estadoReactivado(fila);
    } else if (tipo === 'subscription_expired' || tipo === 'subscription_paused') {
      // Se terminó el acceso pago (o LS dejó de cobrar) → pausa operativa.
      cambios.estado = 'pausado';
    } else if (tipo === 'subscription_updated') {
      // Red de seguridad: LS manda updated ante cualquier cambio. Si el status
      // quedó terminal, pausamos aunque el evento específico se haya perdido.
      // Nunca des-pausa: eso es de resumed/unpaused/recompra o del equipo.
      const status = String(attrs.status ?? '');
      if (status === 'expired' || status === 'unpaid' || status === 'paused') {
        cambios.estado = 'pausado';
      }
      // Cambio de plan (upgrade/downgrade se hace en el portal de LS y llega
      // como updated con otra variante). Solo con LS_VARIANT_* configurados:
      // el fallback por nombre es demasiado frágil para tocar un plan vigente.
      const plan = planPorVariante(attrs);
      if (plan) cambios.plan = plan;
    }
    // subscription_cancelled NO cambia el estado: el cliente pagó hasta
    // ends_at y LS manda subscription_expired en esa fecha. Acá solo queda
    // registrado ls_estado='cancelled' + ls_termina_en para que el equipo lo
    // vea venir en el back office. Los subscription_payment_* tampoco: son la
    // factura (identidad sí, estado no).

    const { error } = await db.from('suscripciones').update(cambios).eq('id', fila.id);
    if (error) {
      console.error(`${tipo} · update`, error);
      return json({ error: 'db_error' }, 500);
    }
    console.log(
      `${tipo}${marca} · ${email || subscriptionId}` +
        (cambios.estado ? ` → estado=${cambios.estado}` : ' · sync ls_*'),
    );
    return json({ ok: true, codigo: fila.codigo, estado: cambios.estado ?? fila.estado });
  }

  // Otros eventos (order_refunded, license_*…): 200 para que LS los marque
  // entregados. Se implementan cuando hagan falta.
  console.log(`evento ignorado: ${tipo}${marca}`);
  return json({ ok: true, ignored: tipo });
});
