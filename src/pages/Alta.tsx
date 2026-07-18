import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useSesion } from '@/hooks/useAcceso';
import { fechaCortaPulso, enlaceCalendarioPulso } from '@/lib/pulso';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import '@/styles/acceso.css';
import '@/styles/alta.css';

type Suscripcion = Tables<'suscripciones'>;

const WA_NARRA = 'https://wa.me/5493417545069';
const PAISES = [
  'Argentina', 'México', 'Chile', 'Uruguay', 'Colombia', 'España', 'Estados Unidos', 'Otro',
];
const REDES = ['X', 'Instagram', 'TikTok', 'Otra'] as const;
type Red = (typeof REDES)[number];

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

  // campos del alta
  const [nombre, setNombre] = useState('');
  const [paisDe, setPaisDe] = useState('Argentina');
  const [paisPara, setPaisPara] = useState('Argentina');
  const [categoria, setCategoria] = useState('');
  const [categoriaOtro, setCategoriaOtro] = useState('');
  const [redes, setRedes] = useState<Record<Red, { on: boolean; usuario: string }>>({
    X: { on: false, usuario: '' },
    Instagram: { on: false, usuario: '' },
    TikTok: { on: false, usuario: '' },
    Otra: { on: false, usuario: '' },
  });
  const [competidores, setCompetidores] = useState<string[]>([]);
  const [nuevoComp, setNuevoComp] = useState('');
  const [conEquipo, setConEquipo] = useState(false);
  const [equipoN, setEquipoN] = useState(1);
  const [wa, setWa] = useState('');
  const [teamWa, setTeamWa] = useState('');

  useEffect(() => {
    if (!sesion || !codigo) return;
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
  }, [sesion, codigo]);

  const esPro = sus?.plan === 'pro';
  const catLbl = categoria === 'Otro' ? categoriaOtro.trim() || 'tu sector' : categoria || 'tu categoría';

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

  const sumarComp = () => {
    const v = nuevoComp.trim();
    if (!v || competidores.length >= 5) return;
    setCompetidores((c) => [...c, v]);
    setNuevoComp('');
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
      competidores: esPro ? competidores : [],
      equipo_tamano: conEquipo ? equipoN : 0,
      equipo_telefono: conEquipo && soloDigitos(teamWa).length >= 6 ? '+549' + soloDigitos(teamWa) : null,
    };
    const { error: err } = await supabase.rpc('completar_alta', { p_codigo: codigo, p_datos: datos });
    setEnviando(false);
    if (err) {
      setError('No pudimos guardar tu alta (' + err.message + '). Probá de nuevo en un minuto.');
      return;
    }
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
          detalle="Ingresá el email con el que te suscribiste y te mandamos un link para completar tu alta. Sin contraseñas."
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

  // Alta ya hecha (o pausada): el tablero decide qué mostrar.
  if (sus.estado !== 'borrador') {
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
              No leemos ni guardamos tus conversaciones — solo lo <b>público</b>
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
                        placeholder={r === 'Otra' ? '@usuario o link' : '@usuario'}
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

          {/* 5 · benchmark / competidores */}
          {paso === 5 && (
            <section className="alta-step">
              <button className="alta-back" onClick={atras}>‹ atrás</button>
              <span className="alta-eyebrow">Paso 5 de 7</span>
              {!esPro ? (
                <>
                  <div className="alta-q">Con quién te vamos a comparar.</div>
                  <div className="alta-qs">
                    El promedio de calidad narrativa de <b>tu sector</b> — {catLbl} de {paisPara}. Una
                    sola línea, tu vara.
                  </div>
                  <div className="alta-viz">
                    <div className="alta-vizhd">
                      <span className="k">Tu calidad narrativa · 8 semanas</span>
                      <span className="alta-tagx">ejemplo</span>
                    </div>
                    <svg className="alta-spark" viewBox="0 0 300 96" preserveAspectRatio="none">
                      <line x1="0" y1="35.3" x2="300" y2="35.3" stroke="#b7bac2" strokeWidth="1.6" strokeDasharray="4 4" />
                      <polyline
                        points="6,73.3 46.6,60.7 87.1,67 127.7,48 168.3,54.3 208.9,41.7 249.4,29 290,22.7"
                        fill="none" stroke="#3E1CFF" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"
                      />
                      <circle cx="290" cy="22.7" r="4.2" fill="#3E1CFF" />
                    </svg>
                    <div className="alta-vizleg">
                      <span><i className="li" />Vos · <b>56</b></span>
                      <span><i className="li gray" />Promedio del sector · <b>54</b></span>
                    </div>
                  </div>
                  <div className="alta-coupon" role="note">
                    <div className="cl">
                      <div className="k">Mejorá a PRO · −25% los primeros 2 meses</div>
                      <div className="ct">
                        Con PRO elegís y monitoreás hasta <b>cinco competidores</b> y conocés su calidad
                        narrativa semana a semana: cómo diferenciarte y qué buenas prácticas copiar.
                      </div>
                      <div className="cterms">
                        Código promocional exclusivo por <b>24 h</b> · sólo para altas nuevas.
                      </div>
                    </div>
                    <div className="cr">
                      <div className="off">−25%</div>
                      <div className="code">PRO2</div>
                      <div className="alta-cophint">contale a narrachat</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="alta-q">¿A quién te gustaría mirar de cerca?</div>
                  <div className="alta-qs">
                    Con PRO elegís hasta <b>5 personas o marcas</b> para ver su calidad narrativa
                    semanal y recibir tips prácticos para achicar o ampliar la distancia con ellas.
                  </div>
                  {competidores.length > 0 && (
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
                        </div>
                      ))}
                    </div>
                  )}
                  {competidores.length < 5 && (
                    <div className="alta-field" style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
                      <input
                        className="alta-tx"
                        style={{ fontSize: 18 }}
                        placeholder="Nombre de una persona o marca"
                        value={nuevoComp}
                        onChange={(e) => setNuevoComp(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            sumarComp();
                          }
                        }}
                      />
                      <button
                        className="alta-btn"
                        style={{ padding: '10px 18px' }}
                        onClick={sumarComp}
                        disabled={nuevoComp.trim() === ''}
                      >
                        Sumar
                      </button>
                    </div>
                  )}
                </>
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
              <div className="alta-qs">
                Con esto damos de alta a <b>narrachat</b>, tu asistente por WhatsApp: entrás a tus
                datos fácil, le pedís ideas y análisis, y tu equipo también. Es también por donde te
                avisamos cada semana.
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
              <div className="alta-q">¿Le damos narrachat a tu equipo?</div>
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
              <div className="alta-seal">✓</div>
              <span className="alta-eyebrow">Alta completa</span>
              <div className="alta-q">Listo, {nombre.trim() || 'ya está'}. Tu tablero te espera.</div>
              <div className="alta-qs">
                NarraNoise® ya está armando tu línea de base con tus últimas semanas.
              </div>
              <div className="alta-agenda">
                <div className="alta-agtop">
                  <div>
                    <div className="k">Tu primera lectura</div>
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
                  Te avisamos por WhatsApp cuando tu primera entrega esté publicada. A partir de ahí,
                  una lectura nueva cada semana.
                </div>
              </div>
              <a className="alta-nchat" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
                <div className="t">
                  <b>Conocé a narrachat, tu asistente por WhatsApp</b>
                  <s>Mientras esperás tu tablero, hablale y pedile ideas.</s>
                </div>
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
