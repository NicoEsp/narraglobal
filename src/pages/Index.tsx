import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { waLisandro } from '@/lib/enlaces';

/* Para quién habla la landing. El switch vive adentro del titular y cambia
   tres cosas: la bajada del hero, el tipo de demo que pide el CTA y el nombre
   del competidor en la película del Narra ID. */
type Modo = 'politica' | 'negocios';

const MODOS: Record<Modo, { sub: string; tipo: 'persona' | 'empresa'; rival: string }> = {
  politica: {
    sub: 'Medimos políticos de escala ciudad, provincia y país.',
    tipo: 'persona',
    rival: 'Actor 2',
  },
  negocios: {
    sub: 'Medimos verticales de negocio a escala país, región y global.',
    tipo: 'empresa',
    rival: 'Empresa 2',
  },
};

// Logos de clientes del carrusel (marquee)
interface ClientDef { file: string; alt: string; fallback: string; size?: 'md' | 'lg'; }
const CLIENTS: ClientDef[] = [
  { file: 'cli-google', alt: 'Google', fallback: 'Google', size: 'md' },
  { file: 'cli-hbomax', alt: 'HBO Max', fallback: 'HBO Max' },
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

const ClientLogo = ({ c, hidden }: { c: ClientDef; hidden?: boolean }) => (
  <span className="mq-it" {...(hidden ? { 'aria-hidden': true } : {})}>
    <img className={c.size} src={`/land/${c.file}.png`} alt={hidden ? '' : c.alt} onError={imgError} />
    <i className="lf">{c.fallback}</i>
  </span>
);

const MediaLogo = ({ m, hidden }: { m: MediaDef; hidden?: boolean }) => (
  <span className="mq-it" {...(hidden ? { 'aria-hidden': true } : {})}>
    <img src={`/land/${m.file}.${m.ext}`} alt={hidden ? '' : m.alt} onError={imgError} />
    <i className="lf">{m.alt}</i>
  </span>
);

const Index = () => {
  const [modo, setModo] = useState<Modo>('politica');
  const [icSel, setIcSel] = useState<Set<string>>(new Set());
  const [otraOn, setOtraOn] = useState(false);
  const [otra, setOtra] = useState('');

  const copy = MODOS[modo];
  const demoHref = '/posicion?tipo=' + copy.tipo;

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
              <a href="#tablero">Narra ID</a>
              <a href="#incompany">Workshops</a>
              <a href="/entrar" title="Acceso de clientes">Acceso clientes</a>
            </div>
            <Link className="nav-cta" to="/reporte">Reporte Narrativa Santa Fe 2026</Link>
          </nav>

          <div className="hero-copy">
            <h1 className="hh">
              Controlá tu narrativa en{' '}
              <span className="modo-seg" role="group" aria-label="Para quién">
                <button type="button" className={'modo-b' + (modo === 'politica' ? ' on' : '')} aria-pressed={modo === 'politica'} onClick={() => setModo('politica')}>Política</button>
                <button type="button" className={'modo-b' + (modo === 'negocios' ? ' on' : '')} aria-pressed={modo === 'negocios'} onClick={() => setModo('negocios')}>Negocios</button>
              </span>
            </h1>
            <p className="hsub">{copy.sub}</p>
            <div className="hctas hctas-sel">
              <Link className="sel-btn" to={demoHref}>Quiero mi demo</Link>
              <span className="cta-price">Te llega por WhatsApp en 48 hs sin cargo.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CLIENTES ===================== */}
      <div className="clients">
        <div className="cl-eyebrow">Nuestros clientes</div>
        <div className="cl-title">Líderes políticos y corporativos controlan su narrativa con nosotros.</div>
        <div className="mq">
          <div className="mq-track">
            {CLIENTS.map((c) => <ClientLogo key={c.file} c={c} />)}
            {CLIENTS.map((c) => <ClientLogo key={c.file + '-2'} c={c} hidden />)}
          </div>
        </div>
      </div>

      {/* ===================== NARRA ID · la película ===================== */}
      <div className="shot-zone" id="tablero">
        <div className="shot-frame">
          <div className="film">
            <div className="film-txt">
              <div className="film-top">
                <span className="film-k">Narra ID · Suscripción mensual</span>
                <span className="film-precio">USD 999 <s>/ mes</s></span>
              </div>
              <h2 className="film-t">Control total sobre tu narrativa y la de tus competidores</h2>
              {/* cada ítem se resalta cuando la película muestra su ventana */}
              <ul className="film-li">
                <li>Medimos tus piezas de social media</li>
                <li>Encontramos lo que funciona en vos y en la competencia</li>
                <li>Entrenamos tu Asistente IA para que edite tu narrativa en tiempo real</li>
                <li>Alertas semanales sobre tu narrativa y la competencia</li>
                <li>Call mensual de orden táctico</li>
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

                {/* e2 · techo y piso de la semana */}
                <div className="pel-e e2">
                  <div className="pel-win">
                    <span className="pel-tt"><span className="mk up">▲</span>El techo de la semana</span>
                    <div className="pel-graf techo">
                      <svg viewBox="0 0 240 120" aria-hidden="true">
                        <polyline points="14,86 44,80 74,84 104,72 134,66 164,58 194,64 222,56" fill="none" stroke="#111319" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="222" y1="56" x2="222" y2="22" stroke="#00C281" strokeWidth="2.4" strokeLinecap="round" />
                        <line x1="222" y1="56" x2="222" y2="98" stroke="#FF3D7A" strokeWidth="2.4" strokeLinecap="round" />
                        <circle className="pg-techo" cx="222" cy="22" r="5.2" fill="#00C281" />
                        <text x="212" y="25" textAnchor="end" fontFamily={MONO} fontSize="7.5" letterSpacing="1" fill="#00875a" fontWeight="600">REEL A CÁMARA · 48</text>
                        <circle cx="222" cy="98" r="5.2" fill="#FF3D7A" />
                        <text x="212" y="101" textAnchor="end" fontFamily={MONO} fontSize="7.5" letterSpacing="1" fill="#c9265b">TEXTO LEÍDO · 21</text>
                        <circle cx="222" cy="56" r="3.6" fill="#3E1CFF" />
                        <text x="14" y="114" fontFamily={MONO} fontSize="7" letterSpacing="1" fill="#8b8f99">HACE 8 SEMANAS</text>
                        <text x="226" y="114" textAnchor="end" fontFamily={MONO} fontSize="7" letterSpacing="1" fill="#8b8f99">HOY · 35</text>
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

                {/* e4 · el mail del lunes */}
                <div className="pel-e e4">
                  <div className="pel-win">
                    <span className="pel-tt">Cada lunes en tu mail</span>
                    <div className="pel-mail">
                      <div className="mh"><b>narraglobal</b><span>Lo que funcionó en tu semana · S1 SEPTIEMBRE (36/52)</span></div>
                      <div className="m6">
                        <div className="c"><s className="ok">▲ Funcionó</s><b>El reel del martes en la escuela técnica movió a 11 personas</b><u>Ver pieza →</u></div>
                        <div className="c"><s className="ok">▲ Funcionó</s><b>La recorrida por el barrio, sin guión, quedó 13 puntos arriba de tu promedio</b><u>Ver pieza →</u></div>
                        <div className="c azul"><s>Lo que hay que repetir</s><b>Repetí el reel sin locución con la recorrida que ya tenés grabada</b><u>En el asistente</u></div>
                        <div className="c"><s>Top ciudad · Rosario</s><b>«Respeto, una palabra. Simple, concreta y elemental.»</b><u>Estás 2 de 27</u></div>
                        <div className="c"><s>Top provincial</s><b>«Qué está pasando abajo del Boulevard Pellegrini»</b><u>Estás 14 de 30</u></div>
                        <div className="c"><s>Top nacional</s><b>«Gracias por no haber bajado los brazos nunca.»</b><u>Ver tabla</u></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* e5 · la call mensual */}
                <div className="pel-e e5">
                  <div className="pel-win">
                    <span className="pel-tt">Una hora de orden táctico</span>
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
              <Link className="film-cta" to={demoHref}>Quiero mi demo</Link>
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
