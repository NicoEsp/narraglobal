/* El producto tablero (Narra ID v2, 15-09-2026) vive en
   public/tablero/index.html: la muda es la madre y se actualiza reemplazando ese
   archivo, nunca editándolo acá. El contrato está en docs/tablero/LEEME.md y
   MONTAJE.md. En runtime se le inyecta el <script src="datos.js"> reemplazado por
   dos cosas: los datos del cliente autenticado, que el producto lee de
   window.NARRA_RANKING, y la base del álbum de fotos, que lee de
   window.NARRA_FOTOS_BASE.
   ⚠ 18-09-2026: la muda dejó de estar intacta. av() se editó a mano para armar la
   cara con esa base (ver MONTAJE.md §Las fotos). Al subir una muda nueva hay que
   volver a aplicarle ese parche o las caras se pierden en silencio.
   La suscripción ya no tiene
   escalones y el producto no lee ningún ?plan=, así que el plan no viaja.
   Los assets relativos que quedan (el favicon de marca/) se apuntan a /tablero/. */

const TAG_DATOS = '<script src="datos.js"></script>';

/** Álbum único de fotos (bucket público `fotos` del proyecto narraglobal). El
    producto arma la cara de cada fila con esta base + el actor_id + `.webp`, y
    si el archivo no está cae solo en las iniciales. Ver la migración
    20260918120000_bucket_fotos.sql. */
const FOTOS_BASE = 'https://aydtxqhtkcyytsamervs.supabase.co/storage/v1/object/public/fotos/';

/** Lo mínimo que el producto necesita para dibujar algo: la emisión vigente
    (schema_version 2, emit_tablero.py del 10-09) con sus canchas en `TOPS`.
    Es el mismo contrato que exige el validador de /admin. Con cualquier otra
    cosa el tablero sale vacío y sin error visible: eso es lo que se evita acá. */
export function esEmisionNarraId(datos: unknown): boolean {
  if (!datos || typeof datos !== 'object') return false;
  const d = datos as Record<string, unknown>;
  return (
    d.schema_version === 2 && d.TOPS != null && typeof d.TOPS === 'object' && !Array.isArray(d.TOPS)
  );
}

export function prepararTablero(html: string, datos: unknown): string {
  if (!html.includes(TAG_DATOS)) {
    throw new Error(
      'El producto en /tablero/index.html cambió y la inyección de datos ya no encuentra <script src="datos.js">. Hay que actualizar prepararTablero junto con la muda.',
    );
  }
  if (!esEmisionNarraId(datos)) {
    throw new Error(
      'Esta semana está guardada en un formato que la muda del 15-09 no lee: hace falta la emisión nueva (schema_version 2 con TOPS · PIEZAS · SEMANA). Hay que volver a cargarla con ese datos.js.',
    );
  }
  const json = JSON.stringify(datos).replace(/</g, '\\u003c');
  const inyeccion = `<script>window.NARRA_FOTOS_BASE=${JSON.stringify(FOTOS_BASE)};window.NARRA_RANKING=${json};</script>`;

  return html
    .replace(TAG_DATOS, inyeccion)
    .replaceAll('href="marca/', 'href="/tablero/marca/');
}
