import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useSesion } from '@/hooks/useAcceso';
import { fechaCortaPulso, enlaceCalendarioPulso, DIA_LARGO } from '@/lib/pulso';
import { DRIVE_MATERIAL, WA_NARRA, waLisandro } from '@/lib/enlaces';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import '@/styles/acceso.css';
import '@/styles/alta.css';

type Suscripcion = Tables<'suscripciones'>;

const WA_LISANDRO = waLisandro('Hola Lisandro. Recién completé mi alta en narraglobal.');
const PAISES = [
  'Argentina', 'México', 'Chile', 'Uruguay', 'Colombia', 'España', 'Estados Unidos', 'Otro',
];
const REDES = ['X', 'Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Otra'] as const;
type Red = (typeof REDES)[number];

/** Qué se espera en cada red: en LinkedIn y YouTube el link es tan válido como el @. */
const RED_PLACEHOLDER: Record<Red, string> = {
  X: '@usuario',
  Instagram: '@usuario',
  TikTok: '@usuario',
  LinkedIn: '@usuario o link',
  YouTube: '@canal o link',
  Otra: '@usuario o link',
};

const TOPE_MIRA = 5;

const CATEGORIAS = [
  { key: 'Política', ds: 'Campaña, gestión, opinión pública' },
  { key: 'Corporativo', ds: 'Marca, CEO, comunicación institucional' },
  { key: 'Otro', ds: 'Finanzas, startup científica, deporte…' },
];

/** % de la barra de progreso por paso. */
const PROGRESO = [4, 12, 22, 33, 45, 58, 70, 84, 96, 100];
const ULTIMO = PROGRESO.length - 1; // pantalla "listo"

const soloDigitos = (s: string) => s.replace(/[^\d]/g, '');

const Alta = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const { sesion, cargando } = useSesion();
  const navigate = useNavigate();

  const [sus, setSus] = useState<Suscripcion | null | undefined>(undefined); // undefined = cargando
  const [paso, setPaso] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El alta se completó en esta pantalla, recién. Mientras sea true nadie la
  // saca de acá: ya terminó y esta es su confirmación.
  const [completadaAca, setCompletadaAca] = useState(false);

  // campos del alta
  const [nombre, setNombre] = useState('');
  const [paisDe, setPaisDe] = useState('Argentina');
  const [paisPara, setPaisPara] = useState('Argentina');
  const [categoria, setCategoria] = useState('');
  const [categoriaOtro, setCategoriaOtro] = useState('');
  const [redes, setRedes] = useState<Record<Red, { on: boolean; usuario: string }>>(
    () =>
      Object.fromEntries(REDES.map((r) => [r, { on: false, usuario: '' }])) as Record<
        Red,
        { on: boolean; usuario: string }
      >,
  );
  const [competidores, setCompetidores] = useState<string[]>([]);
  // Tarjeta en blanco que se está tipeando al final de la grilla, si la hay.
  const [nuevoComp, setNuevoComp] = useState<string | null>(null);
  // Aviso del tope, transitorio: aparece al intentar la sexta y se va solo. Es
  // un contador y no un booleano para que al reintentar se remonte el cartel y
  // la animación vuelva a arrancar.
  const [avisoTope, setAvisoTope] = useState(0);
  const [conEquipo, setConEquipo] = useState(false);
  const [equipoN, setEquipoN] = useState(1);
  const [wa, setWa] = useState('');
  const [teamWa, setTeamWa] = useState('');

  // Ojo con la dependencia: es el id de usuario, no el objeto `sesion`.
  // Supabase emite eventos de auth con una sesión nueva cada vez (refresh de
  // token, volver a la pestaña), y dependiendo del objeto este efecto releía
  // la suscripción en medio del wizard: pisaba el nombre y el WhatsApp ya
  // tipeados, y al terminar el alta devolvía la fila con `alta_completada_en`
  // cargada, que es lo que empujaba a la persona a la pantalla de espera.
  const userId = sesion?.user.id;

  useEffect(() => {
    if (!userId || !codigo) return;
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();
      if (!vivo) return;
      setSus(data ?? null);
      if (data) {
        setNombre(data.nombre ?? '');
        if (data.telefono) setWa(soloDigitos(data.telefono).replace(/^549/, ''));
      }
    })();
    return () => {
      vivo = false;
    };
  }, [userId, codigo]);

  const puedeAvanzar = useMemo(() => {
    switch (paso) {
      case 1:
        return nombre.trim() !== '';
      case 3:
        return categoria !== '' && (categoria !== 'Otro' || categoriaOtro.trim() !== '');
      case 4:
        return REDES.some((r) => redes[r].on && redes[r].usuario.trim() !== '');
      case 7:
        return soloDigitos(wa).length >= 6;
      default:
        return true;
    }
  }, [paso, nombre, categoria, categoriaOtro, redes, wa]);

  const avanzar = () => setPaso((p) => Math.min(ULTIMO, p + 1));
  const atras = () => setPaso((p) => Math.max(0, p - 1));

  const toggleRed = (r: Red) =>
    setRedes((prev) => ({ ...prev, [r]: { ...prev[r], on: true } }));
  const setUsuario = (r: Red, usuario: string) =>
    setRedes((prev) => ({ ...prev, [r]: { ...prev[r], usuario } }));

  // El aviso del tope se borra solo: es un empujón, no un estado del paso.
  useEffect(() => {
    if (!avisoTope) return;
    const t = setTimeout(() => setAvisoTope(0), 3600);
    return () => clearTimeout(t);
  }, [avisoTope]);

  const abrirComp = () => {
    if (nuevoComp !== null) return; // ya hay una tarjeta en blanco esperando
    if (competidores.length >= TOPE_MIRA) {
      setAvisoTope((n) => n + 1);
      return;
    }
    setNuevoComp('');
  };

  /** Fija la tarjeta en blanco. Si quedó vacía, se descarta. */
  const fijarComp = () => {
    const v = (nuevoComp ?? '').trim();
    setNuevoComp(null);
    if (!v || competidores.length >= TOPE_MIRA) return;
    setCompetidores((c) => [...c, v]);
  };

  const finalizar = async () => {
    if (!codigo || enviando) return;
    setEnviando(true);
    setError(null);
    const redesPayload = REDES.filter((r) => redes[r].on && redes[r].usuario.trim() !== '').map(
      (r) => ({ red: r, usuario: redes[r].usuario.trim() }),
    );
    const datos = {
      nombre: nombre.trim(),
      telefono: '+549' + soloDigitos(wa),
      pais_de: paisDe,
      pais_para: paisPara,
      categoria: categoria === 'Otro' ? categoriaOtro.trim() : categoria,
      redes: redesPayload,
      competidores,
      equipo_tamano: conEquipo ? equipoN : 0,
      equipo_telefono: conEquipo && soloDigitos(teamWa).length >= 6 ? '+549' + soloDigitos(teamWa) : null,
    };
    const { error: err } = await supabase.rpc('completar_alta', { p_codigo: codigo, p_datos: datos });
    setEnviando(false);
    if (err) {
      setError('No pudimos guardar tu alta (' + err.message + '). Probá de nuevo en un minuto.');
      return;
    }
    setCompletadaAca(true);
    setPaso(ULTIMO);
  };

  // ---- gating de sesión / estado ----
  if (cargando || (sesion && sus === undefined)) {
    return (
      <div className="acc-pantalla">
        <div className="acc-pie">narraglobal · alta</div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="acc-pantalla">
        <MagicLinkForm
          kick="Alta de tu suscripción"
          titulo="Activá tu tablero"
          detalle="Ingresá el email con el que te suscribiste y te mandamos un código para completar tu alta. Sin contraseñas."
          redirectTo={window.location.origin + '/alta/' + (codigo ?? '')}
        />
        <div className="acc-pie">narraglobal · datos NarraNoise®</div>
      </div>
    );
  }

  if (sus === null) {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Alta de tu suscripción</div>
          <h1 className="acc-h">No encontramos esta suscripción</h1>
          <p className="acc-p">
            Estás con <b>{sesion.user.email}</b>, pero esa dirección no corresponde a esta alta.
            Entrá con el email con el que te suscribiste, o escribinos y lo resolvemos.
          </p>
          <div className="acc-form">
            <a className="acc-btn" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
              Escribirnos por WhatsApp
            </a>
            <button className="acc-btn sec" onClick={() => supabase.auth.signOut()}>
              Entrar con otro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // El onboarding está disponible mientras el alta siga pendiente
  // (alta_completada_en null) y la suscripción no esté pausada — aunque ya
  // figure 'activo'. Si el alta ya se completó o está pausada, manda el tablero.
  //
  // Salvo que el alta se haya completado acá recién: en ese caso la persona se
  // queda en su confirmación. Mandarla al tablero la deja frente a la pantalla
  // de espera («tu tablero se está preparando»), que es un paso atrás después
  // de haber terminado el alta. Al tablero va cuando lo pide, con el botón.
  const altaPendiente = sus.alta_completada_en === null && sus.estado !== 'pausado';
  if (!altaPendiente && !completadaAca) {
    return <Navigate to={'/suscripcion/' + sus.codigo} replace />;
  }

  const esListo = paso === ULTIMO;

  return (
    <div className="alta">
      <header className="alta-head">
        <div className="alta-hrow">
          <img className="alta-wm" src="/land/wm-a.svg" alt="narraglobal" />
          <div className="alta-promise">
            <span className="dotp" />
            <span>
              Tu informe ·{' '}
              <b>
                {DIA_LARGO[sus.pulso_dia] ?? sus.pulso_dia} · {sus.pulso_hora.slice(0, 5)}
              </b>
            </span>
          </div>
        </div>
        <div className="alta-progress">
          <i style={{ width: PROGRESO[paso] + '%' }} />
        </div>
      </header>

      <div className="alta-stage">
        <div className="alta-card">
          {/* 0 · intro */}
          {paso === 0 && (
            <section className="alta-step">
              <span className="alta-eyebrow">Alta · 2 minutos</span>
              <div className="alta-q">
                Bienvenido a narraglobal.
                <br />
                ¡Empecemos a darle forma a tu tablero!
              </div>
              <div className="alta-qs">
                Contestá las siguientes preguntas para que podamos comenzar ya mismo a medir tu
                narrativa pública.
              </div>
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar}>
                  Empezar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 1 · nombre */}
          {paso === 1 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 1 de 7</span>
              <div className="alta-q">¿Con quién hablamos?</div>
              <div className="alta-qs">Tu nombre, como querés que aparezca en tu tablero.</div>
              <div className="alta-field">
                <input
                  className="alta-tx"
                  autoFocus
                  placeholder="Ej.: Ciro"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar} disabled={!puedeAvanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 2 · país */}
          {paso === 2 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 2 de 7</span>
              <div className="alta-q">¿Desde dónde comunicás?</div>
              <div className="alta-qs">
                Nos dice contra qué mercado medirte — comparamos peras con peras.
              </div>
              <div className="alta-selrow">
                <div className="alta-selline">
                  <span className="lbl">Sos de</span>
                  <span className="alta-sel2">
                    <select value={paisDe} onChange={(e) => setPaisDe(e.target.value)}>
                      {PAISES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </span>
                </div>
                <div className="alta-selline">
                  <span className="lbl">Comunicás para</span>
                  <span className="alta-sel2">
                    <select value={paisPara} onChange={(e) => setPaisPara(e.target.value)}>
                      {PAISES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </span>
                </div>
              </div>
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 3 · categoría */}
          {paso === 3 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 3 de 7</span>
              <div className="alta-q">¿En qué categoría compite tu marca pública?</div>
              <div className="alta-qs">Elegí tu cancha. Es la vara contra la que te leemos.</div>
              <div className="alta-cats">
                {CATEGORIAS.map((c) => (
                  <button
                    key={c.key}
                    className={'alta-cat' + (categoria === c.key ? ' sel' : '')}
                    onClick={() => setCategoria(c.key)}
                  >
                    <span className="ico">◆</span>
                    <div>
                      <div className="nm">{c.key}</div>
                      <div className="ds">{c.ds}</div>
                    </div>
                  </button>
                ))}
              </div>
              {categoria === 'Otro' && (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="alta-tx"
                    style={{ fontSize: 19 }}
                    autoFocus
                    placeholder="¿Cuál es tu sector?"
                    value={categoriaOtro}
                    onChange={(e) => setCategoriaOtro(e.target.value)}
                  />
                </div>
              )}
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar} disabled={!puedeAvanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 4 · redes */}
          {paso === 4 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 4 de 7</span>
              <div className="alta-q">¿Dónde publicás?</div>
              <div className="alta-qs">
                Tocá tus redes y cargá tu usuario. Es lo que medimos — no entramos a ninguna cuenta,
                sólo lo público.
              </div>
              <div className="alta-nets">
                {REDES.map((r) =>
                  redes[r].on ? (
                    <div key={r} className="alta-rednet on">
                      <span className="nb"><span className="g" />{r}</span>
                      <input
                        className="at"
                        autoFocus
                        aria-label={'Tu usuario en ' + r}
                        placeholder={RED_PLACEHOLDER[r]}
                        value={redes[r].usuario}
                        onChange={(e) => setUsuario(r, e.target.value)}
                      />
                    </div>
                  ) : (
                    <button
                      key={r}
                      type="button"
                      className="alta-rednet"
                      aria-pressed={false}
                      onClick={() => toggleRed(r)}
                    >
                      <span className="nb"><span className="g" />{r}</span>
                      <span className="plus">+</span>
                    </button>
                  ),
                )}
              </div>
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar} disabled={!puedeAvanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 5 · a quién mirar de cerca */}
          {paso === 5 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 5 de 7</span>
              <div className="alta-q">¿A quién te gustaría mirar de cerca?</div>
              <div className="alta-qs">
                Elegí hasta <b>5 personas o marcas</b>: vas a ver su calidad narrativa semana a
                semana, con tips prácticos para achicar o ampliar la distancia. Está incluido en tu{' '}
                <b>Narra ID</b>.
              </div>
              {(competidores.length > 0 || nuevoComp !== null) && (
                <div className="alta-minis">
                  {competidores.map((c, idx) => (
                    <div key={c + idx} className="alta-mcard">
                      <div className="top">
                        <span className="av">{c.slice(0, 1).toUpperCase()}</span>
                        <span className="nm">{c}</span>
                        <button
                          className="x"
                          aria-label={'Quitar ' + c}
                          onClick={() => setCompetidores((l) => l.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </div>
                      <div className="bot">
                        <span className="val">—</span>
                        <span className="mlab">se mide desde tu alta</span>
                      </div>
                    </div>
                  ))}
                  {nuevoComp !== null && (
                    <div className="alta-mcard">
                      <div className="top">
                        <span className="av">
                          {nuevoComp.trim().slice(0, 1).toUpperCase() || '?'}
                        </span>
                        <span className="nm" style={{ flex: 1 }}>
                          <input
                            className="mtx"
                            autoFocus
                            aria-label="Nombre de la persona o marca a mirar de cerca"
                            placeholder="Nombre o marca"
                            value={nuevoComp}
                            onChange={(e) => setNuevoComp(e.target.value)}
                            onBlur={fijarComp}
                            onKeyDown={(e) => {
                              // Enter no avanza el paso acá: sólo cierra la tarjeta,
                              // y el blur la fija.
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.blur();
                              }
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                setNuevoComp(null);
                              }
                            }}
                          />
                        </span>
                        <button
                          className="x"
                          aria-label="Descartar"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setNuevoComp(null)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="bot">
                        <span className="val">—</span>
                        <span className="mlab">se mide desde tu alta</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button type="button" className="alta-addp" onClick={abrirComp}>
                + Sumar una persona o marca
              </button>
              {avisoTope > 0 && (
                <div key={avisoTope} className="alta-mwarn" role="status">
                  Cinco es el máximo. Para sumar una nueva, sacá primero una de la lista.
                </div>
              )}
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 6 · equipo */}
          {paso === 6 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 6 de 7</span>
              <div className="alta-q">¿Trabajás solo o con equipo?</div>
              <div className="alta-qs">Para saber cómo hablarte a vos — y a ellos.</div>
              <div className="alta-toggle" role="radiogroup" aria-label="¿Trabajás solo o con equipo?">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!conEquipo}
                  className={'t' + (!conEquipo ? ' sel' : '')}
                  onClick={() => setConEquipo(false)}
                >
                  Trabajo solo
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={conEquipo}
                  className={'t' + (conEquipo ? ' sel' : '')}
                  onClick={() => setConEquipo(true)}
                >
                  Con equipo
                </button>
              </div>
              {conEquipo && (
                <div className="alta-stepper">
                  <button
                    type="button"
                    className="s"
                    aria-label="Restar una persona"
                    onClick={() => setEquipoN((n) => Math.max(1, n - 1))}
                  >
                    –
                  </button>
                  <span className="cnt" aria-live="polite">{equipoN}</span>
                  <button
                    type="button"
                    className="s"
                    aria-label="Sumar una persona"
                    onClick={() => setEquipoN((n) => n + 1)}
                  >
                    +
                  </button>
                  <span className="cl">personas además de vos</span>
                </div>
              )}
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 7 · whatsapp */}
          {paso === 7 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 7 de 7</span>
              <div className="alta-q">¿Tu WhatsApp?</div>
              <div className="alta-astchip">
                <img className="avsvg" src="/land/asistente.svg" alt="" />
                <b>Asistente IA</b>
              </div>
              <div className="alta-qs">
                Con esto damos de alta a tu <b>Asistente IA</b> por WhatsApp: entrás a tus datos
                fácil, le pedís ideas y análisis, y tu equipo también. Es también por donde te
                avisamos cada {DIA_LARGO[sus.pulso_dia] ?? sus.pulso_dia}.
              </div>
              <div className="alta-phone">
                <span className="cc">+54 9</span>
                <input
                  autoFocus
                  placeholder="351 555 1234"
                  inputMode="numeric"
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                />
              </div>
              <div className="alta-actions">
                <button className="alta-btn" onClick={avanzar} disabled={!puedeAvanzar}>
                  Continuar <span className="k">↵</span>
                </button>
              </div>
            </section>
          )}

          {/* 8 · invitar equipo (opcional) */}
          {paso === 8 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Opcional · sumá a tu equipo</span>
              <div className="alta-q">
                ¿Le damos el <b>Asistente IA</b> a tu equipo?
              </div>
              <div className="alta-qs">
                Pasale el WhatsApp de tu community así entra a los mismos datos y recibe la lectura
                con vos. Le escribe él, nunca al revés.
              </div>
              <div className="alta-phone">
                <span className="cc">+54 9</span>
                <input
                  placeholder="WhatsApp de tu compañero"
                  inputMode="numeric"
                  value={teamWa}
                  onChange={(e) => setTeamWa(e.target.value)}
                />
              </div>
              {error && <div className="alta-err">{error}</div>}
              <div className="alta-actions">
                <button className="alta-btn" onClick={finalizar} disabled={enviando}>
                  {enviando ? 'Guardando…' : 'Sumar y terminar'} <span className="k">↵</span>
                </button>
                <button className="alta-btn ghost" onClick={finalizar} disabled={enviando}>
                  Lo hago después
                </button>
              </div>
            </section>
          )}

          {/* 9 · listo */}
          {esListo && (
            <section className="alta-step">
              <div className="alta-donetop">
                <div className="alta-seal">✓</div>
                <a
                  className="alta-dropfz"
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
              </div>
              <span className="alta-eyebrow">Alta completa</span>
              <div className="alta-q">Listo, {nombre.trim() || 'ya está'}. Tu tablero te espera.</div>
              <div className="alta-qs">
                NarraNoise® ya está armando tu línea de base con tus últimas semanas.
              </div>
              <div className="alta-agenda">
                <div className="alta-agtop">
                  <div>
                    <div className="k">Tu próxima lectura</div>
                    <div className="dd">
                      {fechaCortaPulso(sus.pulso_dia, sus.pulso_hora.slice(0, 5))} ·{' '}
                      {sus.pulso_hora.slice(0, 5)} <span className="tz">hora local</span>
                    </div>
                  </div>
                  <a
                    className="alta-agbtn"
                    href={enlaceCalendarioPulso(sus.pulso_dia, sus.pulso_hora.slice(0, 5), sus.tz)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Agendar ↗
                  </a>
                </div>
                <div className="alta-agnote">
                  <b>
                    Cada {DIA_LARGO[sus.pulso_dia] ?? sus.pulso_dia} a las {sus.pulso_hora.slice(0, 5)}
                  </b>{' '}
                  vas a tener tu tablero actualizado. Agendalo ahora en tu calendario.
                </div>
              </div>

              <div className="alta-famhead">
                <div className="alta-famtitle">
                  Ya sos parte de la familia
                  <img className="alta-famwm" src="/land/wm-a.svg" alt="narraglobal" />
                </div>
                <div className="alta-famsub">
                  Lisandro en las próximas horas te va a escribir para darte la bienvenida. Podés
                  también escribirle ahora mismo, en caso que tengas consultas o quieras hacer algún
                  comentario.
                </div>
              </div>
              <a className="alta-lischip" href={WA_LISANDRO} target="_blank" rel="noopener noreferrer">
                <span className="lav">
                  <img src="/land/lisandro.jpg" alt="Lisandro" />
                  <i />
                </span>
                <span className="lt">
                  <b>Escribile a Lisandro</b>
                  <s>Consultas · pedidos</s>
                </span>
                <span className="arr">→</span>
              </a>
              <div className="alta-actions">
                <button className="alta-btn" onClick={() => navigate('/suscripcion/' + sus.codigo)}>
                  Ir a mi tablero <span className="k">↵</span>
                </button>
              </div>
              <div className="alta-foot">narraglobal · datos NarraNoise®</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alta;
