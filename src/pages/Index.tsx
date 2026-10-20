import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { waLisandro } from '@/lib/enlaces';

/* Para quién habla la landing. El switch vive adentro del titular y cambia
   la bajada del hero, la rama que llega elegida a /activar, el nombre del
   competidor en la película del Narra ID y a quién se mide. */
type Modo = 'politica' | 'negocios';

const MODOS: Record<Modo, { sub: string; rival: string; alcance: string; canchas: [string, string, string] }> = {
  politica: {
    sub: 'Medimos políticos de escala ciudad, provincia y país.',
    rival: 'Actor 2',
    alcance: 'en tu ciudad, tu provincia y el país',
    canchas: ['Top ciudad', 'Top provincial', 'Top nacional'],
  },
  negocios: {
    sub: 'Medimos verticales de negocio a escala país, región y global.',
    rival: 'Empresa 2',
    alcance: 'en tu vertical, la región y el mundo',
    canchas: ['Top vertical', 'Top regional', 'Top global'],
  },
};

// Logos de clientes del carrusel (marquee)
interface ClientDef { file: string; alt: string; fallback: string; size?: 'md' | 'lg'; }
const CLIENTS: ClientDef[] = [
  { file: 'cli-google', alt: 'Google', fallback: 'Google', size: 'md' },
  { file: 'cli-hbomax', alt: 'HBO Max', fallback: 'HBO Max', size: 'lg' },
  { file: 'cli-bayer', alt: 'Bayer', fallback: 'Bayer', size: 'lg' },
  { file: 'cli-syngenta', alt: 'Syngenta', fallback: 'Syngenta' },
  { file: 'cli-amgen', alt: 'AMGEN', fallback: 'AMGEN' },
  { file: 'cli-loreal', alt: "L'Oréal", fallback: "L'Oréal" },
  { file: 'cli-bid', alt: 'BID', fallback: 'BID', size: 'md' },
  { file: 'cli-volkswagen', alt: 'Volkswagen', fallback: 'Volkswagen', size: 'lg' },
  { file: 'cli-accenture', alt: 'accenture', fallback: 'accenture' },
  { file: 'cli-river', alt: 'River Plate', fallback: 'River Plate', size: 'lg' },
];

// Logos de medios que publican nuestros datos
interface MediaDef { file: string; ext: string; alt: string; }
const MEDIA: MediaDef[] = [
  { file: 'med-cnn', ext: 'png', alt: 'CNN' },
  { file: 'med-forbes', ext: 'png', alt: 'Forbes' },
  { file: 'med-univision', ext: 'png', alt: 'Univisión' },
  { file: 'med-tve', ext: 'png', alt: 'TVE Internacional' },
  { file: 'med-infobae', ext: 'png', alt: 'Infobae' },
  { file: 'med-telefe', ext: 'jpg', alt: 'Telefe' },
  { file: 'med-clarin', ext: 'jpg', alt: 'Clarín' },
  { file: 'med-lanacion', ext: 'png', alt: 'La Nación' },
  { file: 'med-tn', ext: 'png', alt: 'Todo Noticias' },
];

// Temáticas seleccionables del workshop in-company
const TEMAS = [
  'Oratoria', 'Storytelling', 'Data storytelling', 'Presentaciones de alto impacto',
  'Pitch de ventas', 'Coaching ejecutivo', 'Comunicación interna', 'Contar el cambio',
  'Comunicación de crisis', 'Charla de Q',
];

// Los puntos de la gráfica "Tu calidad, semana a semana" (e1)
const CALIDAD: Array<[number, number]> = [
  [14, 84], [44, 78], [74, 82], [104, 70], [134, 62], [164, 44], [194, 56], [226, 48],
];

const MONO = 'IBM Plex Mono,monospace';

// onError: oculta la imagen y muestra el fallback de texto (siguiente hermano)
const imgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  img.style.display = 'none';
  const sib = img.nextElementSibling as HTMLElement | null;
  if (sib) sib.style.display = 'inline';
};
// onError: solo oculta la imagen
const imgHide = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const WaIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.215l-.999 3.648 3.965-.962zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
);

// En el hero azul van las versiones en blanco (public/land/cli-*-blanco.png)
const ClientLogo = ({ c, hidden }: { c: ClientDef; hidden?: boolean }) => (
  <span className="mq-it" {...(hidden ? { 'aria-hidden': true } : {})}>
    <img className={c.size} src={`/land/${c.file}-blanco.png`} alt={hidden ? '' : c.alt} onError={imgError} />
    <i className="lf">{c.fallback}</i>
  </span>
);

const MediaLogo = ({ m, hidden }: { m: MediaDef; hidden?: boolean }) => (
  <span className="mq-it" {...(hidden ? { 'aria-hidden': true } : {})}>
    <img src={`/land/${m.file}.${m.ext}`} alt={hidden ? '' : m.alt} onError={imgError} />
    <i className="lf">{m.alt}</i>
  </span>
);

/* La palabra con el corte de señal de la marca: cuatro tajadas de la misma
   palabra, dos corridas en horizontal. La de base queda transparente (no
   oculta) para que los lectores de pantalla la lean una sola vez. */
const Corte = ({ children }: { children: string }) => (
  <span className="cut">
    <span className="b">{children}</span>
    {['s1', 's2', 's3', 's4'].map((k) => (
      <span key={k} className={'s ' + k} aria-hidden="true"><i>{children}</i></span>
    ))}
  </span>
);

/* Las secciones con dirección propia: /narraid es la misma landing, parada en
   la placa del Narra ID. Sin «#» porque se tipea y se dicta (radio, TV). */
const SECCIONES: Record<string, string> = { '/narraid': 'tablero' };

/* Las tres canchas del mail del lunes, en la película: en cada una tu fila
   sube un puesto mientras se ve la ventana (rkSube / rkBaja en index.css). */
const RANKINGS: Array<{ arriba: number; total: number }> = [
  { arriba: 1, total: 12 },
  { arriba: 13, total: 30 },
  { arriba: 16, total: 30 },
];

const RankMini = ({ titulo, arriba, total, rival }: { titulo: string; arriba: number; total: number; rival: string }) => (
  <div className="c rk">
    <s>{titulo}</s>
    <ol className="rk-l">
      <li style={{ top: 0 }}><i>{arriba}º</i>{rival} {arriba}</li>
      <li className="baja" style={{ top: 13 }}><i><em className="a">{arriba + 1}º</em><em className="b">{arriba + 2}º</em></i>{rival} {arriba + 1}</li>
      <li className="yo sube" style={{ top: 26 }}><i><em className="a">{arriba + 2}º</em><em className="b">{arriba + 1}º</em></i>Vos</li>
    </ol>
    <u>Estás <span className="rk-n"><em className="a">{arriba + 2}º</em><em className="b">{arriba + 1}º</em></span> de {total} <span className="rk-up">▲1</span></u>
  </div>
);

const Index = () => {
  const { pathname } = useLocation();
  // al entrar por la dirección se llega directo; al tocar «Ver más», con scroll suave
  const primera = useRef(true);
  useEffect(() => {
    const id = SECCIONES[pathname.toLowerCase()];
    const el = id ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ behavior: primera.current ? 'auto' : 'smooth' });
    primera.current = false;
  }, [pathname]);

  const [modo, setModo] = useState<Modo>('politica');
  const [icSel, setIcSel] = useState<Set<string>>(new Set());
  const [otraOn, setOtraOn] = useState(false);
  const [otra, setOtra] = useState('');

  const copy = MODOS[modo];
  // Activar el Narra ID: /activar guarda el pedido y manda a pagar. La rama
  // del switch viaja en la URL para que llegue elegida.
  const activarHref = '/activar?rama=' + modo;

  const toggleTema = (t: string) =>
    setIcSel((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t); else n.add(t);
      return n;
    });

  const toggleOtra = () => {
    if (otraOn) setOtra('');
    setOtraOn((on) => !on);
  };

  // ===== in-company: armado del mensaje de WhatsApp =====
  const icHref = useMemo(() => {
    const temas = [...icSel];
    if (otra.trim()) temas.push(otra.trim());
    let m = 'Hola, quiero cotizar un workshop in-company con NarraGlobal.';
    if (temas.length) m += ' Temáticas: ' + temas.join(', ') + '.';
    return waLisandro(m);
  }, [icSel, otra]);
  // el botón cuenta las temáticas prendidas, «Otra…» incluida
  const nTemas = icSel.size + (otraOn ? 1 : 0);

  return (
    <>
      {/* ===================== HERO ===================== */}
      <div className="hero">
        <div className="grid-lines" />
        <div className="hero-in">
          <nav className="hnav">
            <img className="wm-img" src="/land/wm-blanco.svg" alt="narraglobal" />
            <div className="nav-links">
              <a href="#incompany">Workshops</a>
              <a href="/entrar" title="Acceso de clientes">Acceso clientes</a>
            </div>
            <Link className="nav-cta" to={activarHref}>Activá tu Narra ID</Link>
          </nav>

          <div className="hero-copy">
            <h1 className="hh">
              Dato <Corte>mejora</Corte> relato
              <br />
              en{' '}
              <span className="modo-seg" role="group" aria-label="Para quién">
                <button type="button" className={'modo-b' + (modo === 'politica' ? ' on' : '')} aria-pressed={modo === 'politica'} onClick={() => setModo('politica')}>Política</button>
                <button type="button" className={'modo-b' + (modo === 'negocios' ? ' on' : '')} aria-pressed={modo === 'negocios'} onClick={() => setModo('negocios')}>Negocios</button>
              </span>
            </h1>
            <p className="hsub">{copy.sub}</p>
          </div>
        </div>

        {/* clientes, en blanco sobre el azul; la leyenda va abajo de los logos
            para separarla del copy del hero */}
        <div className="hero-clients">
          <div className="mq">
            <div className="mq-track">
              {CLIENTS.map((c) => <ClientLogo key={c.file} c={c} />)}
              {CLIENTS.map((c) => <ClientLogo key={c.file + '-2'} c={c} hidden />)}
            </div>
          </div>
          <div className="cl-eyebrow">Mejoran sus narrativas con nosotros</div>
        </div>
      </div>

      {/* ===================== NARRA ID · la película ===================== */}
      <div className="shot-zone" id="tablero">
        <div className="shot-frame">
          <div className="film">
            <div className="film-txt">
              <div className="film-top">
                <span className="film-k">Narra ID · Suscripción mensual</span>
                <span className="film-precio">USD 1,000 <s>/ mes</s></span>
              </div>
              <h2 className="film-t">Mejorá tu narrativa cada semana y mirá qué le funciona a tu competencia</h2>
              {/* cada ítem se resalta cuando la película muestra su ventana */}
              <ul className="film-li">
                <li>Cómo te fue: medimos tus piezas de social media, semana a semana</li>
                <li>Alertas semanales sobre tu narrativa, tu influencia digital y tu competencia {copy.alcance}</li>
                <li>Un asistente IA en WhatsApp, a cualquier hora, para pensar tu próxima narrativa</li>
                <li>Call táctica mensual con Lisandro Bregant, director de narraglobal</li>
              </ul>
            </div>

            <div className="film-stage">
              <div className="pel" aria-hidden="true">
                {/* e1 · calidad semana a semana */}
                <div className="pel-e e1">
                  <div className="pel-win">
                    <span className="pel-tt">Tu calidad, semana a semana</span>
                    <div className="pel-graf">
                      <svg viewBox="0 0 240 110" aria-hidden="true">
                        <line x1="14" y1="30" x2="226" y2="30" stroke="#d9dbe0" strokeWidth="1" strokeDasharray="4 4" />
                        <polyline className="pg-line" pathLength={1} points={CALIDAD.map(([x, y]) => x + ',' + y).join(' ')} fill="none" stroke="#3E1CFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                        {CALIDAD.map(([x, y]) => (
                          <circle key={x} className="pg-dot" cx={x} cy={y} r="3" fill="#fff" stroke="#3E1CFF" strokeWidth="2" />
                        ))}
                        <text x="14" y="104" fontFamily={MONO} fontSize="7" letterSpacing="1" fill="#8b8f99">HACE 8 SEMANAS</text>
                        <text x="226" y="104" textAnchor="end" fontFamily={MONO} fontSize="7" letterSpacing="1" fill="#8b8f99">HOY · 57</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* e3 · el asistente por WhatsApp */}
                <div className="pel-e e3">
                  <div className="pel-win">
                    <span className="pel-tt">El mejor asistente IA en tu WhatsApp</span>
                    <div className="pel-chat">
                      <div className="b in">¿Por qué bajé esta semana?</div>
                      <div className="b out">Te pasó {copy.rival}: publicó la mitad que vos y movió 41 personas.</div>
                      <div className="b in">¿Qué repito?</div>
                      <div className="b out">El reel sin locución. Es la única de tus piezas que movió gente.</div>
                    </div>
                  </div>
                </div>

                {/* e2 · el mail del lunes: las alertas */}
                <div className="pel-e e2">
                  <div className="pel-win">
                    <span className="pel-tt">Cada lunes en tu mail</span>
                    <div className="pel-mail">
                      <div className="mh"><b>narraglobal</b><span>Lo que funcionó en tu semana · S1 SEPTIEMBRE (36/52)</span></div>
                      <div className="m6">
                        <div className="c"><s className="ok">▲ Funcionó</s><b>El reel del martes en la escuela técnica movió a 11 personas</b><u>Ver pieza →</u></div>
                        <div className="c"><s className="ok">▲ Funcionó</s><b>La recorrida por el barrio, sin guión, quedó 13 puntos arriba de tu promedio</b><u>Ver pieza →</u></div>
                        <div className="c azul"><s>Lo que hay que repetir</s><b>Repetí el reel sin locución con la recorrida que ya tenés grabada</b><u>En el asistente</u></div>
                        {RANKINGS.map((r, k) => (
                          <RankMini key={k} titulo={copy.canchas[k]} arriba={r.arriba} total={r.total} rival={copy.rival.replace(/ \d+$/, '')} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* e4 · la call mensual */}
                <div className="pel-e e4">
                  <div className="pel-win">
                    <span className="pel-tt">Una hora al mes para organizar tu narrativa</span>
                    <div className="pel-call">
                      <div className="cam">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="2.5" y="6" width="13" height="12" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M15.5 10.5 L21.5 7.5 V16.5 L15.5 13.5 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="who"><span className="av">TM</span><span className="av b">LB</span></div>
                      <div className="cf"><b>Lunes 28 · 15:00</b><s>Lo que no funcionó y qué sigue</s></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="film-pie solo">
              <Link className="film-cta" to={activarHref}>Activá tu Narra ID</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MEDIOS ===================== */}
      <section className="medios" id="medios">
        <div className="cl-eyebrow">En los medios</div>
        <div className="cl-title">Nuestros datos son publicados por los principales medios.</div>
        <div className="mq mq-media">
          <div className="mq-track">
            {MEDIA.map((m) => <MediaLogo key={m.file} m={m} />)}
            {MEDIA.map((m) => <MediaLogo key={m.file + '-2'} m={m} hidden />)}
          </div>
        </div>
        <Link className="med-link" to="/reporte">Leé el último análisis, sin cargo: Despedida Messi 2026 →</Link>
      </section>

      {/* ===================== IN-COMPANY ===================== */}
      <section className="shot-zone" id="incompany">
        <div className="shot-frame negra">
          <div className="film ic3">
            <div className="film-txt">
              <span className="film-k luz">Workshops in-company</span>
              <h2 className="film-t">Compartimos lo que sabemos</h2>
              <p className="film-d">Tenemos cápsulas listas para facilitar en tu compañía.</p>

              <div className="ic3-flujo">
                <div className="ic3-paso"><i>1</i>Seleccioná la temática</div>
                <div className="ic3-cuerpo">
                  <div className="ic-topics">
                    {TEMAS.map((t) => {
                      const on = icSel.has(t);
                      return (
                        <button key={t} className={'chip' + (on ? ' on' : '')} aria-pressed={on} type="button" onClick={() => toggleTema(t)}>
                          <span className="cx">{on ? '✓' : '+'}</span>{t}
                        </button>
                      );
                    })}
                    <button className={'chip chip-otra' + (otraOn ? ' on' : '')} aria-pressed={otraOn} type="button" onClick={toggleOtra}>
                      <span className="cx">{otraOn ? '✓' : '+'}</span>Otra…
                    </button>
                  </div>
                  {otraOn && (
                    <input
                      className="ic-otra-input"
                      id="ic-otra"
                      aria-label="Otra temática"
                      placeholder="Escribí tu temática"
                      value={otra}
                      onChange={(e) => setOtra(e.target.value)}
                      autoFocus
                    />
                  )}
                </div>
                <div className="ic3-paso accion">
                  <i>2</i>
                  <a href={icHref} id="wa-workshop" className={'film-cta' + (nTemas ? ' lista' : '')} target="_blank" rel="noopener noreferrer">
                    <WaIcon />
                    {nTemas ? 'Conversamos por WhatsApp · ' + nTemas : 'Conversamos por WhatsApp'}
                  </a>
                  <span className="ic3-nota">Te contestamos en el día</span>
                </div>
              </div>
            </div>
            <div className="ic2-foto">
              <img className="ic-img" src="/land/workshop.jpg" alt="Workshop in-company NarraGlobal" onError={imgHide} />
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <div className="site-foot">
        <img className="foot-img" src="/land/wm-a.svg" alt="narraglobal" />
        {/* el "Acceso clientes" del pie queda como segunda puerta al login */}
        <span className="r">Entrenado con el modelo NarraNoise® · narraglobal.com · <a href="/entrar" style={{ color: 'inherit' }}>Acceso clientes</a></span>
      </div>
    </>
  );
};

export default Index;
