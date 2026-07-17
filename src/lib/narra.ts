/* Utilidades del ecosistema NARRA: parseo del datos.js que pega Lisandro,
   validación estructural (schema_version 1) y generación de códigos de
   suscripción. El producto tablero vive intacto en public/tablero/. */

export interface DatosNarra {
  schema_version: number;
  meta?: {
    cliente?: string;
    nombre?: string;
    nombre_corto?: string;
    semana?: string;
    actualizado?: string;
    [k: string]: unknown;
  };
  piezas?: Array<Record<string, unknown>>;
  censo?: { tipos?: Array<Record<string, unknown>>; [k: string]: unknown };
  series?: { llegaron?: Array<number | null>; [k: string]: unknown };
  qc?: {
    week?: { labels?: unknown[]; vos?: unknown[]; techo?: unknown[]; piso?: unknown[] };
    month?: { labels?: unknown[]; vos?: unknown[]; techo?: unknown[]; piso?: unknown[] };
  };
  dist?: Array<Record<string, unknown>>;
  pool?: Array<Record<string, unknown>>;
  publicos?: Record<string, unknown>;
  copy?: Record<string, unknown>;
  [k: string]: unknown;
}

/** Acepta el datos.js completo (window.NARRA={...};) o el objeto en JSON puro. */
export function parseDatosJs(texto: string): DatosNarra {
  const t = texto.trim();
  if (!t) throw new Error('El contenido está vacío.');

  try {
    return JSON.parse(t) as DatosNarra;
  } catch {
    /* no era JSON puro: probamos como datos.js */
  }

  const win: { NARRA?: DatosNarra } = {};
  try {
    new Function('window', `'use strict';${t}`)(win);
  } catch (e) {
    throw new Error(
      'No se pudo leer el contenido como datos.js: ' +
        (e instanceof Error ? e.message : String(e)),
    );
  }
  if (!win.NARRA || typeof win.NARRA !== 'object') {
    throw new Error('El contenido no define window.NARRA.');
  }
  return win.NARRA;
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: string[];
  avisos: string[];
}

/** Validación estructural mínima: lo que el producto necesita para no romperse.
    Espeja el espíritu de _tools/validar_tablero.js del repo de la muda. */
export function validarNarra(d: DatosNarra): ResultadoValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];

  if (!d || typeof d !== 'object') {
    return { ok: false, errores: ['Los datos no son un objeto.'], avisos };
  }
  if (d.schema_version !== 1) {
    errores.push(
      `schema_version debe ser 1 (llegó ${String(d.schema_version)}). El producto muestra el cartel de DATOS INCOMPATIBLES con otra versión.`,
    );
  }

  for (const bloque of ['meta', 'piezas', 'censo', 'series', 'qc', 'dist', 'pool', 'publicos', 'copy'] as const) {
    if (d[bloque] == null) errores.push(`Falta el bloque "${bloque}".`);
  }

  if (Array.isArray(d.piezas)) {
    if (d.piezas.length === 0) errores.push('piezas está vacío.');
    d.piezas.forEach((p, i) => {
      if (typeof p.n !== 'string' || !p.n) errores.push(`piezas[${i}]: falta el nombre (n).`);
      if (p.hit !== 0 && p.hit !== 1) errores.push(`piezas[${i}]: hit debe ser 0 o 1.`);
      if (p.hit === 1 && !(typeof p.ring === 'number' && p.ring >= 0 && p.ring <= 4)) {
        errores.push(`piezas[${i}]: con hit:1 falta ring (0–4).`);
      }
      if (p.hit === 0 && (typeof p.cause !== 'string' || !p.cause)) {
        errores.push(`piezas[${i}]: con hit:0 falta la cause canónica.`);
      }
    });
  } else if (d.piezas != null) {
    errores.push('piezas debe ser una lista.');
  }

  const llegaron = d.series?.llegaron;
  if (llegaron != null && (!Array.isArray(llegaron) || llegaron.length !== 8)) {
    errores.push('series.llegaron debe tener 8 valores (null = historia que no existe).');
  }

  for (const [periodo, largo] of [['week', 8], ['month', 4]] as const) {
    const q = d.qc?.[periodo];
    if (!q) continue;
    for (const serie of ['labels', 'vos', 'techo', 'piso'] as const) {
      const arr = q[serie];
      if (!Array.isArray(arr) || arr.length !== largo) {
        errores.push(`qc.${periodo}.${serie} debe tener ${largo} valores.`);
      }
    }
  }

  if (Array.isArray(d.pool)) {
    const vos = d.pool.filter((p) => p.you === 1).length;
    if (vos !== 1) errores.push(`pool debe tener exactamente UN you:1 (hay ${vos}).`);
  } else if (d.pool != null) {
    errores.push('pool debe ser una lista.');
  }

  if (Array.isArray(d.dist) && d.dist.length !== 5) {
    avisos.push(`dist tiene ${d.dist.length} posteos (lo habitual son 5).`);
  }

  if (d.meta) {
    if (d.meta.es_muda === true) avisos.push('meta.es_muda sigue en true: ¿es la plantilla sin vestir?');
    if (!d.meta.nombre) avisos.push('meta.nombre está vacío.');
    if (!d.meta.semana) avisos.push('meta.semana está vacío.');
  }

  const texto = JSON.stringify(d);
  if (texto.includes('[Pieza que') || texto.includes('[corchetes]') || texto.includes('[Titular')) {
    avisos.push('Quedan huecos de plantilla sin vestir ([corchetes]).');
  }

  return { ok: errores.length === 0, errores, avisos };
}

/* Alfabeto sin caracteres ambiguos (0/o, 1/l/i) */
const ALFABETO_CODIGO = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Código corto opaco para la URL /suscripcion/{codigo}. */
export function generarCodigo(largo = 8): string {
  const bytes = new Uint8Array(largo);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO_CODIGO[b % ALFABETO_CODIGO.length]).join('');
}
