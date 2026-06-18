import { useEffect } from 'react';
import { clientLogos } from '../components/clientLogos';

// WhatsApp number (código país + número, sin + ni espacios)
const WA = '5491130731011';

// Reuse the existing base64 client logos where the new design needs them.
const logoSrc = (alt: string) => clientLogos.find((l) => l.alt === alt)?.src;

// Client logos: row → design label, fallback text, clientLogos alt, asset file, size class
interface ClientDef { label: string; fallback: string; mapAlt?: string; file: string; ext?: string; size?: 'md' | 'lg'; }
const CLIENT_ROWS: ClientDef[][] = [
  [
    { label: 'Google', fallback: 'Google', mapAlt: 'Google', file: 'google', size: 'md' },
    { label: 'HBO Max', fallback: 'HBO&nbsp;Max', mapAlt: 'HBO Max', file: 'hbomax' },
    { label: 'Bayer', fallback: 'Bayer', mapAlt: 'Bayer', file: 'bayer', size: 'lg' },
    { label: 'Syngenta', fallback: 'Syngenta', file: 'syngenta', ext: 'webp' },
    { label: 'Amgen', fallback: 'AMGEN', file: 'amgen' },
  ],
  [
    { label: "L'Oréal", fallback: "L'ORÉAL", mapAlt: "L'Oréal", file: 'loreal' },
    { label: 'BID', fallback: 'BID', mapAlt: 'IDB', file: 'bid', size: 'md' },
    { label: 'Volkswagen', fallback: 'Volkswagen', mapAlt: 'VW', file: 'volkswagen', size: 'lg' },
    { label: 'Accenture', fallback: 'accenture', mapAlt: 'Accenture', file: 'accenture' },
    { label: 'River Plate', fallback: 'River&nbsp;Plate', mapAlt: 'River Plate', file: 'river', size: 'lg' },
  ],
];

// Press / media logos (no base64 available → text fallback on error)
interface MediaDef { alt: string; file: string; ext?: string; fallback: string; }
const MEDIA: MediaDef[] = [
  { alt: 'CNN', file: 'cnn', fallback: 'CNN' },
  { alt: 'Forbes', file: 'forbes', ext: 'webp', fallback: 'Forbes' },
  { alt: 'Univisión', file: 'univision', fallback: 'Univisión' },
  { alt: 'TVE Internacional', file: 'tve', ext: 'webp', fallback: 'TVE' },
  { alt: 'Infobae', file: 'infobae', fallback: 'Infobae' },
  { alt: 'Telefe', file: 'telefe', ext: 'jpg', fallback: 'Telefe' },
  { alt: 'Clarín', file: 'clarin', ext: 'jpg', fallback: 'Clarín' },
  { alt: 'La Nación', file: 'lanacion', ext: 'webp', fallback: 'La Nación' },
  { alt: 'Todo Noticias', file: 'tn', ext: 'webp', fallback: 'TN' },
];

const WaIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.215l-.999 3.648 3.965-.962zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
);

const imgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  img.style.display = 'none';
  const sib = img.nextElementSibling as HTMLElement | null;
  if (sib) sib.style.display = 'inline';
};
const imgHide = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.display = 'none';
};

const Index = () => {
  useEffect(() => {
    const byId = (id: string) => document.getElementById(id);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };
    const rafs: number[] = [];

    const countTo = (el: HTMLElement, to: number, dur: number) => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = String(Math.round(p * to));
        if (p < 1) rafs.push(requestAnimationFrame(step));
      };
      rafs.push(requestAnimationFrame(step));
    };

    // ===== HERO scorecard → WhatsApp =====
    const card = byId('card');
    const scoreEl = byId('score');
    const reset = () => {
      card?.classList.remove('away');
      byId('phone')?.classList.remove('show');
      byId('flyer')?.classList.remove('fly');
      byId('delta')?.classList.remove('in');
      ['b-mini', 'b-1', 'b-2', 'b-3'].forEach((i) => byId(i)?.classList.remove('in'));
      byId('typing')?.classList.remove('show');
      document.querySelectorAll<HTMLElement>('.track i').forEach((i) => { i.style.width = '0'; });
      document.querySelectorAll<HTMLElement>('.pv').forEach((p) => { p.textContent = '0'; });
      if (scoreEl) scoreEl.textContent = '0';
    };
    const loop = () => {
      reset();
      at(150, () => {
        document.querySelectorAll<HTMLElement>('.track i').forEach((i) => { i.style.width = (i.dataset.w || '0') + '%'; });
        document.querySelectorAll<HTMLElement>('.pv').forEach((p) => countTo(p, +(p.dataset.v || 0), 1100));
        if (scoreEl) countTo(scoreEl, 72, 1300);
      });
      at(1500, () => byId('delta')?.classList.add('in'));
      at(2900, () => byId('phone')?.classList.add('show'));
      at(2950, () => byId('flyer')?.classList.add('fly'));
      at(3100, () => card?.classList.add('away'));
      at(3900, () => byId('b-mini')?.classList.add('in'));
      at(4700, () => byId('b-1')?.classList.add('in'));
      at(5300, () => byId('typing')?.classList.add('show'));
      at(6600, () => { byId('typing')?.classList.remove('show'); byId('b-2')?.classList.add('in'); });
      at(7600, () => byId('b-3')?.classList.add('in'));
      at(10600, loop);
    };
    loop();

    // ===== cstage: gráfico → número → chat =====
    const cChart = byId('cs-chart');
    const cNum = byId('cs-num');
    const cScore = byId('cs-score');
    const cState = byId('cs-state');
    const cPlot = byId('cs-plot');
    const cCard = byId('cs-card');
    const cFlyer = byId('cs-flyer');
    const cPhone = byId('cs-phone');
    const cTyping = byId('cs-typing');
    const loopC = () => {
      cChart?.classList.remove('draw');
      if (cPlot) cPlot.style.opacity = '1';
      cNum?.classList.remove('show');
      if (cScore) cScore.textContent = '0';
      cCard?.classList.remove('away');
      cFlyer?.classList.remove('fly');
      cPhone?.classList.remove('show');
      ['cs-b1', 'cs-b2', 'cs-b3', 'cs-b4'].forEach((i) => byId(i)?.classList.remove('in'));
      cTyping?.classList.remove('show');
      if (cState) cState.textContent = 'midiendo';
      at(250, () => cChart?.classList.add('draw'));
      at(2050, () => { if (cPlot) cPlot.style.opacity = '0'; cNum?.classList.add('show'); if (cScore) countTo(cScore, 72, 1100); if (cState) cState.textContent = 'listo'; });
      at(3600, () => { cFlyer?.classList.add('fly'); cPhone?.classList.add('show'); });
      at(3850, () => cCard?.classList.add('away'));
      at(4450, () => byId('cs-b1')?.classList.add('in'));
      at(5050, () => byId('cs-b2')?.classList.add('in'));
      at(5750, () => byId('cs-b3')?.classList.add('in'));
      at(6450, () => cTyping?.classList.add('show'));
      at(7600, () => { cTyping?.classList.remove('show'); byId('cs-b4')?.classList.add('in'); });
      at(11200, loopC);
    };
    loopC();

    // ===== Packs (sumar a la suscripción) → WhatsApp deep-link =====
    const PNAMES: Record<string, string> = { seg: 'Pack Llamados tácticos', mesa: 'Pack Mesa chica' };
    const psel: Record<string, boolean> = { seg: false, mesa: false };
    const pbuild = () => {
      const sel = Object.keys(psel).filter((k) => psel[k]).map((k) => PNAMES[k]);
      let m = 'Hola, quiero dar de alta mi suscripción NarraGlobal (plan trimestral o anual).';
      m += sel.length ? ' Sumo: ' + sel.join(' + ') + '.' : '';
      const href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(m);
      const top = byId('wa-planes-top') as HTMLAnchorElement | null;
      if (top) top.href = href;
      const go = byId('go-activate') as HTMLAnchorElement | null;
      if (go) { go.href = href; go.style.display = sel.length ? 'inline-flex' : 'none'; }
    };
    const ptoggle = (id: string) => {
      psel[id] = !psel[id];
      const c = byId('pack-' + id);
      if (!c) return;
      c.classList.toggle('on', psel[id]);
      const b = c.querySelector('.ptoggle');
      const x = b?.querySelector('.x');
      const lbl = b?.querySelector('.lbl');
      if (x) x.textContent = psel[id] ? '✓' : '+';
      if (lbl) lbl.textContent = psel[id] ? 'Sumado ✓' : 'Sumar a mi suscripción';
      pbuild();
    };
    const packHandlers = Array.from(document.querySelectorAll<HTMLButtonElement>('.packs-strip .ptoggle')).map((b) => {
      const id = b.dataset.pack || '';
      const h = () => ptoggle(id);
      b.addEventListener('click', h);
      return { b, h };
    });
    pbuild();

    // ===== Workshop in-company — temáticas seleccionables =====
    const icSel = new Set<string>();
    const icbuild = () => {
      const temas = [...icSel];
      const otraEl = byId('ic-otra') as HTMLInputElement | null;
      const otra = otraEl?.value.trim();
      if (otra) temas.push(otra);
      let m = 'Hola, quiero cotizar un workshop in-company con NarraGlobal.';
      if (temas.length) m += ' Temáticas: ' + temas.join(', ') + '.';
      const a = byId('wa-workshop') as HTMLAnchorElement | null;
      if (a) a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(m);
    };
    const ictoggle = (b: HTMLElement) => {
      const on = b.classList.toggle('on');
      const cx = b.querySelector('.cx');
      if (cx) cx.textContent = on ? '✓' : '+';
      const t = b.dataset.t || '';
      if (on) icSel.add(t); else icSel.delete(t);
      icbuild();
    };
    const icotra = (b: HTMLElement) => {
      const on = b.classList.toggle('on');
      const cx = b.querySelector('.cx');
      if (cx) cx.textContent = on ? '✓' : '+';
      const inp = byId('ic-otra') as HTMLInputElement | null;
      if (inp) {
        inp.style.display = on ? 'block' : 'none';
        if (!on) inp.value = ''; else inp.focus();
      }
      icbuild();
    };
    const chipHandlers = Array.from(document.querySelectorAll<HTMLButtonElement>('.ic-topics .chip')).map((b) => {
      const h = () => (b.classList.contains('chip-otra') ? icotra(b) : ictoggle(b));
      b.addEventListener('click', h);
      return { b, h };
    });
    const otraInput = byId('ic-otra') as HTMLInputElement | null;
    const otraInputHandler = () => icbuild();
    otraInput?.addEventListener('input', otraInputHandler);
    icbuild();

    return () => {
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
      packHandlers.forEach(({ b, h }) => b.removeEventListener('click', h));
      chipHandlers.forEach(({ b, h }) => b.removeEventListener('click', h));
      otraInput?.removeEventListener('input', otraInputHandler);
    };
  }, []);

  return (
    <>
      {/* ===== HERO ===== */}
      <div className="hero">
        <div className="grid-bg" />
        <div className="pad">
          <div className="top">
            <div className="wm"><span className="nbox">narra</span><span className="dotg-h">global</span></div>
            <a href="#incompany" className="top-cta">Workshops in-company →</a>
          </div>

          <div className="grid2">
            {/* TEXT */}
            <div>
              <div className="eyebrow">Potenciado por NarraNoise® y NarraChat</div>
              <h1><span className="u">Dato</span> mejora relato.</h1>
              <p className="sub">Medimos la calidad de tu narrativa y convertimos esos datos en un <b>asistente de comunicación 100% a medida, por WhatsApp</b>.</p>
              <div className="ctas">
                <a href="#planes" className="btn btn-w">Conocé la suscripción</a>
              </div>
            </div>

            {/* ANIMATION */}
            <div>
              <div className="stage">
                {/* floating Índice NarraNoise scorecard */}
                <div className="card" id="card">
                  <div className="sc-head"><div className="ttl">Índice NarraNoise®</div><div className="sub2">May 2026</div></div>
                  <div className="sc-body">
                    <div className="sc-score">
                      <div className="big" id="score">0</div><div className="den">/ 100</div>
                      <div className="delta" id="delta">▲ 12 vs. abr</div>
                    </div>
                    <div className="sc-bars">
                      <div className="sc-bar"><div className="lab"><span>Atención</span><span className="v"><span className="pv" data-v="78">0</span></span></div><div className="track"><i data-w="78" /></div></div>
                      <div className="sc-bar"><div className="lab"><span>Credibilidad</span><span className="v"><span className="pv" data-v="69">0</span></span></div><div className="track"><i data-w="69" /></div></div>
                      <div className="sc-bar"><div className="lab"><span>Inmersión</span><span className="v"><span className="pv" data-v="70">0</span></span></div><div className="track"><i data-w="70" /></div></div>
                    </div>
                  </div>
                  <div className="sc-foot">Fuente: NarraNoise® · 54 marcadores · n=120 piezas</div>
                </div>

                {/* flyer: símbolo cuadrante */}
                <div className="flyer" id="flyer">
                  <svg viewBox="0 0 48 48"><rect x="7" y="7" width="34" height="34" rx="2.5" fill="none" stroke="#3E1CFF" strokeWidth="2" /><line x1="24" y1="9" x2="24" y2="39" stroke="rgba(62,28,255,.4)" strokeWidth="1.2" /><line x1="9" y1="24" x2="39" y2="24" stroke="rgba(62,28,255,.4)" strokeWidth="1.2" /><circle cx="32" cy="15" r="3.6" fill="#3E1CFF" /></svg>
                </div>

                {/* phone */}
                <div className="phone" id="phone">
                  <div className="notch" />
                  <div className="wa">
                    <div className="wa-head">
                      <div className="wa-ava"><img src="logos/narrachat-avatar.png" alt="NarraChat" onError={imgHide} /></div>
                      <div className="wa-name">NarraChat <small>en línea</small></div>
                    </div>
                    <div className="wa-body">
                      <div className="mini" id="b-mini">
                        <div className="mh"><span className="ml">Índice NarraNoise®</span><span className="ms">72</span></div>
                        <div className="mlab"><span>Atención</span><span className="v">78</span></div><div className="mtrack"><div className="mfill" style={{ width: '78%' }} /></div>
                        <div className="mlab"><span>Credibilidad</span><span className="v vp">69</span></div><div className="mtrack"><div className="mfill pink" style={{ width: '69%' }} /></div>
                        <div className="mlab"><span>Inmersión</span><span className="v">70</span></div><div className="mtrack"><div className="mfill" style={{ width: '70%' }} /></div>
                      </div>

                      <div className="bub right" id="b-1">¿Qué mejoro de mi último comunicado? <span className="tm">9:41 <span className="rr">✓✓</span></span></div>

                      <div className="typing" id="typing"><span /><span /><span /></div>

                      <div className="bub left" id="b-2">Los datos sugieren que tu <span className="pinkw">credibilidad</span> quedó debajo del resto. Es lo primero a tocar. <span className="tm">9:41</span></div>
                      <div className="bub left" id="b-3">Cambiá el cierre: del dato general a un caso con nombre y fecha. Volvé a medir → <span className="greenw">+9</span> 📈 <span className="tm">9:41</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="caption">Del dato medido a tu WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CLIENTES ===== */}
      <div className="clients">
        <div className="cl-eyebrow">Miden su narrativa con nosotros</div>
        <div className="cl-title">Líderes corporativos y políticos confían en nuestras métricas.</div>
        <div className="logos">
          {CLIENT_ROWS.map((row, ri) => (
            <div className="logo-row" key={ri}>
              {row.map((c) => (
                <div className={'logo' + (c.size ? ' ' + c.size : '')} key={c.label}>
                  <img src={(c.mapAlt && logoSrc(c.mapAlt)) || `logos/${c.file}.${c.ext || 'png'}`} alt={c.label} onError={imgError} />
                  <span className="lf" dangerouslySetInnerHTML={{ __html: c.fallback }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== PLANES ===== */}
      <div className="planes" id="planes">
        <div className="build">
          <div className="step">
            <div className="step-tag"><span className="n">01</span> Tu base · punto de entrada</div>

            {/* PLAN BASE */}
            <div className="plan-base">
              <div className="pb-left">
                <div className="pb-label">Suscripción NarraGlobal · trimestral o anual</div>
                <div className="pb-benefit">Chateá y mejorá tu narrativa desde WhatsApp.</div>
                <p className="pb-copy">Nuestra suscripción incluye NarraChat, un asistente de narrativa entrenado con tus datos. <b>No inventa, no aporta ideas random:</b> se basa 100% en las mediciones que nuestro modelo NarraNoise® hizo sobre tu narrativa, y da respuestas originales para llevar tu comunicación al próximo nivel.</p>
                <a href="#" id="wa-planes-top" className="pb-cta" target="_blank" rel="noopener noreferrer">
                  <WaIcon />
                  Activá tu suscripción
                </a>
              </div>
              <div className="pb-right">
                <div className="cstage">
                  <div className="cs-card" id="cs-card">
                    <div className="cs-chead"><span className="t">Índice NarraNoise®</span><span className="s" id="cs-state">midiendo</span></div>
                    <div className="cs-cbody">
                      <div className="cs-plot" id="cs-plot">
                        <svg className="cs-chart" id="cs-chart" viewBox="0 0 220 92" preserveAspectRatio="none">
                          <polyline className="l3" points="0,80 18,77 38,79 58,73 78,75 98,67 118,70 138,62 158,65 178,57 198,59 220,52" />
                          <polyline className="l2" points="0,69 18,72 38,63 58,66 78,56 98,60 118,49 138,53 158,43 178,46 198,38 220,35" />
                          <polyline className="l1" points="0,73 18,65 38,69 58,55 78,61 98,46 118,51 138,38 158,44 178,30 198,33 220,24" />
                        </svg>
                        <div className="cs-live"><span className="ld" />en vivo</div>
                      </div>
                      <div className="cs-num" id="cs-num"><span className="big" id="cs-score">0</span><span className="den">/ 100</span></div>
                    </div>
                    <div className="cs-cfoot">54 marcadores · n=120 piezas</div>
                  </div>

                  <div className="cs-flyer" id="cs-flyer">72</div>

                  <div className="cs-phone" id="cs-phone">
                    <div className="cs-notch" />
                    <div className="cs-wa">
                      <div className="cs-wahead">
                        <div className="cs-waava"><img src="logos/narrachat-avatar.png" alt="NarraChat" onError={imgHide} /></div>
                        <div className="cs-waname">NarraChat<small>en línea</small></div>
                      </div>
                      <div className="cs-wabody">
                        <div className="cs-bub right" id="cs-b1">Hola<span className="tm">9:55 <span className="rr">✓✓</span></span></div>
                        <div className="cs-bub left" id="cs-b2">¡Hola, Martín!<span className="tm">9:55</span></div>
                        <div className="cs-bub right" id="cs-b3"><div className="cs-file"><span className="fi">PDF</span><span className="fn">discurso.pdf<small>2 págs · 84 KB</small></span></div>¿Cómo ves este discurso?<span className="tm">9:55 <span className="rr">✓✓</span></span></div>
                        <div className="cs-typing" id="cs-typing"><span /><span /><span /></div>
                        <div className="cs-bub left" id="cs-b4">El segundo párrafo es el eje central, así que te recomiendo que…<span className="tm">9:55</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cs-caption">Tu narrativa mejora cada día.</div>
              </div>
            </div>
          </div>

          <div className="connector"><span className="ln" /><span className="lbl">+ sumás packs exclusivos</span><span className="ln" /></div>

          <div className="step">
            <div className="step-tag"><span className="n">02</span> Packs exclusivos · solo para suscriptores <span className="opt">Acceso reservado</span></div>

            {/* PACKS — zócalo mitad azul / mitad negro */}
            <div className="packs-strip">
              <div className="ps-half" id="pack-seg">
                <div className="ps-cat">Pack exclusivo · virtual</div>
                <h4 className="ps-name">Llamados tácticos</h4>
                <p className="ps-desc">Pack de videollamadas de problema-solución. Ideal para asesores y decisores de comunicación.</p>
                <button className="ptoggle" data-pack="seg" type="button"><span className="x">+</span><span className="lbl">Sumar a mi suscripción</span></button>
              </div>
              <div className="ps-half" id="pack-mesa">
                <div className="ps-cat">Pack exclusivo · presencial</div>
                <h4 className="ps-name">Mesa chica</h4>
                <p className="ps-desc">Pack de visitas a territorio. Incluye análisis de competidores, escenarios para decisores, y entrenamiento al equipo de comunicación. Ideal para proyectos de alta incidencia pública.</p>
                <button className="ptoggle" data-pack="mesa" type="button"><span className="x">+</span><span className="lbl">Sumar a mi suscripción</span></button>
              </div>
            </div>
          </div>
        </div>

        <div className="plan-cta">
          <a href="#" id="go-activate" className="cta-wa" target="_blank" rel="noopener noreferrer" style={{ display: 'none' }}>Ir a activar mi suscripción →</a>
        </div>
      </div>

      {/* ===== IN-COMPANY ===== */}
      <div className="ic-head"><div className="t">Conocé nuestras cápsulas <b>In-company</b></div></div>

      <div className="incompany" id="incompany">
        <div className="ic-photo">
          <div className="ph">Workshop in-company · NarraGlobal</div>
          <img className="ic-img" src="fotos/workshop.jpg" alt="Workshop in-company NarraGlobal" onError={imgHide} />
        </div>
        <div className="ic-body">
          <div className="ic-eyebrow">Workshops in-company</div>
          <div className="ic-title">Mejoramos el storytelling de tus <span className="hl">colaboradores</span>.</div>
          <p className="ic-lede">Llevamos el modelo NarraNoise® a tu organización. Medimos la calidad en decks, presentaciones y pitcheos de tu equipo. Y con esa evidencia entrenamos en las zonas concretas de mejora. Seleccioná la temática que te interesa abordar y conversamos.</p>
          <div className="ic-topics">
            <button className="chip" data-t="Oratoria" type="button"><span className="cx">+</span>Oratoria</button>
            <button className="chip" data-t="Storytelling" type="button"><span className="cx">+</span>Storytelling</button>
            <button className="chip" data-t="Data storytelling" type="button"><span className="cx">+</span>Data storytelling</button>
            <button className="chip" data-t="Presentaciones de alto impacto" type="button"><span className="cx">+</span>Presentaciones de alto impacto</button>
            <button className="chip" data-t="Pitch de ventas" type="button"><span className="cx">+</span>Pitch de ventas</button>
            <button className="chip" data-t="Coaching ejecutivo" type="button"><span className="cx">+</span>Coaching ejecutivo</button>
            <button className="chip" data-t="Comunicación interna" type="button"><span className="cx">+</span>Comunicación interna</button>
            <button className="chip" data-t="Contar el cambio" type="button"><span className="cx">+</span>Contar el cambio</button>
            <button className="chip" data-t="Comunicación de crisis" type="button"><span className="cx">+</span>Comunicación de crisis</button>
            <button className="chip" data-t="Charla de Q" type="button"><span className="cx">+</span>Charla de Q</button>
            <button className="chip chip-otra" type="button"><span className="cx">+</span>Otra…</button>
          </div>
          <input className="ic-otra-input" id="ic-otra" placeholder="Escribí tu temática" style={{ display: 'none' }} />
          <a href="#" id="wa-workshop" className="ic-cta" target="_blank" rel="noopener noreferrer">
            <WaIcon />
            Quiero cotizar un workshop
          </a>
        </div>
      </div>

      {/* ===== REPORTES (carrusel → Substack) ===== */}
      <div className="reportes" id="reportes">
        <div className="rp-head">
          <div className="rp-eyebrow">Reportes publicados</div>
          <div className="rp-title">Lo último, medido y publicado.</div>
          <p className="rp-lede">Cada mes publicamos un nuevo reporte NarraNoise®. Mirá las portadas y leé el análisis completo en Substack.</p>
        </div>

        <div className="rp-carousel">
          <a className="rp-cover" href="https://narraglobal.substack.com/p/relato-desorganizado-y-50-de-ruido" target="_blank" rel="noopener noreferrer">
            <div className="cover-card">
              <img className="cc-bg" src="https://substackcdn.com/image/fetch/$s_!hkcH!,w_1200,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5747a69a-3bb5-4c0c-acb1-519364316fcc_1100x480.png" alt="" onError={imgHide} />
              <div className="cc-shade" />
              <div className="cc-top"><span className="cc-wm">narra<span className="dotg">global</span></span><span className="cc-tag">Reporte · Política</span></div>
              <div className="cc-bottom">
                <span className="cc-dato">50% ruido</span>
                <div className="cc-title">Relato desorganizado en el relanzamiento del PRO.</div>
                <div className="cc-foot"><span>Abr 2026 · NarraNoise®</span><span className="cc-read">Leer →</span></div>
              </div>
            </div>
          </a>
          <a className="rp-cover" href="https://narraglobal.substack.com/p/gebel-bajo-un-73-su-cuota-dios-en" target="_blank" rel="noopener noreferrer">
            <div className="cover-card">
              <img className="cc-bg" src="https://substackcdn.com/image/fetch/$s_!qwNw!,w_1200,h_675,c_fill,f_jpg,q_auto:good,fl_progressive:steep,g_auto/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F758310d6-c074-4698-a49c-f8f46c047b20_2200x1041.png" alt="" onError={imgHide} />
              <div className="cc-shade" />
              <div className="cc-top"><span className="cc-wm">narra<span className="dotg">global</span></span><span className="cc-tag">Reporte · Política</span></div>
              <div className="cc-bottom">
                <span className="cc-dato">−73%</span>
                <div className="cc-title">Gebel bajó su 'cuota Dios' al entrar en política.</div>
                <div className="cc-foot"><span>May 2026 · NarraNoise®</span><span className="cc-read">Leer →</span></div>
              </div>
            </div>
          </a>
          <a className="rp-cover" href="https://x.com/lisandrobregant/status/1733928007423717588" target="_blank" rel="noopener noreferrer">
            <div className="cover-card cover-x">
              <img className="cc-bg" src="reportes/milei-asuncion.jpg" alt="" onError={imgHide} />
              <div className="cc-shade" />
              <svg className="cc-xmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              <div className="cc-top"><span className="cc-wm">narra<span className="dotg">global</span></span><span className="cc-tag">Análisis · X</span></div>
              <div className="cc-bottom">
                <span className="cc-dato2">Hilo en X</span>
                <div className="cc-title">La narrativa de cirujano en el discurso de asunción de Milei.</div>
                <div className="cc-foot"><span>Dic 2023 · Política</span><span className="cc-read">Ver hilo →</span></div>
              </div>
            </div>
          </a>
          <a className="rp-cover" href="https://narraglobal.substack.com/subscribe" target="_blank" rel="noopener noreferrer">
            <div className="cover-card cover-next"><div className="gb" />
              <div className="cc-top"><span className="cc-wm">narra<span className="dotg">global</span></span><span className="cc-tag">Próximo</span></div>
              <div className="cc-bottom">
                <span className="cc-dato2">Próximo análisis</span>
                <div className="cc-title">Suscribite y recibilo en tu correo.</div>
                <div className="cc-foot"><span>NarraNoise®</span><span className="cc-read">Suscribirme →</span></div>
              </div>
            </div>
          </a>
        </div>

        <div className="rp-media">
          <div className="rp-media-lab">Nuestros datos son publicados por</div>
          <div className="rp-media-logos">
            {MEDIA.map((m) => (
              <span key={m.alt} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <img src={`medios/${m.file}.${m.ext || 'png'}`} alt={m.alt} onError={imgError} />
                <span className="mf">{m.fallback}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <div className="site-foot">
        <span className="foot-wm">narra<span className="g dotg-d">global</span></span>
        <span className="r">Entrenado con el modelo NarraNoise® · narraglobal.com</span>
      </div>
    </>
  );
};

export default Index;
