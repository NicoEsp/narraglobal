import { useEffect, useState } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import {
  DIA_LARGO,
  enlaceCalendarioPulso,
  faltaPara,
  fechaCorta,
  fraseFecha,
  proximoPulso,
  pulsoPrometido,
} from '@/lib/pulso';
import { DRIVE_MATERIAL, waLisandro, waNarra } from '@/lib/enlaces';
import '@/styles/espera.css';

type Suscripcion = Tables<'suscripciones'>;
type RedItem = { red: string; usuario: string };

interface Props {
  suscripcion: Suscripcion;
  /** El email con el que entró (el de la sesión, no el de la fila). */
  email: string;
  onSalir: () => void;
}

/* El producto ya no tiene escalones: «Narra ID · un solo acceso: todo el tablero
   abierto para todos» (public/tablero/index.html). En el store siguen las
   etiquetas viejas: 'pro' es legado y se lee igual que 'base', y 'demo' es la
   cortesía con vencimiento. Nombrar acá un "Pro" que el tablero ya no muestra
   sería prometer un escalón que no existe. */
const PLAN_NOMBRE: Record<string, string> = {
  base: 'Narra ID',
  pro: 'Narra ID',
  demo: 'Narra ID · cortesía',
};

/** Lo que va a encontrar adentro, con los nombres y el orden del producto
    (los dos bloques de su navegación). No es marketing: es la expectativa
    concreta de lo que abre el día de su pulso. Si se reemplaza la muda, esto
    se actualiza con ella. */
const BLOQUES = [
  {
    n: '01',
    bloque: 'Tu semana',
    items: [
      { t: 'Qué cambió esta semana', d: 'La lectura de apertura: lo que se movió, y la conclusión para accionar.' },
      { t: 'Los mensajes que llegaron', nuevo: true, d: 'Pieza por pieza: cuáles impactaron y cuáles se disolvieron.' },
      { t: 'Calidad de tus mensajes', d: 'Tu calidad narrativa, con el techo y el piso de la semana.' },
      { t: 'Conclusiones y acciones sugeridas', d: 'La corrección de la semana, en instrucciones para tu equipo.' },
    ],
  },
  {
    n: '02',
    bloque: 'La pausa estratégica',
    items: [
      { t: 'Comportamiento de tu competencia', d: 'Tu performance y tu puesto entre los actores que elegiste mirar.' },
      { t: 'Comportamiento de tus públicos', d: 'Qué públicos se mueven con vos y cómo migran entre segmentos.' },
    ],
  },
];

const fFechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'long' });

/**
 * La antesala del tablero: lo que ve quien ya completó su alta y todavía no
 * tiene una semana publicada.
 *
 * Antes era una tarjeta con la fecha de entrega y un botón «Salir»: quien
 * volvía a entrar el martes —y el miércoles— encontraba exactamente lo mismo,
 * sin nada suyo adentro y sin nada para hacer. Acá ve su Narra ID completo
 * (los @ que medimos, su cancha, a quién mira de cerca, su pulso, su plan) y
 * puede corregirlo, sumar material o escribirle a Lisandro mientras espera.
 */
const Antesala = ({ suscripcion: sus, email, onSalir }: Props) => {
  const redes = Array.isArray(sus.redes) ? (sus.redes as unknown as RedItem[]) : [];
  const competidores = Array.isArray(sus.competidores)
    ? (sus.competidores as unknown as string[])
    : [];
  const hora = sus.pulso_hora.slice(0, 5);
  const dia = DIA_LARGO[sus.pulso_dia] ?? sus.pulso_dia;

  // El reloj se mueve solo: esta pantalla se deja abierta, y un «faltan 3 días»
  // congelado desde ayer miente. Todo lo que depende del tiempo se deriva de
  // este tic, así que el estado de la entrega también se actualiza.
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // La entrega prometida es el primer pulso después del alta, y no se mueve:
  // si el equipo no llegó a publicar a horario, la antesala lo dice en vez de
  // correr la promesa a la semana siguiente. Sin fecha de alta (fila marcada a
  // mano) no hay promesa que sostener y vale el próximo pulso.
  const entrega = sus.alta_completada_en
    ? pulsoPrometido(sus.alta_completada_en, sus.pulso_dia, hora, sus.tz)
    : proximoPulso(sus.pulso_dia, hora, sus.tz);
  const demorada = entrega.getTime() <= ahora;
  // más de dos días sin publicar ya no es «en camino»
  const muyDemorada = ahora - entrega.getTime() > 2 * 24 * 60 * 60 * 1000;

  // El alta pudo haberse marcado desde el back office (o venir de un cliente
  // viejo): en ese caso no hay @ ni categoría para mostrar y el panel del Narra
  // ID sería una grilla de guiones.
  const sinDatos = redes.length === 0 && !sus.categoria;

  const waCorregir = waNarra(
    `Hola. Soy ${sus.nombre} (suscripción ${sus.codigo}). Quiero corregir datos de mi Narra ID: `,
  );
  const waDemora = waNarra(
    `Hola. Soy ${sus.nombre} (suscripción ${sus.codigo}). Quería saber cómo viene mi primera entrega.`,
  );

  return (
    <div className="tb-shell">
      <div className="tb-barra">
        <img className="wm" src="/land/wm-a.svg" alt="narraglobal" />
        <span className="quien">{email}</span>
        <button className="salir" onClick={onSalir}>
          Salir
        </button>
      </div>

      <div className="es">
        <div className="es-in">
          <header className="es-head">
            <span className="es-eyebrow">
              <i className="dot" />
              {demorada
                ? 'Suscripción activa · tu primera entrega está en cierre'
                : 'Suscripción activa · preparando tu primera entrega'}
            </span>
            <h1 className="es-h">Hola, {sus.nombre}. Tu tablero se está preparando.</h1>
            <p className="es-p">
              NarraNoise® está midiendo tu línea de base con tus últimas semanas. Mientras tanto,
              esto es todo lo que vamos a leer de vos: revisalo y avisanos si hay algo para
              corregir — cuanto antes lo sepamos, más afinada sale tu primera lectura.
            </p>

            <div className="es-agenda">
              <div className="es-agtop">
                <div>
                  <div className="k">Tu primera entrega</div>
                  <div className="dd">
                    {fechaCorta(entrega, sus.tz)} · {hora}{' '}
                    <span className="tz">hora local</span>
                  </div>
                </div>
                <span className={'es-falta' + (demorada ? ' demora' : '')} aria-live="polite">
                  {demorada ? (muyDemorada ? 'demorada' : 'en camino') : faltaPara(entrega, ahora)}
                </span>
                <a
                  className="es-agbtn"
                  href={enlaceCalendarioPulso(sus.pulso_dia, hora, sus.tz)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agendar ↗
                </a>
              </div>
              <div className="es-agnote">
                {demorada ? (
                  <>
                    Todavía no la publicamos: la estamos cerrando y te avisamos apenas esté. Si
                    querés saber cómo viene,{' '}
                    <a href={waDemora} target="_blank" rel="noopener noreferrer">
                      escribinos
                    </a>
                    . Después llega <b>cada {dia} a las {hora}</b>.
                  </>
                ) : (
                  <>
                    Después llega <b>cada {dia} a las {hora}</b>, y te avisamos por WhatsApp cuando
                    está publicada. Esta pantalla se convierte en tu tablero apenas subimos la
                    semana: entrá con el mismo link.
                  </>
                )}
              </div>
            </div>
          </header>

          <ol className="es-pasos">
            <li className="es-paso ok">
              <span className="mk">✓</span>
              <div>
                <b>Alta completa</b>
                <s>
                  {sus.alta_completada_en
                    ? 'La cargaste el ' + fFechaCorta(sus.alta_completada_en)
                    : 'Tus datos están cargados'}
                </s>
              </div>
            </li>
            <li className="es-paso curso">
              <span className="mk" />
              <div>
                <b>NarraNoise® midiendo tu línea de base</b>
                <s>En curso · tus últimas semanas y las de quienes mirás de cerca</s>
              </div>
            </li>
            <li className={'es-paso' + (demorada ? ' curso' : '')}>
              <span className="mk" />
              <div>
                <b>Tu primera lectura</b>
                <s>
                  {fraseFecha(entrega, hora, sus.tz)}
                  {demorada && ' · la estamos cerrando'}
                </s>
              </div>
            </li>
          </ol>

          <section className="es-sec">
            <div className="es-sechead">
              <h2 className="es-h2">Tu Narra ID</h2>
              <span className="es-secnote">Lo que medimos de vos, semana a semana</span>
            </div>

            {sinDatos ? (
              <div className="es-vacio">
                <b>Todavía no tenemos tus perfiles públicos.</b>
                <p>
                  Sin al menos un @ no podemos medir tu narrativa. Pasanos tus cuentas por WhatsApp
                  y las cargamos nosotros — te lleva un minuto.
                </p>
                <a
                  className="es-btn"
                  href={waNarra(
                    `Hola. Soy ${sus.nombre} (suscripción ${sus.codigo}). Te paso mis perfiles públicos para completar mi Narra ID: `,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Completar mis datos
                </a>
              </div>
            ) : (
              <div className="es-grid">
                <div className="es-card ancha">
                  <div className="k">Perfiles que medimos</div>
                  {redes.length === 0 ? (
                    <div className="v mute">Sin perfiles cargados</div>
                  ) : (
                    <div className="es-redes">
                      {redes.map((r) => (
                        <span key={r.red + r.usuario} className="es-red">
                          <b>{r.red}</b>
                          <s>{r.usuario}</s>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="es-nota">Solo lo público. Nunca entramos a tus cuentas.</div>
                </div>

                <div className="es-card">
                  <div className="k">Tu cancha</div>
                  <div className="v">{sus.categoria || '—'}</div>
                  <div className="es-nota">
                    {sus.pais_de ? 'Comunicás desde ' + sus.pais_de : 'Mercado sin definir'}
                    {sus.pais_para ? ' · para ' + sus.pais_para : ''}
                  </div>
                </div>

                <div className="es-card">
                  <div className="k">Tu pulso</div>
                  <div className="v cap">
                    {dia} · {hora}
                  </div>
                  <div className="es-nota">{sus.tz}</div>
                </div>

                <div className="es-card ancha">
                  <div className="k">Mirás de cerca ({competidores.length} de 5)</div>
                  {competidores.length === 0 ? (
                    <>
                      <div className="v mute">Todavía no elegiste a nadie</div>
                      <div className="es-nota">
                        Podés sumar hasta 5 personas o marcas para compararte cada semana.{' '}
                        <a href={waCorregir} target="_blank" rel="noopener noreferrer">
                          Decinos a quiénes
                        </a>
                        .
                      </div>
                    </>
                  ) : (
                    <div className="es-mira">
                      {competidores.map((c, i) => (
                        <span key={c + i} className="es-chipm">
                          <i>{c.slice(0, 1).toUpperCase()}</i>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="es-card">
                  <div className="k">Tu suscripción</div>
                  <div className="v">
                    {PLAN_NOMBRE[sus.plan] ?? sus.plan}
                    {/* el único estado que cambia lo que ve: la cortesía vence */}
                    {sus.plan === 'demo' && <span className="es-chip demo">cortesía</span>}
                  </div>
                  <div className="es-nota">
                    {sus.plan === 'demo' && sus.demo_expira
                      ? 'Tu cortesía vence el ' + fFechaCorta(sus.demo_expira)
                      : 'Un solo acceso: el tablero entero es tuyo'}
                  </div>
                </div>

                <div className="es-card">
                  <div className="k">Acceso y contacto</div>
                  <div className="v chico">{email}</div>
                  <div className="es-nota">
                    {sus.telefono ? 'WhatsApp ' + sus.telefono : 'Sin WhatsApp cargado'}
                    {sus.equipo_tamano > 0
                      ? ' · equipo de ' + sus.equipo_tamano
                      : ' · trabajás solo'}
                  </div>
                </div>
              </div>
            )}

            {!sinDatos && (
              <div className="es-corregir">
                ¿Hay algo que no es tuyo o cambió?{' '}
                <a href={waCorregir} target="_blank" rel="noopener noreferrer">
                  Escribinos y lo corregimos
                </a>{' '}
                antes de la primera entrega.
              </div>
            )}
          </section>

          <section className="es-sec">
            <div className="es-sechead">
              <h2 className="es-h2">Qué vas a ver el {dia}</h2>
              <span className="es-secnote">Tu tablero, actualizado semana a semana</span>
            </div>
            <div className="es-lecturas">
              {BLOQUES.map((b) => (
                <section key={b.n} className="es-bloque">
                  <div className="bh">
                    <span className="n">{b.n}</span>
                    {b.bloque}
                  </div>
                  <ul>
                    {b.items.map((i) => (
                      <li key={i.t}>
                        <b>
                          {i.t}
                          {'nuevo' in i && i.nuevo && <span className="nv">Nuevo</span>}
                        </b>
                        <s>{i.d}</s>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          <section className="es-sec">
            <div className="es-sechead">
              <h2 className="es-h2">Mientras tanto</h2>
              <span className="es-secnote">Dos cosas que mejoran tu primera lectura</span>
            </div>
            <div className="es-acciones">
              <a
                className="es-accion"
                href={DRIVE_MATERIAL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="fi">
                  <svg
                    viewBox="0 0 24 24"
                    width="19"
                    height="19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <path d="M12 11.5v5M9.5 14h5" />
                  </svg>
                </span>
                <span className="ft">
                  <b>Subí tu material ↗</b>
                  <s>Docs, spots o campañas para analizar, además de tus perfiles</s>
                </span>
              </a>

              <a
                className="es-accion lis"
                href={waLisandro(
                  `Hola Lisandro. Soy ${sus.nombre}, estoy esperando mi primera entrega en narraglobal.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="lav">
                  <img src="/land/lisandro.jpg" alt="Lisandro" />
                  <i />
                </span>
                <span className="ft">
                  <b>Escribile a Lisandro</b>
                  <s>Consultas, pedidos o contexto que quieras que tengamos en cuenta</s>
                </span>
              </a>
            </div>
          </section>

          <div className="es-pie">
            <span>narraglobal · datos NarraNoise®</span>
            <button className="es-salir" onClick={onSalir}>
              Salir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Antesala;
