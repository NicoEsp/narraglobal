/* Utilidades del ecosistema NARRA: parseo del datos.js que pega Lisandro,
   validación estructural (schema_version 1 y 2) y generación de códigos de
   suscripción. El producto tablero vive intacto en public/tablero/.

   Sobre las versiones: la v2 es la v1 más dos bloques opcionales —`semana`
   (la escena de la semana vigente) y `publicos.labs` (proyección rotulada).
   El producto los lee si están y sigue igual si no, así que la validación es
   retrocompatible en las dos direcciones: un datos.js v1 valida idéntico a
   como validaba antes, y los bloques nuevos se chequean cuando aparecen sin
   importar la versión declarada. */

/** Las que acepta el guard del producto en public/tablero/index.html. */
export const VERSIONES_SOPORTADAS = [1, 2] as const;

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
  publicos?: {
    /* proyección rotulada: si viene, el producto saca segmentos+mig de acá */
    labs?: Record<string, unknown>;
    [k: string]: unknown;
  };
  copy?: Record<string, unknown>;
  /* v2 · escena de la semana vigente (scatter cal×ret). Sin esto el producto
     cae a la escena del período. Ojo: no confundir con meta.semana, que es la
     etiqueta ("W32") y sigue siendo un string. */
  semana?: {
    piezas?: Array<Record<string, unknown>>;
    lanzadas?: number;
    llegaron?: number;
    [k: string]: unknown;
  };
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
  if (!(VERSIONES_SOPORTADAS as readonly number[]).includes(d.schema_version)) {
    errores.push(
      `schema_version debe ser ${VERSIONES_SOPORTADAS.join(' o ')} (llegó ${String(d.schema_version)}). El producto muestra el cartel de DATOS INCOMPATIBLES con otra versión.`,
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

  /* ── bloques de la v2 ──────────────────────────────────────────────────
     Los dos son opcionales y el producto los ignora en silencio si no están
     bien formados. Por eso lo que sólo se ignora va como aviso, y va como
     error nada más lo que el producto dibujaría roto (NaN / undefined a la
     vista). Se chequean estén donde estén: un datos.js v1 que ya los traiga
     se valida igual. */

  if (d.semana != null) {
    if (typeof d.semana !== 'object' || Array.isArray(d.semana)) {
      errores.push('semana debe ser un objeto.');
    } else {
      const sp = d.semana.piezas;
      if (!Array.isArray(sp) || sp.length === 0) {
        avisos.push(
          'semana viene sin piezas: el producto la ignora y cae a la escena del período.',
        );
      } else {
        sp.forEach((p, i) => {
          if (typeof p?.n !== 'string' || !p.n) {
            errores.push(`semana.piezas[${i}]: falta el nombre (n).`);
          }
          /* "sin medir" es válido y se dibuja aparte: sello sin_censo, o hit/ret
             en null. Sólo las medidas necesitan números para el scatter. */
          const sinMedir = p?.sello === 'sin_censo' || p?.hit == null || p?.ret == null;
          if (sinMedir) return;
          if (typeof p.cal !== 'number' || !Number.isFinite(p.cal)) {
            errores.push(`semana.piezas[${i}]: con hit y ret medidos, cal debe ser un número.`);
          }
          if (typeof p.ret !== 'number' || !Number.isFinite(p.ret)) {
            errores.push(`semana.piezas[${i}]: ret debe ser un número (o null si no se midió).`);
          }
          if (p.hit !== 0 && p.hit !== 1) {
            errores.push(`semana.piezas[${i}]: hit debe ser 0 o 1 (o null si no se midió).`);
          }
        });
      }
      for (const k of ['lanzadas', 'llegaron'] as const) {
        const v = d.semana[k];
        if (v != null && typeof v !== 'number') errores.push(`semana.${k} debe ser un número.`);
      }
    }
  }

  const labs = d.publicos?.labs;
  if (labs != null) {
    if (typeof labs !== 'object' || Array.isArray(labs)) {
      avisos.push('publicos.labs no es un objeto: el producto lo ignora y usa publicos tal cual.');
    } else {
      const l = labs as Record<string, unknown>;
      /* cuando labs está, segmentos y mig salen de ahí y tapan a los de publicos */
      if (l.segmentos == null && l.mig == null) {
        avisos.push(
          'publicos.labs no trae segmentos ni mig: la sección de públicos queda en blanco.',
        );
      }
    }
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
