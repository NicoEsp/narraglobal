/* Pedidos que llegan desde la landing: activar el Narra ID (/activar), la
   demo (/posicion) y el reporte (/reporte). Todos guardan en public.pedidos a
   través de la RPC enviar_pedido, que valida y corta a los bots; el equipo
   los ve en el back office. */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type TipoPedido = 'demo_persona' | 'demo_empresa' | 'reporte' | 'narra_id';

/** Los países de la lista de la maqueta, con el código de país (sin «+») y
    cuántos dígitos tiene, como mucho, un número nacional completo: sin el 0
    de marcado ni, en Argentina, el 9 y el 15. Una sola tabla: PAISES sale de
    acá, así no hay dos listas que mantener a mano. */
const TELEFONO_PAIS: Record<string, { codigo: string; largo: number }> = {
  Argentina: { codigo: '54', largo: 10 },
  Bolivia: { codigo: '591', largo: 8 },
  Brasil: { codigo: '55', largo: 11 }, // 10 los fijos, 11 los celulares
  Chile: { codigo: '56', largo: 9 },
  Colombia: { codigo: '57', largo: 10 },
  'Costa Rica': { codigo: '506', largo: 8 },
  Ecuador: { codigo: '593', largo: 9 },
  'El Salvador': { codigo: '503', largo: 8 },
  Guatemala: { codigo: '502', largo: 8 },
  Honduras: { codigo: '504', largo: 8 },
  México: { codigo: '52', largo: 10 },
  Nicaragua: { codigo: '505', largo: 8 },
  Panamá: { codigo: '507', largo: 8 },
  Paraguay: { codigo: '595', largo: 9 },
  Perú: { codigo: '51', largo: 9 },
  'República Dominicana': { codigo: '1', largo: 10 },
  Uruguay: { codigo: '598', largo: 8 },
  Venezuela: { codigo: '58', largo: 10 },
};

export const PAISES = Object.keys(TELEFONO_PAIS);

export const soloDigitos = (s: string) => s.replace(/\D/g, '');

/** El WhatsApp sin espacios, paréntesis ni guiones: «+54 9 341 555-1234» → «+5493415551234». */
export const telefonoCanonico = (s: string) => s.trim().replace(/[\s().-]/g, '');

/* El WhatsApp tiene que venir en formato internacional explícito: el «+», el
   código de país y el número, 8 a 15 dígitos en total (E.164). Sin el «+» no
   hay forma de distinguir «341 555 1234» (un número local, al que el equipo
   no puede escribir) de un número con código; antes se aceptaba cualquier
   cosa de 8 dígitos y quedaba guardado como si fuera internacional. */
export const telefonoValido = (s: string) => /^\+[1-9]\d{7,14}$/.test(telefonoCanonico(s));

/* El WhatsApp sin exigir el «+»: si lo escribieron como se marca en su país
   («341 555 1234», «0341 15 555 1234»), el código sale del país elegido. Un
   número que ya trae «+» o «00» se respeta tal cual. Si viene con el código
   pero sin el «+» («54 9 341 555 1234») se reconoce porque es más largo que
   cualquier número nacional: así el 55 de Santa Maria (Brasil) o el 51 de Puno
   (Perú) no se confunden con el código de país. En Argentina los celulares van
   con el 9 después del 54 y sin el 15 local, y el número nacional tiene siempre
   10 dígitos. Devuelve null cuando no hay forma de armar un número con sentido
   (país desconocido, o en Argentina si no quedan 10 dígitos). */
export const telefonoConPais = (s: string, pais: string): string | null => {
  const t = telefonoCanonico(s);
  if (t.startsWith('+')) return t;
  if (t.startsWith('00')) return '+' + soloDigitos(t.slice(2));
  const tel = TELEFONO_PAIS[pais];
  if (!tel) return null;
  const { codigo, largo } = tel;
  let d = soloDigitos(t).replace(/^0+/, '');
  // ya venía con el código, sin el «+»: se lo saca y se sigue como con un número nacional
  if (d.startsWith(codigo) && d.length > largo) d = d.slice(codigo.length);
  if (codigo === '54') {
    // «341 15 555 1234» y «9 11 15 1234 5678»: el 15 va después del código de área (2 a 4 dígitos)
    const m = d.match(/^(9?)(\d{2,4})15(\d{6,8})$/);
    if (m && (m[2] + m[3]).length === 10) d = m[1] + m[2] + m[3];
    if (d.length === 11 && d.startsWith('9')) d = d.slice(1);
    if (d.length !== 10) return null;
    d = '9' + d;
  }
  return '+' + codigo + d;
};

/** Lo que se le dice a quien escribió el número sin el código, en los formularios sin país (/reporte). */
export const AVISO_TELEFONO =
  'Escribí tu WhatsApp con el código de país y el + adelante: +54 9 341 555 1234.';

/** Lo mismo cuando el país ya se eligió en el formulario y el número no se pudo armar. */
export const AVISO_TELEFONO_PAIS =
  'Revisá tu WhatsApp: tiene que tener el código de área y el número. Si es de otro país, ponelo con el +: +598 99 123 456.';

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
