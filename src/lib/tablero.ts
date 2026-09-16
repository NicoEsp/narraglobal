/* El producto tablero (Narra ID v2, 15-09-2026) vive INTACTO en
   public/tablero/index.html: la muda es la madre y se actualiza reemplazando ese
   archivo, nunca editándolo acá. El contrato está en docs/tablero/LEEME.md y
   MONTAJE.md. En runtime se le aplica una sola transformación quirúrgica:
   reemplazar el <script src="datos.js"> por los datos del cliente autenticado,
   que el producto lee de window.NARRA_RANKING. La suscripción ya no tiene
   escalones y el producto no lee ningún ?plan=, así que el plan no viaja.
   Los assets relativos que quedan (el favicon de marca/) se apuntan a /tablero/. */

const TAG_DATOS = '<script src="datos.js"></script>';

/** Lo mínimo que el producto necesita para dibujar algo: las canchas.
    `TOPS` es la emisión vigente (emit_tablero.py, 10-09); `listas` es la
    anterior, que el producto todavía traduce. Sin ninguna de las dos, el
    tablero sale vacío y sin error visible: eso es lo que se evita acá. */
export function esEmisionNarraId(datos: unknown): boolean {
  if (!datos || typeof datos !== 'object') return false;
  const d = datos as Record<string, unknown>;
  const bloque = d.TOPS ?? d.listas;
  return bloque != null && typeof bloque === 'object' && !Array.isArray(bloque);
}

export function prepararTablero(html: string, datos: unknown): string {
  if (!html.includes(TAG_DATOS)) {
    throw new Error(
      'El producto en /tablero/index.html cambió y la inyección de datos ya no encuentra <script src="datos.js">. Hay que actualizar prepararTablero junto con la muda.',
    );
  }
  if (!esEmisionNarraId(datos)) {
    throw new Error(
      'Esta semana está guardada en el formato del tablero anterior y la muda del 15-09 no la lee. Hay que volver a cargarla con el datos.js de la emisión nueva (TOPS · PIEZAS · SEMANA).',
    );
  }
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  const inyeccion = `<script>window.NARRA_RANKING=${json};</script>`;

  return html
    .replace(TAG_DATOS, inyeccion)
    .replaceAll('href="marca/', 'href="/tablero/marca/');
}
