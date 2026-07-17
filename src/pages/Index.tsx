import { useEffect, useMemo, useRef, useState } from 'react';

// WhatsApp (código país + número, sin + ni espacios)
const WA = '5491130731011';

// Suscripción → por ahora WhatsApp. Reemplazar por la URL de checkout cuando esté.
const CHECKOUT = 'https://wa.me/5491130731011?text=Hola%2C%20quiero%20comenzar%20mi%20suscripci%C3%B3n%20al%20tablero%20narraglobal.';

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

const Index = () => {
  const shotWrapRef = useRef<HTMLDivElement>(null);
  const shotRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [icSel, setIcSel] = useState<Set<string>>(new Set());
  const [otraOn, setOtraOn] = useState(false);
  const [otra, setOtra] = useState('');

  // ===== escala de la captura del tablero (se comporta como una foto) =====
  useEffect(() => {
    const wrap = shotWrapRef.current;
    const shot = shotRef.current;
    if (!wrap || !shot) return;
    const fit = () => {
      const s = Math.min(1, wrap.clientWidth / 1060);
      shot.style.transform = 'scale(' + s + ')';
      wrap.style.height = shot.offsetHeight * s + 'px';
    };
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    const t = setTimeout(fit, 350);
    fit();
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('load', fit);
      clearTimeout(t);
    };
  }, []);

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
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(m);
  }, [icSel, otra]);

  const scrollCarousel = (dx: number) =>
    carouselRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  return (
    <>
      {/* ===================== HERO ===================== */}
      <div className="hero">
        <div className="grid-lines" />
        <div className="hero-in">
          <nav className="hnav">
            <img className="wm-img" src="/land/wm-a.svg" alt="narraglobal" />
            <div className="nav-links">
              <a href="#tablero">El tablero</a>
              <a href="#reportes">Reportes</a>
            </div>
            <a className="nav-cta" href="#incompany">Workshops in-company</a>
          </nav>

          <div className="hero-copy">
            <div className="kick">Suscripción mensual · Datos NarraNoise®</div>
            <h1 className="hh">El sistema de control de tu narrativa pública</h1>
            <p className="hsub">Cada lunes, un tablero actualizado con datos NarraNoise®: qué mensajes llegaron, cómo rendís frente a tu competencia y qué hacen tus públicos. Sin jerga, con un plan de acción para la semana.</p>
            <div className="hctas">
              {/* CTA: reemplazar por la URL de checkout cuando esté */}
              <a className="btn-p" href={CHECKOUT} target="_blank" rel="noopener">Quiero comenzar mi suscripción</a>
              <span className="cta-price">Desde<b>USD 299/mes</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== FOTO DEL DASHBOARD ===================== */}
      <div className="shot-zone">
        <div className="shot-frame">
          <div className="shotwrap" ref={shotWrapRef}>
            <div className="shot" ref={shotRef}>
              <div className="sh-top">
                <img className="shwm-img" src="/land/wm-a.svg" alt="narraglobal" />
                <span className="sh-ann"><i className="dt" /><span className="tx"><b>Suscripción Pro</b> <em>· activa</em></span><span className="chip">Pausa estratégica · incluida</span></span>
                <span className="sh-who"><b>Hola, tu equipo</b><span className="sh-ava">TM</span></span>
              </div>

              <div className="sh-tabs">
                <span className="t on"><em>01</em> Tu semana</span>
                <span className="t"><em>02</em> Pausa estratégica <span className="prot">Pro</span></span>
                <span className="t"><em>03</em> Sprints · Llamados <span className="prot">Pro</span></span>
              </div>

              <div className="sh-hero">
                <div>
                  <div className="sh-h1"><span className="dot" />Qué cambió<br />esta semana</div>
                  <div className="sh-upd">Actualizado · lunes 1 de junio</div>
                  <div className="sh-mini">
                    <div className="mrow2"><span className="at">Los mensajes que llegaron <span className="nuevo">Nuevo</span></span><span className="col">▸</span></div>
                    <div className="mrow2"><span className="at">Calidad de tus mensajes</span><span className="col">▸</span></div>
                    <div className="mrow2"><span className="at">Conclusiones y acciones para el equipo</span><span className="col">▸</span></div>
                    <div className="mrow2"><span className="at">Comportamiento de tu competencia <span className="prot">Pro</span></span><span className="col">▸</span></div>
                    <div className="mrow2"><span className="at">Comportamiento de tus públicos <span className="prot">Pro</span><span className="sched">Mensual · 4 ago</span></span><span className="col">▸</span></div>
                    <div className="mrow2"><span className="at">Mesa chica de estrategia <span className="prot">Pro</span><span className="sched">Quincenal · 21 jul</span></span><span className="col">▸</span></div>
                  </div>
                </div>
                <div className="cbg">
                  <div className="cb">
                    <span className="t">Mensajes que llegaron <span className="nuevo">Nuevo</span></span>
                    <span className="v">2 <u>de 5</u> <span className="up">▲ +1</span></span>
                    <span className="s">De los 3 que no llegaron, 2 fallaron por lo mismo: sin término para repetir.</span>
                  </div>
                  <div className="cb">
                    <span className="t">Tu calidad</span>
                    <span className="v">52 <span className="up">▲ +2</span></span>
                    <span className="s">Segunda semana en alza. El promedio de tus competidores está en <b>56</b>.</span>
                  </div>
                  <div className="cb good">
                    <span className="t">El techo de la semana</span>
                    <span className="v">67%</span>
                    <span className="s">La pieza a cámara: tu cara, un solo tema y un dato que fuiste a buscar.</span>
                  </div>
                  <div className="cb bad">
                    <span className="t">El piso de la semana</span>
                    <span className="v">41%</span>
                    <span className="s">La pieza institucional: un informe sin conflicto ni rostro.</span>
                  </div>
                  <div className="cb">
                    <span className="t">Tu puesto entre competidores <span className="nuevo" style={{ background: 'var(--ink)', borderColor: 'var(--ink)', color: '#fff' }}>Pro</span></span>
                    <span className="vf">Superaste al Actor 1.</span>
                    <span className="cbviz">
                      <svg viewBox="0 0 220 52" aria-hidden="true">
                        <polyline points="8,16 38,18 68,15 98,19 128,18 158,20 188,19 212,20" fill="none" stroke="#b9bdc7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="8,42 38,40 68,41 98,36 128,32 158,27 188,23 212,18" fill="none" stroke="#3E1CFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="212" cy="20" r="2.2" fill="#b9bdc7" />
                        <circle cx="212" cy="18" r="2.6" fill="#3E1CFF" />
                      </svg>
                      <span className="lg"><span className="you">— Vos · 53 +2</span><span>— Actor 1 · 53 −1</span></span>
                      <span className="ax">Calidad narrativa · últimas 8 semanas</span>
                    </span>
                    <span className="s">La pasaste por décimas de calidad, y publica el doble de piezas que vos. Quedás <b>3º de 6</b>.</span>
                  </div>
                  <div className="cb blue">
                    <span className="t">La conclusión de la semana</span>
                    <span className="vf">Volviste a tu tema y volvió a funcionar.</span>
                    <span className="s">El techo repite la receta de tu mejor mes: un solo tema, tu cara y un dato propio. Falta sostener el término toda la semana.</span>
                  </div>
                </div>
              </div>

              <div className="sh-floor">
                <span className="seal"><svg viewBox="0 0 120 120" width="17" height="17" aria-hidden="true"><path d="M24.0,69.6 A36.0,36.0 0 0 1 96.0,69.6 L81.0,69.6 A21.0,21.0 0 0 0 39.0,69.6 Z" fill="#111319" /><rect x="24.0" y="69.1" width="15.0" height="34.1" fill="#111319" /><rect x="81.0" y="69.1" width="15.0" height="34.1" fill="#111319" /></svg></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== CLIENTES ===================== */}
      <div className="clients">
        <div className="cl-eyebrow">Miden su narrativa con nosotros</div>
        <div className="cl-title">Líderes corporativos y políticos confían en nuestras métricas.</div>
        <div className="mq">
          <div className="mq-track">
            {CLIENTS.map((c) => <ClientLogo key={c.file} c={c} />)}
            {CLIENTS.map((c) => <ClientLogo key={c.file + '-2'} c={c} hidden />)}
          </div>
        </div>
      </div>

      {/* ===================== EL TABLERO ===================== */}
      <section className="feat" id="tablero">
        <div className="ft-head">
          <div className="ft-kick">Incluido en tu suscripción mensual</div>
          <h2 className="ft-title">Un tablero hecho para decidir</h2>
          <p className="ft-lede">Cuatro lecturas que se actualizan cada lunes con el modelo NarraNoise®. Cada una responde con datos una pregunta que hasta ahora se contestaba con intuición.</p>
        </div>

        <div className="ft-grid">
          {/* 01 · RESUMEN SEMANAL */}
          <div className="fcell">
            <div className="fviz">
              <div className="a-sem">
                <div className="swp"><div className="swp-tr">
                  <div className="sw"><span className="k">Mensajes que llegaron</span><span className="n">2 <small>de 5</small></span><span className="dl">▲ +1</span></div>
                  <div className="sw"><span className="k">Tu calidad</span><span className="n">52 <small>/100</small></span><span className="dl">▲ +2</span></div>
                  <div className="sw mint"><span className="k">El techo de la semana</span><span className="n">67%</span><span className="dl">Para replicar</span></div>
                  <div className="sw rosa"><span className="k">El piso de la semana</span><span className="n">41%</span><span className="dl" style={{ background: '#fbdde7', color: 'var(--pink-ink)' }}>Para evitar</span></div>
                  <div className="sw"><span className="k">Tu puesto</span><span className="n">3º <small>de 6</small></span><span className="dl" style={{ background: 'var(--ink)', color: '#fff' }}>Pro</span></div>
                  <div className="sw azul"><span className="k">La conclusión</span><span className="nf">Volviste a tu tema y volvió a funcionar.</span></div>
                  <div className="sw"><span className="k">Mensajes que llegaron</span><span className="n">2 <small>de 5</small></span><span className="dl">▲ +1</span></div>
                </div></div>
                <div className="swp-cap">Tu lunes, en 10 segundos</div>
              </div>
            </div>
            <div className="ftxt">
              <div className="f-kick">01 · Cada lunes</div>
              <div className="f-t">Resumen semanal</div>
              <p className="f-d">Cada lunes, un panel actualizado con lo que cambió: tu calidad narrativa, el techo y el piso de la semana, y la conclusión para accionar.</p>
            </div>
          </div>

          {/* 02 · LLEGADA Y CALIDAD DE MENSAJES */}
          <div className="fcell">
            <div className="fviz">
              <div className="a-msg">
                <svg viewBox="0 0 240 132" aria-hidden="true">
                  <g className="gA">
                    <text className="pop hA" x="12" y="14" fontFamily="IBM Plex Mono,monospace" fontSize="7" letterSpacing="1" fill="#969aa4">IMPACTOS 2 · DISUELTOS 3</text>
                    <g fill="none" stroke="#d9dbe0" strokeWidth="1.1" strokeDasharray="3 4" opacity=".55">
                      <path d="M48 106 Q120 8 196 26" />
                      <path d="M48 106 Q130 30 208 62" />
                      <path d="M48 106 Q100 40 128 58" />
                      <path d="M48 106 Q110 60 148 84" />
                      <path d="M48 106 Q90 70 116 92" />
                    </g>
                    <rect x="34" y="96" width="28" height="26" rx="4" fill="#111319" />
                    <text x="48" y="114" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="800" fill="#FF3D7A">5</text>
                    <text x="48" y="130" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="6" letterSpacing="1.2" fill="#969aa4">EMISOR</text>
                    <circle className="msl m1" r="2.8" fill="#3E1CFF" />
                    <circle className="msl m2" r="2.8" fill="#3E1CFF" />
                    <circle className="msl m3" r="2.8" fill="#3E1CFF" />
                    <circle className="msl m4" r="2.8" fill="#3E1CFF" />
                    <circle className="msl m5" r="2.8" fill="#3E1CFF" />
                    <g className="pop i1"><circle cx="196" cy="26" r="3.4" fill="#3E1CFF" /><circle cx="196" cy="26" r="7.5" fill="none" stroke="#3E1CFF" strokeWidth="1.4" opacity=".35" /></g>
                    <g className="pop i2"><circle cx="208" cy="62" r="3.4" fill="#3E1CFF" /><circle cx="208" cy="62" r="7.5" fill="none" stroke="#3E1CFF" strokeWidth="1.4" opacity=".35" /></g>
                    <text className="pop x3" x="128" y="61" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="800" fill="#e11d5c">✕</text>
                    <text className="pop x4" x="148" y="87" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="800" fill="#e11d5c">✕</text>
                    <text className="pop x5" x="116" y="95" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="9" fontWeight="800" fill="#e11d5c">✕</text>
                  </g>
                  <g className="gB">
                    <line x1="24" y1="44" x2="216" y2="44" stroke="#c9ccd4" strokeWidth="1.5" strokeDasharray="5 5" />
                    <text x="216" y="35" textAnchor="end" fontFamily="IBM Plex Mono,monospace" fontSize="6.5" letterSpacing="1" fill="#969aa4">PROMEDIO COMPETIDORES · 56</text>
                    <polyline className="qdraw" pathLength="1" points="24,88 51,84 78,86 105,78 132,72 159,64 186,58 216,50" fill="none" stroke="#3E1CFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                    <g className="qpop"><circle cx="216" cy="50" r="3.4" fill="#3E1CFF" /><text x="24" y="76" textAnchor="start" fontFamily="IBM Plex Mono,monospace" fontSize="7" letterSpacing="1" fill="#3E1CFF">TU CALIDAD · 52</text></g>
                    <text x="120" y="126" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="6.5" letterSpacing="1.2" fill="#b3b7c0">CALIDAD NARRATIVA · ÚLTIMAS 8 SEMANAS</text>
                  </g>
                </svg>
              </div>
            </div>
            <div className="ftxt">
              <div className="f-kick">02 · Tus mensajes</div>
              <div className="f-t">Llegada y calidad de mensajes</div>
              <p className="f-d">El dato de si tus mensajes llegaron o no. Y cómo retrabajarlos para corregir la llegada a tus públicos.</p>
            </div>
          </div>

          {/* 03 · ANÁLISIS DE COMPETENCIA */}
          <div className="fcell">
            <div className="fviz">
              <div className="a-comp">
                <div className="leg"><span className="you"><i />Vos · 53</span><span><i />Actor 1 · 53</span></div>
                <svg viewBox="0 0 240 120" aria-hidden="true">
                  <path className="dline" pathLength="1" d="M12 38 L48 40 L84 37 L120 41 L156 40 L192 42 L228 41" stroke="#b9bdc7" strokeWidth="2.5" />
                  <path className="dline vos" pathLength="1" d="M12 86 L48 82 L84 84 L120 74 L156 64 L192 52 L228 36" stroke="#3E1CFF" strokeWidth="3" />
                  <circle className="dend" cx="228" cy="41" r="3" fill="#b9bdc7" />
                  <circle className="dend" cx="228" cy="36" r="3.5" fill="#3E1CFF" />
                  <text className="gapl" x="222" y="20" fontFamily="IBM Plex Mono,monospace" fontSize="8" letterSpacing="1" fill="#969aa4" textAnchor="end">3º DE 6</text>
                </svg>
              </div>
            </div>
            <div className="ftxt">
              <div className="f-kick"><span>03 · Tu competencia</span><span className="pro-chip">PRO</span></div>
              <div className="f-t">Análisis de competencia</div>
              <p className="f-d">Tu performance semanal versus la de los actores que elijas, y tu puesto entre competidores. Para aprender de la narrativa que otros están instalando con éxito.</p>
            </div>
          </div>

          {/* 04 · COMPORTAMIENTO DE TUS PÚBLICOS */}
          <div className="fcell">
            <div className="fviz">
              <div className="a-pub">
                <svg viewBox="0 0 300 130" aria-hidden="true">
                  <text x="24" y="10" fontFamily="IBM Plex Mono,monospace" fontSize="8" letterSpacing="1.2" fill="#969aa4">HACE UN MES</text>
                  <text x="276" y="10" fontFamily="IBM Plex Mono,monospace" fontSize="8" letterSpacing="1.2" fill="#969aa4" textAnchor="end">HOY</text>
                  <path d="M30 41 C120 41 180 32 270 32" fill="none" stroke="rgba(62,28,255,.13)" strokeWidth="21" />
                  <path d="M30 75 C150 75 150 73 270 73" fill="none" stroke="#e9eaee" strokeWidth="24" />
                  <path d="M30 107 C150 107 180 109 270 109" fill="none" stroke="rgba(255,61,122,.10)" strokeWidth="12" />
                  <path className="flow-dots" d="M30 41 C120 41 180 32 270 32" stroke="#3E1CFF" strokeWidth="3.2" />
                  <path className="flow-dots" d="M30 75 C150 75 150 73 270 73" stroke="#b9bdc7" strokeWidth="3" />
                  <path className="flow-dots" d="M30 107 C150 107 180 109 270 109" stroke="#FF3D7A" strokeWidth="2.6" />
                  <rect x="24" y="30" width="6" height="22" rx="3" fill="#3E1CFF" />
                  <rect x="24" y="60" width="6" height="30" rx="3" fill="#c9ccd4" />
                  <rect x="24" y="96" width="6" height="22" rx="3" fill="#FF3D7A" />
                  <rect x="270" y="14" width="6" height="36" rx="3" fill="#3E1CFF" />
                  <rect x="270" y="60" width="6" height="26" rx="3" fill="#c9ccd4" />
                  <rect x="270" y="104" width="6" height="10" rx="3" fill="#FF3D7A" />
                </svg>
                <div className="pub-leg"><span className="a">Suben de intensidad</span><span className="b">Se quedan</span><span className="c">Se apagan</span></div>
              </div>
            </div>
            <div className="ftxt">
              <div className="f-kick"><span>04 · Tus públicos</span><span className="pro-chip">PRO</span></div>
              <div className="f-t">Comportamiento de tus públicos</div>
              <p className="f-d">Conocé qué tipos de públicos interactúan con vos y qué comportamientos se pueden predecir a partir del patrón de conducta que medimos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA · COMENZAR ===================== */}
      <section className="midcta">
        <div className="mc-in">
          <div>
            <div className="mc-t">Tu primer tablero llega el próximo lunes.</div>
            <div className="mc-s">Suscripción mensual · desde USD 299/mes</div>
          </div>
          {/* CTA: reemplazar por la URL de checkout cuando esté */}
          <a className="mc-btn" href={CHECKOUT} target="_blank" rel="noopener">Comenzar mi suscripción</a>
        </div>
      </section>

      {/* ===================== REPORTES ===================== */}
      <section className="reportes" id="reportes">
        <div className="rp-head">
          <div className="rp-eyebrow">Reportes publicados</div>
          <div className="rp-title">Lo último, medido y publicado.</div>
          <p className="rp-lede">Cada mes publicamos un nuevo reporte NarraNoise®. Mirá las portadas y leé el análisis completo en Substack.</p>
        </div>

        <div className="cintawrap">
          <div className="cfade l" /><div className="cfade r" />
          <button className="cbtn l" aria-label="Anterior" onClick={() => scrollCarousel(-360)}>‹</button>
          <button className="cbtn r" aria-label="Siguiente" onClick={() => scrollCarousel(360)}>›</button>
          <div className="rp-carousel" ref={carouselRef}>
            <a className="rp-cover" href="https://narraglobal.substack.com/p/relato-desorganizado-y-50-de-ruido" target="_blank" rel="noopener">
              <div className="cover-card">
                <img className="cc-bg" src="/land/rep-relato.jpg" alt="" onError={imgHide} />
                <div className="gb" />
                <div className="cc-shade" />
                <div className="cc-top"><img className="ccwm-img" src="/land/wm-b.svg" alt="narraglobal" /><span className="cc-tag">Reporte · Política</span></div>
                <div className="cc-bottom">
                  <span className="cc-dato">50% ruido</span>
                  <div className="cc-title">Relato desorganizado en el relanzamiento del PRO.</div>
                  <div className="cc-foot"><span>Abr 2026 · NarraNoise®</span><span className="cc-read">Leer →</span></div>
                </div>
              </div>
            </a>
            <a className="rp-cover" href="https://narraglobal.substack.com/p/gebel-bajo-un-73-su-cuota-dios-en" target="_blank" rel="noopener">
              <div className="cover-card">
                <img className="cc-bg" src="/land/rep-gebel.jpg" alt="" onError={imgHide} />
                <div className="gb" />
                <div className="cc-shade" />
                <div className="cc-top"><img className="ccwm-img" src="/land/wm-b.svg" alt="narraglobal" /><span className="cc-tag">Reporte · Política</span></div>
                <div className="cc-bottom">
                  <span className="cc-dato">−73%</span>
                  <div className="cc-title">Gebel bajó su 'cuota Dios' al entrar en política.</div>
                  <div className="cc-foot"><span>May 2026 · NarraNoise®</span><span className="cc-read">Leer →</span></div>
                </div>
              </div>
            </a>
            <a className="rp-cover" href="https://x.com/lisandrobregant/status/1733928007423717588" target="_blank" rel="noopener">
              <div className="cover-card cover-x">
                <img className="cc-bg" src="/land/rep-milei.jpg" alt="" onError={imgHide} />
                <div className="cc-shade" />
                <svg className="cc-xmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <div className="cc-top"><img className="ccwm-img" src="/land/wm-b.svg" alt="narraglobal" /><span className="cc-tag">Análisis · X</span></div>
                <div className="cc-bottom">
                  <span className="cc-dato2">Hilo en X</span>
                  <div className="cc-title">La narrativa de cirujano en el discurso de asunción de Milei.</div>
                  <div className="cc-foot"><span>Dic 2023 · Política</span><span className="cc-read">Ver hilo →</span></div>
                </div>
              </div>
            </a>
            <a className="rp-cover" href="https://narraglobal.substack.com/subscribe" target="_blank" rel="noopener">
              <div className="cover-card cover-next"><div className="gb" />
                <div className="cc-top"><img className="ccwm-img" src="/land/wm-b.svg" alt="narraglobal" /><span className="cc-tag">Próximo</span></div>
                <div className="cc-bottom">
                  <span className="cc-dato2">Próximo análisis</span>
                  <div className="cc-title">Suscribite y recibilo en tu correo.</div>
                  <div className="cc-foot"><span>NarraNoise®</span><span className="cc-read">Suscribirme →</span></div>
                </div>
              </div>
            </a>
            <a className="rp-cover" href="https://narraglobal.substack.com" target="_blank" rel="noopener">
              <div className="cover-card" style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'none' }}>
                <div className="cc-top"><img className="ccwm-img" src="/land/wm-b.svg" alt="narraglobal" /><span className="cc-tag" style={{ color: 'var(--mute)' }}>Archivo</span></div>
                <div className="cc-bottom">
                  <span className="cc-dato" style={{ background: '#fff', color: 'var(--blue)', border: '1px solid #d6d2ff', fontSize: '22px' }}>Todos</span>
                  <div className="cc-title" style={{ color: 'var(--ink)' }}>Ver todos los reportes en Substack.</div>
                  <div className="cc-foot" style={{ color: 'var(--mute)' }}><span>2023–2026</span><span className="cc-read" style={{ color: 'var(--blue)' }}>Abrir →</span></div>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="rp-media">
          <div className="rp-media-lab">Nuestros datos son publicados por</div>
          <div className="rp-media-logos">
            {MEDIA.map((m) => (
              <img key={m.file} src={`/land/${m.file}.${m.ext}`} alt={m.alt} onError={imgHide} />
            ))}
          </div>
        </div>
      </section>

      {/* ===================== IN-COMPANY ===================== */}
      <div className="ic-head"><div className="k">Además de tu suscripción</div><div className="t">Conocé nuestras cápsulas <b>In-company</b></div></div>

      <section className="incompany" id="incompany">
        <div className="ic-photo">
          <div className="ph">Workshop in-company · NarraGlobal</div>
          <img className="ic-img" src="/land/workshop.jpg" alt="Workshop in-company NarraGlobal" onError={imgHide} />
        </div>
        <div className="ic-body">
          <div className="ic-eyebrow">Workshops in-company</div>
          <div className="ic-title">Mejoramos el storytelling de tus <span className="hl">colaboradores</span>.</div>
          <p className="ic-lede">Llevamos el modelo NarraNoise® a tu organización. Medimos la calidad en decks, presentaciones y pitcheos de tu equipo. Y con esa evidencia entrenamos en las zonas concretas de mejora. Seleccioná la temática que te interesa abordar y conversamos.</p>
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
          <input
            className="ic-otra-input"
            id="ic-otra"
            aria-label="Otra temática"
            placeholder="Escribí tu temática"
            value={otra}
            onChange={(e) => setOtra(e.target.value)}
            style={{ display: otraOn ? 'block' : 'none' }}
          />
          <a href={icHref} id="wa-workshop" className="ic-cta" target="_blank" rel="noopener noreferrer">
            <WaIcon />
            Quiero cotizar un workshop
          </a>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <div className="site-foot">
        <img className="foot-img" src="/land/wm-a.svg" alt="narraglobal" />
        <span className="r">Entrenado con el modelo NarraNoise® · narraglobal.com</span>
      </div>
    </>
  );
};

export default Index;
