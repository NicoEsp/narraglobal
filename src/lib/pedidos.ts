/* Pedidos que llegan desde la landing: activar el Narra ID (/activar), la
   demo (/posicion) y el reporte (/reporte). Todos guardan en public.pedidos a
   través de la RPC enviar_pedido, que valida y corta a los bots; el equipo
   los ve en el back office. */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type TipoPedido = 'demo_persona' | 'demo_empresa' | 'reporte' | 'narra_id';

/** Los países de la lista de la maqueta. */
export const PAISES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Ecuador', 'El Salvador',
  'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú',
  'República Dominicana', 'Uruguay', 'Venezuela',
];

export const soloDigitos = (s: string) => s.replace(/\D/g, '');

/** El WhatsApp sin espacios, paréntesis ni guiones: «+54 9 341 555-1234» → «+5493415551234». */
export const telefonoCanonico = (s: string) => s.trim().replace(/[\s().-]/g, '');

/* El WhatsApp tiene que venir en formato internacional explícito: el «+», el
   código de país y el número, 8 a 15 dígitos en total (E.164). Sin el «+» no
   hay forma de distinguir «341 555 1234» (un número local, al que el equipo
   no puede escribir) de un número con código; antes se aceptaba cualquier
   cosa de 8 dígitos y quedaba guardado como si fuera internacional. */
export const telefonoValido = (s: string) => /^\+[1-9]\d{7,14}$/.test(telefonoCanonico(s));

/** El código de país (sin «+») de cada país de la lista. */
const CODIGO_PAIS: Record<string, string> = {
  Argentina: '54', Bolivia: '591', Brasil: '55', Chile: '56', Colombia: '57', 'Costa Rica': '506',
  Ecuador: '593', 'El Salvador': '503', Guatemala: '502', Honduras: '504', México: '52',
  Nicaragua: '505', Panamá: '507', Paraguay: '595', Perú: '51', 'República Dominicana': '1',
  Uruguay: '598', Venezuela: '58',
};

/* El WhatsApp sin exigir el «+»: si lo escribieron como se marca en su país
   («341 555 1234», «0341 15 555 1234»), el código sale del país elegido. Un
   número que ya trae «+» o «00» se respeta tal cual. En Argentina los
   celulares van con el 9 después del 54 y sin el 15 local. */
export const telefonoConPais = (s: string, pais: string): string => {
  const t = telefonoCanonico(s);
  if (t.startsWith('+')) return t;
  if (t.startsWith('00')) return '+' + soloDigitos(t.slice(2));
  const cod = CODIGO_PAIS[pais];
  let d = soloDigitos(t).replace(/^0+/, '');
  if (!cod) return '+' + d;
  // ya venía con el código, sin el «+»
  if (d.startsWith(cod) && d.length >= cod.length + 8) return '+' + d;
  if (cod === '54') {
    // «341 15 555 1234» → «341 555 1234»: el 15 va después del código de área (2 a 4 dígitos)
    const m = d.match(/^(\d{2,4})15(\d{6,8})$/);
    if (m && (m[1] + m[2]).length === 10) d = m[1] + m[2];
    if (!d.startsWith('9')) d = '9' + d;
  }
  return '+' + cod + d;
};

/** Lo que se le dice a quien escribió el número sin el código. */
export const AVISO_TELEFONO =
  'Escribí tu WhatsApp con el código de país y el + adelante: +54 9 341 555 1234.';

export interface Pedido {
  tipo: TipoPedido;
  telefono: string;
  email?: string;
  datos: Record<string, Json>;
  /** El campo trampa del formulario: si viene con algo, era un bot. */
  honeypot: string;
}

/** Guarda el pedido. Devuelve su id si entró, o el motivo, en castellano, si no. */
export async function guardarPedido(p: Pedido): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase.rpc('enviar_pedido', {
    p_tipo: p.tipo,
    p_telefono: telefonoCanonico(p.telefono),
    p_email: p.email?.trim() || undefined,
    p_datos: p.datos,
    p_honeypot: p.honeypot,
  });
  if (error) return { error: explicar(error) };
  return { id: data };
}

/** Guarda el pedido. Devuelve null si entró, o el motivo, en castellano, si no. */
export async function enviarPedido(p: Pedido): Promise<string | null> {
  const r = await guardarPedido(p);
  return 'error' in r ? r.error : null;
}

/** El número corto con el que se cruza un pago con su pedido: «#3F9A2C». */
export const numeroPedido = (id: string) => '#' + id.replace(/-/g, '').slice(0, 6).toUpperCase();

/* Lo que devuelve la RPC viene pensado para el log, no para la persona: acá
   se traduce lo que puede pasar de verdad. */
const explicar = (e: { message: string; hint?: string | null }): string => {
  const m = e.message ?? '';
  if (/rate limit/i.test(m)) return 'ya recibimos varios pedidos desde este WhatsApp hoy';
  if (/pedido_invalido/.test(m) && e.hint) return e.hint.replace(/\.$/, '');
  // «Failed to fetch» en Chrome, «Load failed» en Safari: el pedido no llegó o no volvió
  if (/failed to fetch|load failed|network/i.test(m)) return 'no hubo conexión con la base';
  return m || 'la base no contestó';
};

/** Los ítems no vacíos, unidos con el separador de la marca. */
export const unir = (...partes: Array<string | null | undefined>) =>
  partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' · ');
