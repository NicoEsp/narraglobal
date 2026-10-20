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
   aviso de MP o PayPal y lo marca en el back office. La suscripción de
   PayPal lleva el número de pedido (custom_id) y queda anotada en el pedido. */

/** Mercado Pago: la suscripción en pesos. */
export const MP_NARRA_ID = 'https://mpago.la/1QsU9Go';

/** PayPal: la suscripción de USD 1,000 / mes (botón de PayPal Subscriptions).
    El client-id es público: es el que PayPal pone en el código del botón. */
export const PAYPAL_CLIENT_ID =
  'BAA9TY8r0VhgBiwkKnCCFTftX9cGVmxefXdsQ4AmYaggoGNIziRILopkBbkTQMeUjgpQQ86eJINjXq41b8';
export const PAYPAL_PLAN_NARRA_ID = 'P-67T0654124275352WNLLS6DI';

/** El mismo plan como link, por si el botón de PayPal no carga. */
export const PAYPAL_LINK_NARRA_ID =
  'https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=' + PAYPAL_PLAN_NARRA_ID;
