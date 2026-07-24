// ============================================================================
// LEMON SQUEEZY · webhook
// Recibe los eventos de pago de Lemon Squeezy y los mapea al store de clientes.
// Es la pieza que automatiza el "+ Nueva suscripción" que hoy hace el equipo a
// mano en /admin (ver docs/SUSCRIPCIONES.md §3).
//
//   order_created          → crea la fila en `suscripciones` (estado='borrador')
//   subscription_cancelled → pasa esa fila a `pausado`
//
// El esquema ya lo espera: no migra nada (docs/SUSCRIPCIONES.md §4). El match
// natural es el `email` (la llave del magic link; un email por suscripción).
//
// Config (dashboard → Edge Functions → Secrets):
//   LEMONSQUEEZY_WEBHOOK_SECRET   el signing secret del webhook en LS  (obligatorio)
//   LS_VARIANT_PRO                variant_id del plan PRO en LS         (opcional)
//   LS_VARIANT_BASE              variant_id del plan base en LS        (opcional)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   los inyecta la plataforma
//
// La firma es HMAC-SHA256 hex del body crudo, en el header `X-Signature`
// (así lo manda LS). Sin secret válido, cualquiera podría postear pagos falsos.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

/** Mapea la variante comprada en LS a nuestro plan (`base` | `pro`). */
function planDeEvento(attrs: Record<string, unknown>): 'base' | 'pro' {
  const item = (attrs.first_order_item ?? {}) as Record<string, unknown>;
  const variantId = String(item.variant_id ?? attrs.variant_id ?? '');
  if (variantId && variantId === (Deno.env.get('LS_VARIANT_PRO') ?? '')) return 'pro';
  if (variantId && variantId === (Deno.env.get('LS_VARIANT_BASE') ?? '')) return 'base';
  // Fallback por nombre de producto si no hay variantes configuradas.
  const nombre = String(item.product_name ?? attrs.product_name ?? '').toLowerCase();
  return nombre.includes('pro') ? 'pro' : 'base';
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
    meta?: { event_name?: string };
    data?: { attributes?: Record<string, unknown> };
  };
  try {
    evento = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const tipo = evento.meta?.event_name ?? '';
  const attrs = evento.data?.attributes ?? {};
  const email = String(attrs.user_email ?? '').trim().toLowerCase();

  const db = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── order_created → alta en 'borrador' ──────────────────────────────────
  // El cliente que pagó entra en borrador; al abrir su tablero se lo lleva al
  // wizard de /alta/{codigo}. El token (pago ↔ narrachat ↔ tablero) lo pone la
  // DB por default.
  if (tipo === 'order_created') {
    if (!email) return json({ error: 'sin_email' }, 400);

    // Idempotencia: LS reintenta. Un email = una suscripción (modelo del store).
    // `email` no tiene unique en el esquema, así que limitamos a 1 (maybeSingle
    // tiraría si hubiera duplicados) y dedup por lookup-previo. Queda una ventana
    // de carrera estrecha si dos reintentos entran a la vez; los reintentos de LS
    // van espaciados, así que en la práctica no ocurre.
    const { data: existente, error: errBusca } = await db
      .from('suscripciones')
      .select('id, codigo, estado')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();
    if (errBusca) {
      console.error('order_created · lookup', errBusca);
      return json({ error: 'db_error' }, 500);
    }
    if (existente) {
      // Ya existe (reintento del webhook o cliente que vuelve). No lo pisamos:
      // reactivar un cliente pausado o cambiarle el plan es una decisión de
      // operación, no del webhook. Devolvemos 200 para que LS no reintente.
      console.log(`order_created · ya existe ${email} (${existente.estado}), skip`);
      return json({ ok: true, dedup: true, codigo: existente.codigo });
    }

    const nombre = String(attrs.user_name ?? '').trim() || email;
    const plan = planDeEvento(attrs);

    // Un choque de código es astronómicamente improbable (31^8); reintentamos
    // una vez ante violación de unique por las dudas.
    for (let intento = 0; intento < 2; intento++) {
      const { data: fila, error } = await db
        .from('suscripciones')
        .insert({ codigo: generarCodigo(), nombre, email, plan, estado: 'borrador' })
        .select('codigo')
        .single();
      if (!error) {
        console.log(`order_created · alta ${email} plan=${plan} codigo=${fila.codigo}`);
        return json({ ok: true, codigo: fila.codigo });
      }
      // El único unique del esquema es `codigo`: 23505 = choque de código →
      // reintentar con otro. Cualquier otro error es real.
      if (error.code !== '23505') {
        console.error('order_created · insert', error);
        return json({ error: 'db_error' }, 500);
      }
    }
    return json({ error: 'codigo_colision' }, 500);
  }

  // ── subscription_cancelled → 'pausado' ──────────────────────────────────
  // El cliente ve cómo reactivar por WhatsApp (lo maneja la pantalla del tablero).
  if (tipo === 'subscription_cancelled') {
    if (!email) return json({ error: 'sin_email' }, 400);
    const { error } = await db
      .from('suscripciones')
      .update({ estado: 'pausado' })
      .ilike('email', email);
    if (error) {
      console.error('subscription_cancelled · update', error);
      return json({ error: 'db_error' }, 500);
    }
    console.log(`subscription_cancelled · pausado ${email}`);
    return json({ ok: true });
  }

  // Otros eventos (subscription_created, _updated, _payment_success…): 200 para
  // que LS los marque entregados. Se implementan cuando hagan falta.
  console.log(`evento ignorado: ${tipo}`);
  return json({ ok: true, ignored: tipo });
});
