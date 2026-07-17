/* El producto tablero vive INTACTO en public/tablero/index.html (la muda es la
   madre: se actualiza reemplazando ese archivo, nunca editándolo acá). Estas
   transformaciones quirúrgicas se aplican en runtime sobre ese HTML:
   1. reemplaza <script src="datos.js"> por los datos del cliente autenticado,
   2. le pasa el plan/vencimiento por window.__NARRA_QS (el producto lee
      ?plan= de location.search, que en un iframe srcDoc está vacío),
   3. apunta los assets relativos (marca/, logos/, medios/) a /tablero/. */

const TAG_DATOS = '<script src="datos.js"></script>';
const LECTURA_QS = 'new URLSearchParams(location.search)';

export function prepararTablero(
  html: string,
  datos: unknown,
  plan: string,
  exp?: string | null,
): string {
  if (!html.includes(TAG_DATOS) || !html.includes(LECTURA_QS)) {
    throw new Error(
      'El producto en /tablero/index.html cambió y la inyección de datos ya no lo encuentra. Hay que actualizar prepararTablero junto con la muda.',
    );
  }
  const qs = new URLSearchParams({ plan });
  if (exp) qs.set('exp', exp);
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  const inyeccion = `<script>window.NARRA=${json};window.__NARRA_QS=${JSON.stringify('?' + qs.toString())};</script>`;

  return html
    .replace(TAG_DATOS, inyeccion)
    .replace(LECTURA_QS, 'new URLSearchParams(window.__NARRA_QS||location.search)')
    .replaceAll('src="marca/', 'src="/tablero/marca/')
    .replaceAll('src="logos/', 'src="/tablero/logos/')
    .replaceAll('src="medios/', 'src="/tablero/medios/')
    .replaceAll('href="marca/', 'href="/tablero/marca/');
}
