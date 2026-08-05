/* El pulso semanal: cada suscripción tiene día + hora de entrega
   (ALTA-checklist: "tu primera entrega llega el domingo <fecha>"). */

const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab']; // Date.getDay(): 0=domingo

export const DIA_LARGO: Record<string, string> = {
  lun: 'lunes',
  mar: 'martes',
  mie: 'miércoles',
  jue: 'jueves',
  vie: 'viernes',
  sab: 'sábado',
  dom: 'domingo',
};

/* El pulso está guardado en la zona de la suscripción (`tz`), no en la del
   navegador: la entrega llega a las 09:00 del país del cliente aunque ese día
   esté en otro huso. Estas tres ayudas resuelven "tal hora de pared en tal
   zona" con Intl, sin sumar una librería de fechas. Todas las funciones de
   abajo aceptan `tz` opcional: sin ella se comportan como antes (la zona del
   navegador), que es lo correcto cuando no hay una suscripción de por medio. */

/** La zona si el navegador la entiende; undefined si la fila trae cualquier cosa. */
function zona(tz?: string | null): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

/** Cuánto va adelante de UTC la zona `z` en ese instante, en ms. */
function desfase(t: number, z: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: z,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(t));
  const v: Record<string, number> = {};
  for (const p of partes) if (p.type !== 'literal') v[p.type] = Number(p.value);
  // la hora vuelve como 24 a medianoche en algunos ICU
  return Date.UTC(v.year, v.month - 1, v.day, v.hour % 24, v.minute, v.second) - t;
}

/** Los números de pared que marca `z` (o el navegador) en ese instante. */
function pared(t: number, z?: string) {
  const d = z ? new Date(t + desfase(t, z)) : new Date(t);
  return z
    ? { y: d.getUTCFullYear(), mes: d.getUTCMonth(), dia: d.getUTCDate(), h: d.getUTCHours(), min: d.getUTCMinutes() }
    : { y: d.getFullYear(), mes: d.getMonth(), dia: d.getDate(), h: d.getHours(), min: d.getMinutes() };
}

/** El instante en que `z` marca esa hora de pared. */
function instante(y: number, mes: number, dia: number, h: number, min: number, z: string): number {
  const comoUTC = Date.UTC(y, mes, dia, h, min);
  const d1 = desfase(comoUTC, z);
  const t = comoUTC - d1;
  // si el desfase cambió es que cruzamos un cambio de hora: vale el de llegada
  const d2 = desfase(t, z);
  return d2 === d1 ? t : comoUTC - d2;
}

/** El primer pulso posterior a ese instante, resuelto en la zona `z`. */
function pulsoDespues(t: number, pulsoDia: string, pulsoHora: string, z?: string): Date {
  const objetivo = Math.max(0, DIAS_SEMANA.indexOf(pulsoDia));
  const [h, m] = pulsoHora.split(':').map(Number);

  if (z) {
    const base = pared(t, z);
    // el día de la semana de esa fecha de calendario, no del instante
    const diaSemana = new Date(Date.UTC(base.y, base.mes, base.dia)).getUTCDay();
    const delta = (objetivo - diaSemana + 7) % 7;
    const cand = instante(base.y, base.mes, base.dia + delta, h || 0, m || 0, z);
    // si la de ese día ya pasó, la próxima es la de la semana que viene
    return new Date(
      cand > t ? cand : instante(base.y, base.mes, base.dia + delta + 7, h || 0, m || 0, z),
    );
  }

  const d = new Date(t);
  d.setHours(h || 0, m || 0, 0, 0);
  let delta = (objetivo - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= t) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/** Próxima ocurrencia del pulso, resuelta en la zona de la suscripción. */
export function proximoPulso(pulsoDia: string, pulsoHora: string, tz?: string | null): Date {
  return pulsoDespues(Date.now(), pulsoDia, pulsoHora, zona(tz));
}

/**
 * El pulso **prometido**: el primero después del alta. Es la fecha que se le
 * dijo al cliente cuando terminó su onboarding y no se mueve sola.
 *
 * La antesala cuenta contra esta, no contra `proximoPulso`: si el equipo no
 * llegó a publicar a horario, `proximoPulso` salta a la semana siguiente y a
 * las 09:05 del domingo prometido la pantalla decía «faltan 6 días» — justo
 * cuando la persona entra porque le dijimos que su entrega era a las 09:00.
 * Con esta, la entrega prometida queda fija y la antesala puede decir que se
 * está demorando en vez de correr la promesa.
 */
export function pulsoPrometido(
  desde: string,
  pulsoDia: string,
  pulsoHora: string,
  tz?: string | null,
): Date {
  const t = new Date(desde).getTime();
  return pulsoDespues(Number.isFinite(t) ? t : Date.now(), pulsoDia, pulsoHora, zona(tz));
}

/** "el domingo 20 de julio a las 09:00" */
export function fraseFecha(fecha: Date, pulsoHora: string, tz?: string | null): string {
  const dia = fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: zona(tz),
  });
  return `el ${dia} a las ${pulsoHora.slice(0, 5)}`;
}

/** "domingo 20/07" — corto, para las placas de entrega. */
export function fechaCorta(fecha: Date, tz?: string | null): string {
  return fecha.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    timeZone: zona(tz),
  });
}

/** "el domingo 20 de julio a las 09:00", para el próximo pulso. */
export function fraseProximoPulso(pulsoDia: string, pulsoHora: string, tz?: string | null): string {
  return fraseFecha(proximoPulso(pulsoDia, pulsoHora, tz), pulsoHora, tz);
}

/** "domingo 20/07" — la placa de la primera lectura del alta. */
export function fechaCortaPulso(pulsoDia: string, pulsoHora: string, tz?: string | null): string {
  return fechaCorta(proximoPulso(pulsoDia, pulsoHora, tz), tz);
}

/** "faltan 3 días · 4 h" — la espera en unidades que se sienten, no una fecha
    más. La usa la antesala, que alguien puede dejar abierta; por eso `ahora`
    entra por parámetro y no lo lee de adentro. */
export function faltaPara(objetivo: Date, ahora: number = Date.now()): string {
  const ms = objetivo.getTime() - ahora;
  if (ms <= 0) return 'llega en minutos';
  const minutos = Math.floor(ms / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  if (dias >= 1) return `faltan ${dias} ${dias === 1 ? 'día' : 'días'} · ${horas % 24} h`;
  if (horas >= 1) return `faltan ${horas} h · ${minutos % 60} min`;
  return `faltan ${Math.max(1, minutos)} min`;
}

const DIA_A_BYDAY: Record<string, string> = {
  dom: 'SU',
  lun: 'MO',
  mar: 'TU',
  mie: 'WE',
  jue: 'TH',
  vie: 'FR',
  sab: 'SA',
};

/** Link de Google Calendar para agendar el pulso semanal (evento recurrente). */
export function enlaceCalendarioPulso(pulsoDia: string, pulsoHora: string, tz: string): string {
  const z = zona(tz);
  const inicio = proximoPulso(pulsoDia, pulsoHora, z);
  const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  // `dates` va sin huso y el huso lo declara `ctz`: las dos cosas tienen que
  // hablar de la misma zona, así que la hora de pared se lee en `z`.
  const stamp = (d: Date) => {
    const w = pared(d.getTime(), z);
    return `${w.y}${p(w.mes + 1)}${p(w.dia)}T${p(w.h)}${p(w.min)}00`;
  };
  const byday = DIA_A_BYDAY[pulsoDia] ?? 'MO';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'narraglobal · tu informe semanal',
    dates: `${stamp(inicio)}/${stamp(fin)}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
    ctz: tz,
    details: 'Tu actualización de narrativa pública. narraglobal.',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
