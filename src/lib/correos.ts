/* Los correos que el equipo manda a mano mientras no haya envío automático.
   El de bienvenida sale del back office con un mailto: (asunto y cuerpo ya
   escritos) cuando el pedido del Narra ID está pagado. La versión con marca,
   para cuando haya Resend, está en docs/correos/bienvenida.html: si cambia el
   texto, cambiarlo en los dos lados. */
import { AGENDA_BIENVENIDA } from './enlaces';

export interface DatosBienvenida {
  nombre: string;
  email: string;
  numero: string;
  /** «Rosario, Santa Fe» en política, «Agro en Argentina» en negocios. */
  elenco: string;
}

export const ASUNTO_BIENVENIDA = 'Te damos la bienvenida al Narra ID';

export const textoBienvenida = (d: DatosBienvenida) =>
  [
    'Hola ' + (d.nombre.split(' ')[0] || '') + ',',
    '',
    'Ya está activo tu Narra ID. Gracias por confiar en narraglobal.',
    '',
    'Lo primero es conocernos. Agendá una videollamada de bienvenida conmigo: repasamos tu cuenta, ' +
      'tu elenco y qué querés lograr, y dejamos todo listo para tu primera medición.',
    '',
    'Agendá tu videollamada: ' + AGENDA_BIENVENIDA,
    '',
    'Qué sigue:',
    '1. Videollamada de bienvenida: nos conocemos y ajustamos tu elenco.',
    '2. Cómo te fue: tu punto de partida frente a tu competencia' + (d.elenco ? ' (' + d.elenco + ')' : '') + '.',
    '3. Cada semana: alertas sobre tu narrativa, tu influencia digital y tu competencia.',
    '',
    'Entrás a tu tablero con este correo (' + d.email + ') en https://narraglobal.com/entrar',
    '',
    'Cualquier cosa, respondé este correo o escribime por WhatsApp al +54 9 11 3073-1011.',
    '',
    'Lisandro Bregant',
    'Director de narraglobal',
    '',
    'Pedido ' + d.numero,
  ].join('\n');

/** El mailto: con todo escrito, para mandarlo desde el correo del equipo. */
export const mailtoBienvenida = (d: DatosBienvenida) =>
  'mailto:' + encodeURIComponent(d.email) +
  '?subject=' + encodeURIComponent(ASUNTO_BIENVENIDA) +
  '&body=' + encodeURIComponent(textoBienvenida(d));
