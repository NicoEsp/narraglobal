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

/** Un WhatsApp con código de país tiene al menos 8 dígitos; con menos no llega nada. */
export const telefonoValido = (s: string) => soloDigitos(s).length >= 8;

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
    p_telefono: p.telefono.trim(),
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
