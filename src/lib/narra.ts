/* Utilidades del ecosistema NARRA: parseo del datos.js que pega Lisandro,
   validación estructural de la emisión y generación de códigos de suscripción.
   El producto tablero vive intacto en public/tablero/ (Narra ID v2, 15-09-2026).

   El contrato es el de docs/tablero/LEEME.md: `schema_version: 2` y la emisión
   de emit_tablero.py del 10-09 —`TOPS` (las canchas con sus filas), `PIEZAS`
   (la pieza más comentada por actor), `SEMANA` (la semana del cliente),
   `JUGADAS`, `LIDER`, `ORD`, `GEO`— más lo que carga Lisandro en `meta`
   (actor_id, funciono, ponderación, packs) y en `SEMANA.funciono` (los
   porqués, la instrucción). Lo que el motor no produce va en null con su
   `origen`, y la plantilla lo resuelve sola. Por eso acá va como ERROR sólo lo
   que el producto dibujaría roto o vacío, y como AVISO lo que sale con un
   guión o con el texto por defecto.

   El datos.js del tablero anterior (piezas / censo / series / qc / pool) ya no
   sirve: la muda nueva no lo lee, y se rechaza con un mensaje que lo diga. */

/** La que acepta la muda del 15-09 (misma versión que la entrega del 10-09). */
export const VERSIONES_SOPORTADAS = [2] as const;

export interface FilaTop {
  n?: string;
  nombre?: string;
  actor_id?: string;
  rol?: string;
  i?: number | null;
  d?: number | '=' | null;
  lw?: number | null;
  pk?: number | null;
  sm?: number | null;
  q?: number | null;
  dv?: number | null;
  /** la forma de ocho semanas: "fl,up,dn,…" o la lista ya partida */
  f?: string | string[];
  you?: 0 | 1;
  foto?: string | null;
  nota?: string;
  [k: string]: unknown;
}

export interface Cancha {
  nombre?: string;
  ambito?: string;
  total?: number;
  cuentas?: number;
  filas?: FilaTop[];
  [k: string]: unknown;
}

export interface PiezaTop {
  t?: string;
  m?: string;
  u?: string;
  origen?: string;
}

export interface DatosNarra {
  schema_version: number;
  emision?: {
    reglas?: { ventana_semanas?: number; [k: string]: unknown };
    ventana?: { semanas?: string[]; [k: string]: unknown };
    [k: string]: unknown;
  };
  meta?: {
    cliente?: string;
    iniciales?: string;
    /* el número de semana (36). En el tablero anterior era la etiqueta "W32". */
    semana?: number | string;
    proxima?: string;
    /* si viene, el cliente ve la franja rosa de «nota de emisión» */
    nota?: string;
    actor_id?: string;
    desde?: string;
    [k: string]: unknown;
  };
  TOPS?: Record<string, Cancha>;
  PIEZAS?: Record<string, Record<string, PiezaTop>>;
  GEO?: Record<string, { vb?: string; d?: string }> | null;
  SEMANA?: {
    semana?: number;
    piezas?: number;
    piezas_medidas?: number;
    proxima?: string;
    calidad?: { serie?: unknown[]; [k: string]: unknown };
    influencia?: { base?: number | null; serie?: unknown[]; [k: string]: unknown };
    funciono?: {
      uno?: Record<string, unknown> | null;
      dos?: Record<string, unknown> | null;
      repetir?: Record<string, unknown> | null;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/** Acepta el datos.js completo (window.NARRA_RANKING = {...}; más el bloque
    de Lisandro debajo) o el objeto en JSON puro. Un datos.js del tablero
    anterior (window.NARRA) también se lee, para que el validador pueda decir
    con claridad que es del formato viejo. */
export function parseDatosJs(texto: string): DatosNarra {
  const t = texto.trim();
  if (!t) throw new Error('El contenido está vacío.');

  try {
    return JSON.parse(t) as DatosNarra;
  } catch {
    /* no era JSON puro: probamos como datos.js */
  }

  const win: { NARRA_RANKING?: DatosNarra; NARRA?: DatosNarra } = {};
  try {
    new Function('window', `'use strict';${t}`)(win);
  } catch (e) {
    throw new Error(
      'No se pudo leer el contenido como datos.js: ' +
        (e instanceof Error ? e.message : String(e)),
    );
  }
  const d = win.NARRA_RANKING ?? win.NARRA;
  if (!d || typeof d !== 'object') {
    throw new Error('El contenido no define window.NARRA_RANKING.');
  }
  return d;
}

/** La etiqueta de la semana para el back office: «W36». La emisión trae el
    número en meta.semana (el tablero anterior traía la etiqueta como texto);
    si falta, se toma la última semana ISO de la ventana ("2026-W36"). */
export function etiquetaSemana(d: DatosNarra): string {
  const s = d.meta?.semana;
  if (typeof s === 'string' && s.trim()) return s.trim();
  if (typeof s === 'number' && Number.isFinite(s)) return 'W' + s;
  const ss = d.SEMANA?.semana;
  if (typeof ss === 'number' && Number.isFinite(ss)) return 'W' + ss;
  const semanas = d.emision?.ventana?.semanas;
  if (Array.isArray(semanas) && semanas.length > 0) {
    const ultima = semanas[semanas.length - 1];
    if (typeof ultima === 'string' && ultima) return ultima;
  }
  return '';
}

export interface ResultadoValidacion {
  ok: boolean;
  errores: string[];
  avisos: string[];
}

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  v != null && typeof v === 'object' && !Array.isArray(v);

const esNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** número, o null/undefined (el motor emite null cuando no produce el dato) */
const numeroONull = (v: unknown) => v == null || esNumero(v);

const FORMAS = ['up', 'dn', 'fl'];

/** Validación estructural: lo que el producto necesita para no salir roto ni
    vacío. Espeja el espíritu del validador del repo de la muda. */
export function validarNarra(d: DatosNarra): ResultadoValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];

  if (!esObjeto(d)) {
    return { ok: false, errores: ['Los datos no son un objeto.'], avisos };
  }

  /* ── el formato viejo se rechaza de una, con el porqué ── */
  const bloquesViejos = ['pool', 'censo', 'qc', 'dist', 'publicos'].filter((k) => d[k] != null);
  if (d.TOPS == null && (bloquesViejos.length > 0 || Array.isArray(d.piezas))) {
    return {
      ok: false,
      errores: [
        `Este datos.js es del tablero anterior (trae ${[...bloquesViejos, ...(Array.isArray(d.piezas) ? ['piezas'] : [])].join(', ')}). La muda del 15-09 lee la emisión de emit_tablero.py: TOPS, PIEZAS y SEMANA. Hay que pegar el datos.js nuevo.`,
      ],
      avisos,
    };
  }

  if (!(VERSIONES_SOPORTADAS as readonly number[]).includes(d.schema_version)) {
    errores.push(
      `schema_version debe ser ${VERSIONES_SOPORTADAS.join(' o ')} (llegó ${String(d.schema_version)}): es el contrato de la emisión del 10-09.`,
    );
  }

  /* ── meta: el nombre del cliente, la semana, el rótulo ── */
  if (!esObjeto(d.meta)) {
    errores.push('Falta el bloque "meta" (cliente, iniciales, semana, y lo que carga Lisandro).');
  } else {
    const m = d.meta;
    if (!m.cliente) avisos.push('meta.cliente está vacío: la barra sale sin el nombre del cliente.');
    if (m.semana == null) avisos.push('meta.semana está vacío: el título y el rótulo salen sin número de semana.');
    if (!m.desde) avisos.push('meta.desde está vacío: el rótulo de la semana (S1SEP/36,26) sale en blanco.');
    if (m.nota) {
      avisos.push(
        'meta.nota está cargada: el cliente ve la franja rosa de «nota de emisión» con ese texto. Si es una nota interna, vaciarla antes de publicar.',
      );
    }
  }

  /* ── TOPS: las canchas. Sin esto no se dibuja ninguna card ── */
  const yoIds = new Set<string>();
  let yoTotal = 0;
  if (d.TOPS == null) {
    errores.push(
      'Falta el bloque "TOPS" (las canchas con sus filas). Sin canchas el tablero sale vacío.',
    );
  } else if (!esObjeto(d.TOPS)) {
    errores.push('TOPS debe ser un objeto con una cancha por clave (ciudad, provincial, nacional).');
  } else {
    const canchas = Object.entries(d.TOPS);
    if (canchas.length === 0) errores.push('TOPS no trae ninguna cancha: no se dibuja ninguna card.');
    for (const [k, cancha] of canchas) {
      if (!esObjeto(cancha) || !Array.isArray(cancha.filas)) {
        errores.push(`TOPS.${k}.filas debe ser una lista de filas.`);
        continue;
      }
      const filas = cancha.filas as unknown[];
      if (filas.length === 0) avisos.push(`TOPS.${k} no trae filas: la card sale sin tabla.`);
      let yoEnCancha = 0;
      filas.forEach((f, i) => {
        const ruta = `TOPS.${k}.filas[${i}]`;
        if (!esObjeto(f)) {
          errores.push(`${ruta} debe ser un objeto.`);
          return;
        }
        if (typeof f.actor_id !== 'string' || !f.actor_id) {
          errores.push(`${ruta}: falta actor_id (por ahí se marcan tu fila, la ponderación y las piezas extra).`);
        }
        if (typeof f.nombre !== 'string' || !f.nombre) {
          errores.push(`${ruta}: falta el nombre.`);
        }
        for (const c of ['i', 'q', 'dv'] as const) {
          if (!numeroONull(f[c])) errores.push(`${ruta}.${c} debe ser un número o null (llegó ${JSON.stringify(f[c])}).`);
        }
        if (!(f.d == null || esNumero(f.d) || f.d === '=')) {
          avisos.push(`${ruta}.d debe ser un número, "=" o null: se muestra un guión.`);
        }
        for (const c of ['lw', 'pk', 'sm'] as const) {
          if (!numeroONull(f[c])) avisos.push(`${ruta}.${c} debe ser un número o null: se ignora.`);
        }
        if (f.f != null) {
          const forma = typeof f.f === 'string' ? f.f.split(',') : f.f;
          if (!Array.isArray(forma) || forma.some((c) => !FORMAS.includes(String(c).trim()))) {
            avisos.push(`${ruta}.f debe ser la forma de ocho semanas con up/dn/fl (llegó ${JSON.stringify(f.f)}).`);
          } else if (forma.length !== 8) {
            avisos.push(`${ruta}.f tiene ${forma.length} semanas (la forma es de 8).`);
          }
        }
        if (f.you === 1) {
          yoEnCancha += 1;
          yoTotal += 1;
          if (typeof f.actor_id === 'string') yoIds.add(f.actor_id);
        }
      });
      if (yoEnCancha > 1) {
        errores.push(`TOPS.${k} tiene ${yoEnCancha} filas con you:1: tiene que haber una sola, la del cliente.`);
      }
    }
    if (canchas.length > 0 && yoTotal === 0) {
      errores.push(
        'Ninguna cancha trae la fila del cliente (you:1): sin ella no hay «Vos», ni puesto, ni fila azul.',
      );
    }
    if (yoIds.size > 1) {
      avisos.push(`La fila you:1 no es el mismo actor en todas las canchas (${[...yoIds].join(', ')}).`);
    }
    const actorMeta = esObjeto(d.meta) ? d.meta.actor_id : undefined;
    if (typeof actorMeta === 'string' && actorMeta && yoIds.size > 0 && !yoIds.has(actorMeta)) {
      avisos.push(
        `meta.actor_id ("${actorMeta}") no coincide con la fila you:1 (${[...yoIds].join(', ')}): la fila del cliente se marca por actor_id.`,
      );
    }
  }

  /* ── PIEZAS: la más comentada por actor, por apellido. Si no cuadra, no se muestra ── */
  if (d.PIEZAS != null) {
    if (!esObjeto(d.PIEZAS)) {
      avisos.push('PIEZAS debe ser un objeto por cancha: se ignora.');
    } else {
      for (const [k, porActor] of Object.entries(d.PIEZAS)) {
        if (!esObjeto(porActor)) {
          avisos.push(`PIEZAS.${k} debe ser un objeto por apellido: se ignora.`);
          continue;
        }
        const filas = esObjeto(d.TOPS) && esObjeto(d.TOPS[k]) ? d.TOPS[k].filas : undefined;
        const apellidos = new Set(
          (Array.isArray(filas) ? filas : []).map((f) => (esObjeto(f) ? String(f.n ?? '') : '')),
        );
        if (!Array.isArray(filas)) {
          avisos.push(`PIEZAS.${k} no tiene su cancha en TOPS: esas piezas no se muestran.`);
          continue;
        }
        for (const [apellido, pieza] of Object.entries(porActor)) {
          if (!esObjeto(pieza) || typeof pieza.t !== 'string' || !pieza.t) {
            avisos.push(`PIEZAS.${k}.${apellido} viene sin texto (t): no se muestra el play.`);
          } else if (!apellidos.has(apellido)) {
            avisos.push(`PIEZAS.${k}.${apellido} no corresponde a ninguna fila de TOPS.${k}: no se muestra.`);
          }
        }
      }
    }
  }

  /* ── SEMANA: las tres cards de tu semana ── */
  if (d.SEMANA == null) {
    avisos.push('Falta el bloque "SEMANA": las tres cards de tu semana salen con «sin dato».');
  } else if (!esObjeto(d.SEMANA)) {
    errores.push('SEMANA debe ser un objeto.');
  } else {
    const S = d.SEMANA;
    for (const bloque of ['calidad', 'influencia'] as const) {
      const b = S[bloque];
      if (b == null) continue;
      if (!esObjeto(b)) {
        errores.push(`SEMANA.${bloque} debe ser un objeto.`);
        continue;
      }
      const serie = b.serie;
      if (serie == null) continue;
      if (!Array.isArray(serie) || serie.some((v) => !esNumero(v))) {
        errores.push(`SEMANA.${bloque}.serie debe ser una lista de números: con otra cosa la curva sale rota (NaN).`);
      } else if (serie.length < 2) {
        avisos.push(`SEMANA.${bloque}.serie tiene ${serie.length} punto(s): la curva necesita al menos dos semanas.`);
      }
    }
    if (esObjeto(S.influencia) && !numeroONull(S.influencia.base)) {
      errores.push('SEMANA.influencia.base debe ser un número o null.');
    }

    const F = S.funciono;
    if (F != null && !esObjeto(F)) {
      errores.push('SEMANA.funciono debe ser un objeto (uno, dos, repetir).');
    } else if (esObjeto(F)) {
      const uno = F.uno;
      if (uno != null) {
        if (!esObjeto(uno)) errores.push('SEMANA.funciono.uno debe ser un objeto o null.');
        else {
          for (const c of ['gente', 'comentarios', 'q'] as const) {
            if (!numeroONull(uno[c])) errores.push(`SEMANA.funciono.uno.${c} debe ser un número o null.`);
          }
        }
      }
      const dos = F.dos;
      if (dos != null) {
        if (!esObjeto(dos)) errores.push('SEMANA.funciono.dos debe ser un objeto o null.');
        else if (!numeroONull(dos.v)) errores.push('SEMANA.funciono.dos.v debe ser un número o null.');
      }
      const rep = F.repetir;
      if (rep != null && !esObjeto(rep)) errores.push('SEMANA.funciono.repetir debe ser un objeto o null.');

      /* los cuatro textos de Lisandro: sin ellos, la plantilla pone su texto por defecto */
      const faltan: string[] = [];
      if (esObjeto(uno) && uno.nombre && !uno.porque) faltan.push('uno.porque');
      if (esObjeto(dos) && dos.nombre && !dos.porque) faltan.push('dos.porque');
      if (!esObjeto(rep) || !rep.accion) faltan.push('repetir.accion (la instrucción de la semana)');
      if (esObjeto(rep) && rep.accion && !(Array.isArray(rep.pasos) && rep.pasos.length > 0)) {
        faltan.push('repetir.pasos (la secuencia; sale la de la plantilla)');
      }
      if (faltan.length > 0) {
        avisos.push(`Faltan textos de Lisandro en SEMANA.funciono: ${faltan.join(' · ')}. Salen los textos por defecto.`);
      }
    } else {
      avisos.push('SEMANA.funciono está vacío: las cards de tu semana salen con «sin dato».');
    }
  }

  /* ── GEO: las siluetas. Opcional; si viene mal formada se dibuja un SVG roto ── */
  if (d.GEO != null) {
    if (!esObjeto(d.GEO)) {
      avisos.push('GEO debe ser un objeto por cancha (vb, d): se ignora.');
    } else {
      for (const [k, g] of Object.entries(d.GEO)) {
        if (!esObjeto(g) || typeof g.vb !== 'string' || typeof g.d !== 'string') {
          errores.push(`GEO.${k} debe traer vb y d como texto: si no, la silueta sale como un SVG roto.`);
        }
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
