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
