/* Pedidos que llegan desde la landing: la demo del Narra ID (/posicion) y el
   reporte (/reporte). Los dos guardan en public.pedidos a través de la RPC
   enviar_pedido, que valida y corta a los bots; el equipo los ve en el back
   office y manda la demo o el reporte a mano por WhatsApp. */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type TipoPedido = 'demo_persona' | 'demo_empresa' | 'reporte';

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

/** Guarda el pedido. Devuelve null si entró, o el motivo, en castellano, si no. */
export async function enviarPedido(p: Pedido): Promise<string | null> {
  const { error } = await supabase.rpc('enviar_pedido', {
    p_tipo: p.tipo,
    p_telefono: telefonoCanonico(p.telefono),
    p_email: p.email?.trim() || undefined,
    p_datos: p.datos,
    p_honeypot: p.honeypot,
  });
  if (!error) return null;
  return explicar(error);
}

/* Lo que devuelve la RPC viene pensado para el log, no para la persona: acá
   se traduce lo que puede pasar de verdad. */
const explicar = (e: { message: string; hint?: string | null }): string => {
  const m = e.message ?? '';
  if (/rate limit/i.test(m)) return 'ya recibimos varios pedidos desde este WhatsApp hoy';
  if (/pedido_invalido/.test(m) && e.hint) return e.hint.replace(/\.$/, '');
  if (/failed to fetch|network/i.test(m)) return 'no hubo conexión con la base';
  return m || 'la base no contestó';
};

/** Los ítems no vacíos, unidos con el separador de la marca. */
export const unir = (...partes: Array<string | null | undefined>) =>
  partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' · ');
