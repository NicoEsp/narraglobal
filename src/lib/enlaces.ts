/* Los enlaces de contacto de narraglobal, en un solo lugar: los comparten el
   alta, el tablero y su antesala. Antes estaban copiados en cada pantalla y el
   número de Lisandro ya había quedado escrito dos veces. */

/** WhatsApp del equipo: soporte, cambios de plan, pausas. */
export const WA_NARRA = 'https://wa.me/5493417545069';

/** Carpeta compartida donde el cliente deja su material para analizar. */
export const DRIVE_MATERIAL =
  'https://drive.google.com/drive/folders/1574BvXiyJd4hf_tcAYdgleKQIV5kFyiY?usp=sharing';

const LISANDRO = '5491130731011';

/** WhatsApp del equipo con el mensaje ya tipeado. */
export const waNarra = (texto: string) => WA_NARRA + '?text=' + encodeURIComponent(texto);

/** WhatsApp de Lisandro (bienvenida y consultas) con el mensaje ya tipeado. */
export const waLisandro = (texto: string) =>
  'https://wa.me/' + LISANDRO + '?text=' + encodeURIComponent(texto);
