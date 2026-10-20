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

/* Los links fijos de pago del Narra ID (USD 1,000 / mes, IVA incluido). Con
   links fijos el sitio no se entera solo del pago: el equipo lo cruza con el
   aviso de MP o PayPal y lo marca en el back office. */

/** Mercado Pago: la suscripción en pesos. */
export const MP_NARRA_ID = 'https://mpago.la/1QsU9Go';

/** PayPal: cobro único de USD 1,000 (PayPal.me no es una suscripción). */
export const PAYPAL_NARRA_ID = 'https://www.paypal.com/paypalme/lisandrobregant/1000USD';
