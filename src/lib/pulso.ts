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

/** Próxima ocurrencia del pulso (aproximada a la tz del navegador). */
export function proximoPulso(pulsoDia: string, pulsoHora: string): Date {
  const objetivo = Math.max(0, DIAS_SEMANA.indexOf(pulsoDia));
  const [h, m] = pulsoHora.split(':').map(Number);
  const ahora = new Date();
  const d = new Date(ahora);
  d.setHours(h || 0, m || 0, 0, 0);
  let delta = (objetivo - d.getDay() + 7) % 7;
  if (delta === 0 && d.getTime() <= ahora.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/** "el domingo 20 de julio a las 09:00" */
export function fraseProximoPulso(pulsoDia: string, pulsoHora: string): string {
  const fecha = proximoPulso(pulsoDia, pulsoHora);
  const dia = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `el ${dia} a las ${pulsoHora.slice(0, 5)}`;
}

/** "domingo 20/07" — corto, para la placa de la primera lectura del alta. */
export function fechaCortaPulso(pulsoDia: string, pulsoHora: string): string {
  const fecha = proximoPulso(pulsoDia, pulsoHora);
  return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: '2-digit' });
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
  const inicio = proximoPulso(pulsoDia, pulsoHora);
  const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = (d: Date) =>
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
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
