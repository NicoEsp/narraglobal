import { useEffect, useRef, useState, useCallback } from 'react';
import { clientLogos } from '../components/clientLogos';

// ═══ REPORT DATA ═══
const TABS = ['todos', 'politica', 'liderazgo', 'deporte', 'crisis'] as const;
const TAB_LABELS: Record<string, string> = { todos: 'Todos', politica: 'Política', liderazgo: 'Liderazgo', deporte: 'Deporte', crisis: 'Crisis' };

interface ReportItem { tag: string; title: string; meta: string; }
interface TabData { heroTag: string; heroTitle: string; heroDesc: string; heroMeta: string; heroCta: string; heroStyle?: React.CSSProperties; heroViz?: React.ReactNode; sidebar: ReportItem[]; }

const REPORT_TABS: Record<string, TabData> = {
  todos: {
    heroTag: 'Política Argentina', heroTitle: 'Índice de Credibilidad: Top 5 Líderes Argentinos',
    heroDesc: 'Milei 82% · Cristina 61% · Kicillof 58% · Bullrich 55% · Villarruel 69%. Cómo evolucionó cada score semana a semana en atención, credibilidad e inmersión.',
    heroMeta: 'Semana 10, 2025 • 45 pp • 8 min lectura', heroCta: 'Leer reporte',
    heroViz: (
      <div style={{ position: 'absolute', top: 30, right: 30, zIndex: 2, opacity: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {[30, 50, 70, 55, 85, 100].map((h, i) => <div key={i} style={{ width: 8, background: `rgba(255,255,255,${0.3 + i * 0.1})`, borderRadius: '2px 2px 0 0', height: `${h}%` }} />)}
        </div>
      </div>
    ),
    sidebar: [
      { tag: 'Liderazgo Global', title: 'Narrativa Milei como IP Global: de Twitter a Davos', meta: '2024 • 38 pp • 6 min' },
      { tag: 'Deporte & Marca', title: 'River Plate: La narrativa emocional detrás de los penales', meta: 'Análisis especial • 32 pp • 5 min' },
      { tag: 'Crisis Corporativa', title: 'Aerolíneas Argentinas: Narrativa sindical vs. narrativa estatal', meta: 'Última edición 2024 • 56 pp • 10 min' },
      { tag: 'Energía & Minería', title: 'Vaca Muerta: Cómo comunica la industria extractiva en Argentina', meta: 'Nuevo • 28 pp • 4 min' },
    ],
  },
  politica: {
    heroTag: 'Ranking semanal', heroTitle: 'Índice de Credibilidad: Top 5 Líderes Latinoamericanos',
    heroDesc: 'Milei, Lula, Sheinbaum, Cristina, Kicillof. Medimos semanalmente cómo evoluciona su credibilidad, atención e inmersión narrativa en medios y redes.',
    heroMeta: 'Semana 10, Mar 2025 • Ranking semanal', heroCta: 'Ver ranking completo',
    heroStyle: { background: 'linear-gradient(135deg, #0a0636 0%, #1a0a6e 50%, #3E1CFF 100%)' },
    heroViz: (
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 2, opacity: 0.5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[{ n: 'MILEI', w: 120, v: '82%' }, { n: 'LULA', w: 100, v: '74%' }, { n: 'SHEINB.', w: 90, v: '69%' }, { n: 'CFK', w: 80, v: '61%' }, { n: 'KICILL.', w: 75, v: '58%' }].map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>{d.n}</span>
              <div style={{ height: 6, borderRadius: 3, background: `rgba(255,255,255,${0.7 - i * 0.1})`, width: d.w }} />
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{d.v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    sidebar: [
      { tag: 'Elecciones Argentina', title: 'Elecciones 2025: Mapa narrativo de candidatos', meta: 'Actualizado semanalmente • 45 pp' },
      { tag: 'México', title: 'Sheinbaum: Primeros 100 días en NarraNoise®', meta: '2025 • 34 pp • 7 min' },
      { tag: 'Brasil', title: 'Lula vs. Bolsonaro: Narrativa de polarización medida', meta: '2024 • 52 pp • 12 min' },
      { tag: 'Latam', title: 'Gobernadores que mejor comunican en Latinoamérica', meta: 'Nuevo • 40 pp • 8 min' },
    ],
  },
  liderazgo: {
    heroTag: 'Liderazgo & Marca Personal', heroTitle: 'Narrativa Milei como IP Global: de Twitter a Davos',
    heroDesc: 'Cómo un líder latinoamericano construye su marca global. Analizamos la evolución de su narrativa en medios internacionales: WSJ, Financial Times, The Economist, CNN.',
    heroMeta: '2024 • 38 pp • 6 min lectura', heroCta: 'Leer reporte',
    heroStyle: { background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #2d1b69 100%)' },
    sidebar: [
      { tag: 'CEO Branding', title: 'Galperín, Sigman, Rocca: Narrativas de CEOs argentinos globales', meta: '2025 • 30 pp • 5 min' },
      { tag: 'Vocería', title: 'Manual de vocería basado en datos: qué dice NarraNoise®', meta: 'Guía • 24 pp • 4 min' },
      { tag: 'Startups', title: 'Pitch narrativo: Cómo comunican las unicornios latam a inversores', meta: '2024 • 28 pp • 6 min' },
      { tag: 'Influencia', title: 'Del dato al relato: Cómo líderes transforman métricas en storytelling', meta: 'Nuevo • 20 pp • 3 min' },
    ],
  },
  deporte: {
    heroTag: 'Fútbol & Narrativa', heroTitle: 'River Plate: La narrativa emocional detrás de los penales de Madrid',
    heroDesc: 'Analizamos los componentes emocionales que convirtieron ese momento en identidad nacional. Credibilidad 91%, Inmersión 96%, Atención sostenida durante 72 hs post-partido.',
    heroMeta: 'Análisis especial • 32 pp • 5 min', heroCta: 'Leer análisis',
    heroStyle: { background: 'linear-gradient(135deg, #0a1a0a 0%, #1a3d1a 50%, #2d6b2d 100%)' },
    sidebar: [
      { tag: 'Marca Deportiva', title: 'Messi en Inter Miami: Narrativa de marca personal en MLS', meta: '2024 • 26 pp • 5 min' },
      { tag: 'Sponsors', title: 'Cómo los sponsors miden el retorno narrativo en el deporte', meta: '2025 • 22 pp • 4 min' },
      { tag: 'Selección Argentina', title: 'Qatar 2022: Anatomía narrativa de un campeonato', meta: 'Análisis especial • 48 pp • 9 min' },
      { tag: 'Esports', title: 'Narrativa en esports: La nueva frontera del relato competitivo', meta: 'Nuevo • 18 pp • 3 min' },
    ],
  },
  crisis: {
    heroTag: 'Crisis Corporativa', heroTitle: 'Aerolíneas Argentinas: Narrativa sindical vs. narrativa estatal',
    heroDesc: 'Dos narrativas enfrentadas medidas con NarraNoise®. Quién ganó credibilidad, quién perdió inmersión, y qué pueden aprender las empresas en conflicto.',
    heroMeta: 'Última edición 2024 • 56 pp • 10 min', heroCta: 'Leer caso',
    heroStyle: { background: 'linear-gradient(135deg, #1a0a0a 0%, #4a1010 50%, #8b1a1a 100%)' },
    sidebar: [
      { tag: 'Energía', title: 'YPF y Vaca Muerta: Comunicar extracción en era ESG', meta: '2025 • 36 pp • 7 min' },
      { tag: 'Minería', title: 'Litio argentino: La batalla narrativa entre comunidades y corporaciones', meta: '2024 • 42 pp • 8 min' },
      { tag: 'Agro', title: 'Campo vs. Gobierno: 15 años de narrativa agropecuaria medida', meta: 'Análisis especial • 60 pp • 12 min' },
      { tag: 'Finanzas', title: 'Bancos en crisis de reputación: Qué narrativas recuperan confianza', meta: 'Nuevo • 30 pp • 6 min' },
    ],
  },
};

const Index = () => {
  const navRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<Record<string, boolean>>({});

  const closePanel = useCallback(() => {
    setOpenPanel(null);
    document.body.style.overflow = '';
  }, []);

  const handleOpenPanel = useCallback((type: string) => {
    setOpenPanel(type);
    document.body.style.overflow = 'hidden';
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>, type: string) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const entries: string[] = [];
    data.forEach((v, k) => { if (v) entries.push(`${k}: ${v}`); });
    const label = type === 'narraasist' ? 'NARRAASIST' : 'NARRAWORK';
    const org = data.get('organizacion') || '';
    const subject = encodeURIComponent(`${label} — ${org}`);
    const body = encodeURIComponent(entries.join('\n'));
    window.location.href = `mailto:lisandro@narraglobal.com?subject=${subject}&body=${body}`;
    setFormSuccess(prev => ({ ...prev, [type]: true }));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) navRef.current.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);

    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', handleEsc);

    // Hero chart animation
    const marca = [[100, 130], [150, 112], [200, 96], [250, 82], [300, 72]];
    const sector = [[100, 108], [150, 110], [200, 112], [250, 108], [300, 110]];
    const comp = [[100, 92], [150, 116], [200, 136], [250, 152], [300, 162]];
    const L1 = document.getElementById('hL1');
    const L2 = document.getElementById('hL2');
    const L3 = document.getElementById('hL3');
    const D1 = document.getElementById('hD1');
    const D2 = document.getElementById('hD2');
    const D3 = document.getElementById('hD3');
    const A = document.getElementById('hArea');
    const xlabels = document.querySelectorAll('.xl');

    if (L1) {
      const dur = 5500;
      let st: number | null = null;
      let lastL = -1;
      let breatheId: number;

      function ease(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
      function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
      function getPts(data: number[][], p: number) {
        const seg = data.length - 1;
        const cl = p * seg;
        const pts: number[][] = [];
        for (let i = 0; i < data.length; i++) {
          if (i <= cl) pts.push([data[i][0], data[i][1]]);
          else if (i - 1 < cl) {
            const sp = cl - (i - 1);
            pts.push([lerp(data[i - 1][0], data[i][0], sp), lerp(data[i - 1][1], data[i][1], sp)]);
            break;
          }
        }
        return pts;
      }
      function p2s(pts: number[][]) { let s = ''; for (let i = 0; i < pts.length; i++) s += pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1) + ' '; return s.trim(); }
      function bArea(pts: number[][]) {
        if (pts.length < 2) return '';
        let d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
        for (let i = 1; i < pts.length; i++) d += ' L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
        d += ' L' + pts[pts.length - 1][0].toFixed(1) + ',176 L' + pts[0][0].toFixed(1) + ',176 Z';
        return d;
      }
      function sL(i: number) { const el = xlabels[i] as HTMLElement; if (el) { el.style.transition = 'opacity 0.8s'; el.style.opacity = '1'; } }

      function draw(ts: number) {
        if (!st) st = ts;
        const el = ts - st;
        const rp = Math.min(el / dur, 1);
        const p = ease(rp);
        const p1 = getPts(marca, p), p2 = getPts(sector, p), p3 = getPts(comp, p);
        L1!.setAttribute('points', p2s(p1)); L2!.setAttribute('points', p2s(p2)); L3!.setAttribute('points', p2s(p3));
        const l1 = p1[p1.length - 1], l2 = p2[p2.length - 1], l3 = p3[p3.length - 1];
        D1!.setAttribute('cx', String(l1[0])); D1!.setAttribute('cy', String(l1[1])); D1!.setAttribute('r', '5');
        D2!.setAttribute('cx', String(l2[0])); D2!.setAttribute('cy', String(l2[1])); D2!.setAttribute('r', '3');
        D3!.setAttribute('cx', String(l3[0])); D3!.setAttribute('cy', String(l3[1])); D3!.setAttribute('r', '3');
        A!.setAttribute('d', bArea(p1)); A!.setAttribute('opacity', '0.25');
        const cl = Math.floor(p * (marca.length - 1));
        while (lastL < cl) { lastL++; sL(lastL); }
        if (rp < 1) { requestAnimationFrame(draw); }
        else {
          sL(4);
          setTimeout(() => {
            ['hBadge', 'hRuido', 'hUmbral', 'hUmT1', 'hUmT2', 'hLeg'].forEach((id) => {
              const e = document.getElementById(id);
              if (e) { e.style.transition = 'opacity 1.2s'; e.setAttribute('opacity', '1'); }
            });
          }, 400);
          setTimeout(() => { breatheId = requestAnimationFrame(heroBreathe); }, 1400);
        }
      }

      let bt = 0;
      function heroBreathe() {
        bt += 0.02;
        let s1 = '', s2 = '', s3 = '';
        for (let i = 0; i < marca.length; i++) {
          s1 += marca[i][0] + ',' + (marca[i][1] + Math.sin(bt * 1.1 + i * 0.9) * 3).toFixed(1) + ' ';
          s2 += sector[i][0] + ',' + (sector[i][1] + Math.sin(bt * 0.8 + i * 0.6) * 1.5).toFixed(1) + ' ';
          s3 += comp[i][0] + ',' + (comp[i][1] + Math.sin(bt * 0.7 + i * 1.1) * 2.5).toFixed(1) + ' ';
        }
        L1!.setAttribute('points', s1.trim()); L2!.setAttribute('points', s2.trim()); L3!.setAttribute('points', s3.trim());
        D1!.setAttribute('cy', (marca[4][1] + Math.sin(bt * 1.1 + 4 * 0.9) * 3).toFixed(1));
        D3!.setAttribute('cy', (comp[4][1] + Math.sin(bt * 0.7 + 4 * 1.1) * 2.5).toFixed(1));
        breatheId = requestAnimationFrame(heroBreathe);
      }

      const drawTimeout = setTimeout(() => { requestAnimationFrame(draw); }, 700);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleEsc);
        clearTimeout(drawTimeout);
        if (breatheId) cancelAnimationFrame(breatheId);
      };
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [closePanel]);

  const tabData = REPORT_TABS[activeTab];

  return (
    <>
      {/* NAV */}
      <nav className="navbar" ref={navRef}>
        <div className="container">
          <a className="logo" href="#">
            <svg viewBox="0 0 310 28" height={24} style={{ display: 'block' }}>
              <text x="0" y="22" fontFamily="DM Sans,sans-serif" fontWeight="700" fontSize="21" letterSpacing="2" fill="#1A1A1A">NARRA</text>
              <text x="120" y="22" fontFamily="Source Serif 4,Georgia,serif" fontWeight="600" fontSize="21" letterSpacing="2" fill="#3E1CFF">GLOBAL</text>
            </svg>
          </a>
          <div className="nav-ctas">
            <a className="nav-cta" href="https://narra-assist.lovable.app/" target="_blank" rel="noopener noreferrer">NarraAsist</a>
            <a className="nav-cta" href="#combos">Medir mi narrativa</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="halftone"></div>
        <div className="dark-grad"></div>
        <div className="hero-chart">
          <svg viewBox="0 0 420 260" preserveAspectRatio="xMidYMid meet" id="heroChart">
            <line x1="50" y1="24" x2="350" y2="24" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="50" y1="56" x2="350" y2="56" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="50" y1="88" x2="350" y2="88" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="50" y1="120" x2="350" y2="120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <line x1="50" y1="152" x2="350" y2="152" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <line x1="150" y1="24" x2="150" y2="176" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="250" y1="24" x2="250" y2="176" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <text x="42" y="27" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">100</text>
            <text x="42" y="59" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">80</text>
            <text x="42" y="91" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">60</text>
            <text x="42" y="123" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">40</text>
            <text x="42" y="155" fill="rgba(255,255,255,0.15)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">20</text>
            {['S1', 'S2', 'S3', 'S4', 'S5'].map((l, i) => (
              <text key={l} x={100 + i * 50} y="192" fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle" fontFamily="DM Sans,sans-serif" className="xl" style={{ opacity: 0 }}>{l}</text>
            ))}
            <rect id="hUmbral" x="50" y="152" width="300" height="24" fill="rgba(255,255,255,0.06)" opacity="0" />
            <text id="hUmT1" x="355" y="164" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Mono,monospace" opacity="0">UMBRAL</text>
            <text id="hUmT2" x="355" y="173" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Space Mono,monospace" opacity="0">DE RUIDO</text>
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path id="hArea" fill="url(#ag)" opacity="0" />
            <polyline id="hL1" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points="100,130 150,112 200,96 250,82 300,72" />
            <polyline id="hL2" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points="100,108 150,110 200,112 250,108 300,110" />
            <polyline id="hL3" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points="100,92 150,116 200,136 250,152 300,162" />
            <circle id="hD1" r="0" fill="#FFF" />
            <circle id="hD2" r="0" fill="rgba(255,255,255,0.4)" />
            <circle id="hD3" r="0" fill="rgba(255,255,255,0.3)" />
            <g id="hBadge" opacity="1"><rect x="306" y="33" width="42" height="22" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" /><text x="327" y="48" fill="#FFF" fontSize="11" textAnchor="middle" fontFamily="Space Mono,monospace" fontWeight="700">63%</text></g>
            <g id="hRuido" opacity="1"><rect x="306" y="150" width="42" height="16" rx="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" /><text x="327" y="161" fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle" fontFamily="Space Mono,monospace" fontWeight="700">RUIDO</text></g>
            <g id="hLeg" opacity="0">
              <circle cx="60" cy="215" r="4" fill="#FFF" /><text x="70" y="219" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="DM Sans,sans-serif">Tu marca</text>
              <circle cx="160" cy="215" r="4" fill="rgba(255,255,255,0.35)" /><text x="170" y="219" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Sans,sans-serif">Prom. sector</text>
              <circle cx="280" cy="215" r="4" fill="rgba(255,255,255,0.25)" /><text x="290" y="219" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="DM Sans,sans-serif">Competidor</text>
            </g>
          </svg>
        </div>
        <div className="hero-inner">
          <div className="label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Narrativas • Medición • Acción</div>
          <h1>Dato mejora<br />relato.</h1>
          <p className="claim">NarraNoise® es un modelo de medición con más de doce años de vigencia que transforma tu comunicación en datos confiables. Descubrí cómo tu narrativa impacta en atención, credibilidad e inmersión con métricas basadas en evidencia.</p>
          <div className="hero-cta-row">
            <a href="#combos" className="btn-blue">Medir mi narrativa</a>
            <a href="#narranoise" className="btn-outline">Conocé NarraNoise®</a>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="sec-logos">
        <div className="logos-label">Miden su narrativa con nosotros</div>
        <div className="logos-track">
          <div className="logos-slide">
            {clientLogos.map((logo, i) => <img key={i} className="client-logo" src={logo.src} alt={logo.alt} />)}
            {clientLogos.map((logo, i) => <img key={`dup-${i}`} className="client-logo" src={logo.src} alt={logo.alt} />)}
          </div>
        </div>
      </section>

      {/* NARRANOISE 50/50 */}
      <section className="nn-section" id="narranoise">
        <div className="container">
          <div className="nn-grid">
            <div>
              <div className="dots">•••</div>
              <h2>Tu comunicación merece un número. No una opinión.</h2>
              <p>NarraNoise® mide los componentes emocionales y cognitivos de tu narrativa con 54 marcadores precisos. Indicadores diseñados para entender qué hace que tu mensaje funcione.</p>
              <ul className="benefit-list">
                <li>54 marcadores de análisis profundo</li>
                <li>Atención, credibilidad, inmersión</li>
                <li>Comparativas sectoriales</li>
                <li>Curvas de evolución temporal</li>
                <li>Plan de acción recomendado</li>
                <li>Reporte ejecutivo en 10 días</li>
              </ul>
            </div>
            <div className="nn-image-wrap">
              <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="300" fill="#0A0A0A" />
                <line x1="40" y1="60" x2="360" y2="60" stroke="rgba(62,28,255,0.08)" strokeWidth="0.5" />
                <line x1="40" y1="100" x2="360" y2="100" stroke="rgba(62,28,255,0.08)" strokeWidth="0.5" />
                <line x1="40" y1="140" x2="360" y2="140" stroke="rgba(62,28,255,0.1)" strokeWidth="0.5" strokeDasharray="4,4" />
                <line x1="40" y1="180" x2="360" y2="180" stroke="rgba(62,28,255,0.08)" strokeWidth="0.5" />
                <line x1="40" y1="220" x2="360" y2="220" stroke="rgba(62,28,255,0.08)" strokeWidth="0.5" />
                <text x="30" y="64" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">100</text>
                <text x="30" y="104" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">75</text>
                <text x="30" y="144" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">50</text>
                <text x="30" y="184" fill="rgba(255,255,255,0.12)" fontSize="8" textAnchor="end" fontFamily="Space Mono,monospace">25</text>
                <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3E1CFF" stopOpacity="0.25" /><stop offset="100%" stopColor="#3E1CFF" stopOpacity="0" /></linearGradient></defs>
                <path d="M80,180 120,160 160,130 200,110 240,95 280,80 320,70 L320,220 L80,220 Z" fill="url(#gArea)" />
                <polyline points="80,180 120,160 160,130 200,110 240,95 280,80 320,70" fill="none" stroke="#3E1CFF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points="80,170 120,172 160,168 200,170 240,165 280,168 320,166" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
                <polyline points="80,150 120,165 160,178 200,190 240,198 280,205 320,210" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="320" cy="70" r="5" fill="#3E1CFF" />
                <circle cx="320" cy="70" r="8" fill="none" stroke="#3E1CFF" strokeWidth="1" opacity="0.4" />
                <rect x="290" y="42" width="44" height="20" rx="4" fill="rgba(62,28,255,0.2)" stroke="rgba(62,28,255,0.4)" strokeWidth="0.5" />
                <text x="312" y="56" fill="#FFF" fontSize="11" textAnchor="middle" fontFamily="Space Mono,monospace" fontWeight="700">63%</text>
                <circle cx="80" cy="260" r="4" fill="#3E1CFF" /><text x="92" y="264" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="DM Sans,sans-serif">Tu marca</text>
                <circle cx="170" cy="260" r="4" fill="rgba(255,255,255,0.2)" /><text x="182" y="264" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="DM Sans,sans-serif">Sector</text>
                <circle cx="240" cy="260" r="4" fill="rgba(255,255,255,0.1)" /><text x="252" y="264" fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="DM Sans,sans-serif">Competidor</text>
              </svg>
              <div className="dashboard-float">
                <div className="dash-header">
                  <div className="dash-title">Score NarraNoise</div>
                  <div className="dash-score">63<span>%</span></div>
                </div>
                <div className="dash-bars">
                  <div className="dash-bar"><div className="dash-bar-label">Atención</div><div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: '71%' }}></div></div><div className="dash-bar-val">71%</div></div>
                  <div className="dash-bar"><div className="dash-bar-label">Credibilidad</div><div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: '58%' }}></div></div><div className="dash-bar-val">58%</div></div>
                  <div className="dash-bar"><div className="dash-bar-label">Inmersión</div><div className="dash-bar-track"><div className="dash-bar-fill" style={{ width: '60%' }}></div></div><div className="dash-bar-val">60%</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMBOS */}
      <section className="combos-section" id="combos">
        <div className="container">
          <div className="combos-header">
            <div className="dots">•••</div>
            <h2>Una medición.<br />Dos caminos para tu desafío.</h2>
            <p>NarraNoise® se combina con dos soluciones según tu perfil, sector y necesidades.</p>
          </div>
          <div className="cards-container">
            {/* NarraAsist Card */}
            <div className="service-card">
              <div className="card-badge">Políticos • Figuras • Startups</div>
              <div style={{ width: '100%', height: 380, position: 'relative', overflow: 'hidden', background: '#3E1CFF' }}>
                <div style={{ position: 'absolute', top: 16, left: 16, right: 16, bottom: 16, background: 'rgba(20,8,80,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, overflow: 'hidden', zIndex: 1 }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.7)' }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>NARRAASIST</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.35)' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.45)' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', height: 'calc(100% - 32px)' }}>
                    <div style={{ width: '50%', padding: 16, borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>NARRAASIST — Score Global</div>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 56, fontWeight: 900, color: 'rgba(255,255,255,0.9)', lineHeight: 1, marginBottom: 12 }}>78<span style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>%</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40, marginBottom: 'auto' }}>
                        {[35, 50, 42, 65, 58, 78, 92, 100].map((h, i) => <div key={i} style={{ flex: 1, background: `rgba(255,255,255,${0.1 + i * 0.065})`, borderRadius: '2px 2px 0 0', height: `${h}%` }} />)}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Credibilidad</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 900, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>84<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>%</span></div>
                        </div>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Inmersión</div>
                          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 24, fontWeight: 900, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>71<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>%</span></div>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Chat Activo</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>¿Cómo evolucionó la credibilidad esta semana?</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderLeft: '3px solid rgba(255,255,255,0.4)', borderRadius: '4px 8px 8px 4px', padding: '10px 12px' }}>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Subió 3.2 pts vs. semana anterior. El driver fue el eje de cercanía...</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px' }}>
                          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Compará con el competidor principal</span>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', marginTop: 8 }}>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Preguntale a tus datos...</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 1.5px 1.5px,rgba(255,255,255,0.12) 1px,transparent 1px)', backgroundSize: '5px 5px', pointerEvents: 'none', zIndex: 3 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(62,28,255,0.15) 0%,rgba(62,28,255,0.05) 50%,rgba(62,28,255,0.2) 100%)', mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 4 }} />
              </div>
              <div className="card-body">
                <div className="card-title">NarraNoise® + NarraAsist</div>
                <div className="card-divider" />
                <div className="card-description">Combiná tus métricas de comunicación con nuestro asistente de narrativa IA. Consultá tendencias, conocé la performance de tu competencia y convertí nuestros insights en contenidos accionables, 24/7.</div>
                <div className="card-meta">• Chat con tus datos en tiempo real<br />• Monitoreo de competencia<br />• Insights a contenido en un click<br />• Planes NarraAsist mensuales</div>
                <button className="card-cta" onClick={() => handleOpenPanel('narraasist')}>Ver planes →</button>
              </div>
            </div>

            {/* Workshop Card */}
            <div className="service-card">
              <div className="card-badge">Comercial • Ventas • Liderazgo</div>
              <div style={{ width: '100%', height: 380, position: 'relative', overflow: 'hidden', background: '#0A0A0A' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a0a 0%, #222 60%, #3E1CFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                    <rect x="2" y="3" width="20" height="18" rx="2" stroke="white" strokeWidth="1.5" />
                    <line x1="2" y1="8" x2="22" y2="8" stroke="white" strokeWidth="1.5" />
                    <circle cx="12" cy="15" r="2" stroke="white" strokeWidth="1.5" />
                  </svg>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 1.5px 1.5px,rgba(255,255,255,0.08) 1px,transparent 1px)', backgroundSize: '5px 5px', pointerEvents: 'none', zIndex: 2 }} />
              </div>
              <div className="card-body">
                <div className="card-title">NarraNoise® + Workshops</div>
                <div className="card-divider" />
                <div className="card-description">Medimos técnicamente cómo comunica y vende tu equipo, y diseñamos workshops para mejorar su performance. Desde cápsulas ágiles hasta programas completos para desafíos comerciales agresivos.</div>
                <div className="card-meta">• Diagnóstico de comunicación del equipo<br />• Cápsulas de 2 horas o programas de 6 módulos<br />• Entrenamiento con métricas reales<br />• Materiales y seguimiento personalizado</div>
                <button className="card-cta" onClick={() => handleOpenPanel('workshop')}>Cotizar workshop →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REPORTES E INSIGHTS */}
      <section className="reportes-section">
        <div className="container">
          <div className="reportes-header">
            <div className="label" style={{ color: '#3E1CFF' }}>Insights semanales</div>
            <div className="dots" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.15)' }}>•••</div>
            <h2>Cada semana, un nuevo dato sobre<br />quiénes lideran la comunicación.</h2>
            <p>Publicamos análisis y reportes con métricas originales sobre política, liderazgo y comunicación. Gratis, todas las semanas.</p>
          </div>

          <div className="reportes-tabs">
            {TABS.map(tab => (
              <div key={tab} className={`reportes-tab${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>{TAB_LABELS[tab]}</div>
            ))}
          </div>

          <div className="tab-content active">
            <div className="reports-featured">
              <a href="#" className="report-hero" style={tabData.heroStyle}>
                <div className="report-hero-overlay" />
                {tabData.heroViz}
                <div className="report-hero-content">
                  <div className="report-hero-tag">{tabData.heroTag}</div>
                  <div className="report-hero-title">{tabData.heroTitle}</div>
                  <div className="report-hero-desc">{tabData.heroDesc}</div>
                  <div className="report-hero-footer">
                    <div className="report-hero-meta">{tabData.heroMeta}</div>
                    <div className="report-hero-cta">{tabData.heroCta}</div>
                  </div>
                </div>
              </a>
              <div className="reports-sidebar">
                {tabData.sidebar.map((item, i) => (
                  <div key={i} className="report-list-item">
                    <div className="report-list-num">{String(i + 1).padStart(2, '0')}</div>
                    <div className="report-list-body">
                      <div className="report-list-tag">{item.tag}</div>
                      <div className="report-list-title">{item.title}</div>
                      <div className="report-list-meta">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom viz cards */}
          <div className="reports-bottom-row" style={{ marginTop: 40 }}>
            <a href="#" className="report-viz-card">
              <div className="report-viz-top">
                {[35, 50, 42, 68, 55, 80, 72, 95, 88, 100].map((h, i) => <div key={i} className="report-viz-bar" style={{ background: '#3E1CFF', height: `${h}%` }} />)}
              </div>
              <div className="report-viz-body">
                <div className="report-viz-tag">Tendencia semanal</div>
                <div className="report-viz-title">Índice de Credibilidad: Top 5 líderes Latam</div>
                <div className="report-viz-meta">Entregable: Ranking PDF semanal + dashboard NarraAsist</div>
              </div>
            </a>
            <a href="#" className="report-viz-card">
              <div className="report-viz-top" style={{ padding: '12px 16px' }}>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[{ n: 'Energía', g: 72 }, { n: 'Minería', g: 45 }, { n: 'Agro', g: 65 }, { n: 'Finanzas', g: 58 }, { n: 'Tech', g: 80 }].map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: 'rgba(255,255,255,0.4)', minWidth: 50 }}>{d.n}</span>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${d.g}%`, background: '#22c55e', borderRadius: 3 }} /></div>
                      <div style={{ height: 5, width: `${100 - d.g}%`, background: '#ef4444', borderRadius: 3, marginLeft: -1 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="report-viz-body">
                <div className="report-viz-tag">Comparativa sectorial</div>
                <div className="report-viz-title">Narrativa positiva vs. negativa: Energía, Minería, Agro, Finanzas, Tech</div>
                <div className="report-viz-meta">Entregable: Informe trimestral por sector + benchmarks</div>
              </div>
            </a>
            <a href="#" className="report-viz-card">
              <div className="report-viz-top" style={{ padding: '12px 16px', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  {[{ v: '73%', l: 'LATAM', c: '#3E1CFF' }, { v: '68%', l: 'EUROPA', c: 'rgba(255,255,255,0.4)' }, { v: '71%', l: 'EEUU', c: 'rgba(255,255,255,0.3)' }].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 28, fontWeight: 900, color: d.c, lineHeight: 1 }}>{d.v}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{d.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="report-viz-body">
                <div className="report-viz-tag">Benchmark global</div>
                <div className="report-viz-title">Score NarraNoise® promedio: LATAM vs. Europa vs. EEUU</div>
                <div className="report-viz-meta">Entregable: Benchmark mensual de 12 industrias × 4 regiones</div>
              </div>
            </a>
          </div>

          {/* Press */}
          <div className="press-headline" style={{ marginTop: 64, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 48 }}>
            <div className="label" style={{ color: 'rgba(255,255,255,0.35)' }}>Nuestros datos son publicados en</div>
          </div>
          <div className="press-logos">
            {['CNN', 'Forbes', 'Univision', 'TVE', 'Infobae', 'TN', 'La Nación', 'Clarín'].map(n => <div key={n} className="press-logo">{n}</div>)}
          </div>
          <div className="wa-row">
            <a href="https://wa.me/5491130731011?text=Quiero%20suscribirme%20al%20canal%20de%20insights" className="wa-btn" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.704-1.228A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.153 0-4.148-.67-5.79-1.812l-.405-.277-3.093.808.85-3.004-.293-.428A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
              Suscribite al canal de WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* CTA CLOSE */}
      <section className="cta-close" id="cta-close">
        <div className="container">
          <div className="dots" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>•••</div>
          <h2>Tu narrativa puede más.</h2>
          <p>Y tenemos los datos para probarlo.</p>
          <div className="cta-group" style={{ justifyContent: 'center' }}>
            <a href="#combos" className="cta-pill white">Medir mi narrativa</a>
            <button className="cta-pill outline-white" onClick={() => handleOpenPanel('workshop')}>Cotizar workshop</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Producto</h3>
              <ul>
                <li><a href="#narranoise">NarraNoise®</a></li>
                <li><a href="https://narra-assist.lovable.app/" target="_blank" rel="noopener noreferrer">NarraAsist</a></li>
                <li><button style={{ background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }} onClick={() => handleOpenPanel('workshop')}>Workshops</button></li>
                <li><a href="#cta-close">Reportes</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Empresa</h3>
              <ul>
                <li><a href="#">Sobre nosotros</a></li>
                <li><a href="#">Equipo</a></li>
                <li><a href="mailto:lisandro@narraglobal.com">Contacto</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Legal</h3>
              <ul>
                <li><a href="#">Términos de Servicio</a></li>
                <li><a href="#">Privacidad</a></li>
                <li><a href="#">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>
              <div className="footer-logo">NarraGlobal</div>
              <div className="footer-tagline">Desde 2012</div>
            </div>
            <div className="footer-credit">© 2025 NarraGlobal. Todos los derechos reservados.</div>
          </div>
        </div>
      </footer>

      {/* SLIDE-OUT PANELS */}
      <div className={`slide-panel-overlay${openPanel ? ' active' : ''}`} onClick={closePanel} />

      {/* NarraAsist Panel */}
      <div className={`slide-panel${openPanel === 'narraasist' ? ' active' : ''}`}>
        <div className="slide-panel-header">
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E1CFF', marginBottom: 4 }}>NarraNoise® + NarraAsist</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Elegí tu plan</div>
          </div>
          <button className="slide-panel-close" onClick={closePanel}>✕</button>
        </div>
        <div className="slide-panel-body">
          {formSuccess.narraasist ? (
            <div className="panel-success"><h3>Consulta enviada</h3><p>Te contactamos en menos de 24 hs.</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {[
                  { name: 'Starter', price: 'USD 490/mes', desc: '1 medición NarraNoise® mensual + acceso básico a NarraAsist (50 consultas/mes). Ideal para figuras públicas y startups.', popular: false },
                  { name: 'Professional', price: 'USD 990/mes', desc: '2 mediciones NarraNoise® + NarraAsist ilimitado + monitoreo de competencia + reportes semanales automáticos. Para equipos de comunicación.', popular: true },
                  { name: 'Enterprise', price: 'A medida', desc: 'Mediciones ilimitadas + NarraAsist dedicado + benchmarks sectoriales + workshops incluidos + soporte estratégico. Para corporaciones y gobiernos.', popular: false },
                ].map(plan => (
                  <div key={plan.name} style={{
                    border: `2px solid ${plan.popular ? '#3E1CFF' : '#F0F0F0'}`,
                    borderRadius: 12, padding: 20, position: 'relative',
                    background: plan.popular ? 'rgba(62,28,255,0.02)' : 'transparent',
                    cursor: 'pointer', transition: 'border-color 0.3s',
                  }}>
                    {plan.popular && <div style={{ position: 'absolute', top: -10, right: 16, background: '#3E1CFF', color: '#FFF', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Popular</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#1A1A1A' }}>{plan.name}</span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: '#3E1CFF', fontWeight: 700 }}>{plan.price}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{plan.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 24, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A', marginBottom: 4 }}>¿Querés que te contactemos?</div>
                <div style={{ fontSize: 13, color: '#999' }}>Completá tus datos y te armamos una propuesta.</div>
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, 'narraasist')} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input name="nombre" type="text" placeholder="Nombre completo *" required className="panel-input" />
                <input name="organizacion" type="text" placeholder="Organización *" required className="panel-input" />
                <input name="email" type="email" placeholder="Email corporativo *" required className="panel-input" />
                <select name="plan" className="panel-select" defaultValue="">
                  <option value="" disabled>Plan de interés</option>
                  <option value="starter">Starter — USD 490/mes</option>
                  <option value="professional">Professional — USD 990/mes</option>
                  <option value="enterprise">Enterprise — A medida</option>
                </select>
                <button type="submit" className="panel-btn">Solicitar propuesta →</button>
                <div style={{ fontSize: 11, color: '#CCC', textAlign: 'center' }}>Te respondemos en menos de 24 hs.</div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Workshop Panel */}
      <div className={`slide-panel${openPanel === 'workshop' ? ' active' : ''}`}>
        <div className="slide-panel-header">
          <div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3E1CFF', marginBottom: 4 }}>NarraNoise® + Workshops</div>
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Cotizá tu workshop</div>
          </div>
          <button className="slide-panel-close" onClick={closePanel}>✕</button>
        </div>
        <div className="slide-panel-body">
          {formSuccess.workshop ? (
            <div className="panel-success"><h3>Consulta enviada</h3><p>Te contactamos en menos de 24 hs.</p></div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  { time: '2 HORAS', title: 'Cápsula intensiva', desc: 'Diagnóstico + ejercicio práctico con métricas reales' },
                  { time: '3 SESIONES', title: 'Serie de entrenamiento', desc: 'Medición + Mejoras aplicadas al objetivo de negocio + Demoday' },
                  { time: '6 MÓDULOS', title: 'Programa completo', desc: 'Transformación narrativa de todo el equipo. 100% alineado al objetivo de negocio' },
                ].map(f => (
                  <div key={f.time} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FAFAFA', borderRadius: 10 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#3E1CFF', fontWeight: 700, minWidth: 70 }}>{f.time}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: 24, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1A1A1A', marginBottom: 4 }}>Dejá tus datos</div>
                <div style={{ fontSize: 13, color: '#999' }}>Te enviamos una propuesta a medida en 24 hs.</div>
              </div>
              <form onSubmit={(e) => handleFormSubmit(e, 'workshop')} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input name="nombre" type="text" placeholder="Nombre *" required className="panel-input" />
                  <input name="organizacion" type="text" placeholder="Organización *" required className="panel-input" />
                </div>
                <input name="email" type="email" placeholder="Email corporativo *" required className="panel-input" />
                <select name="sector" className="panel-select" defaultValue="">
                  <option value="" disabled>Sector *</option>
                  <option value="politica">Política / Gobierno</option>
                  <option value="corporativo">Corporativo / Empresa</option>
                  <option value="energia">Energía / Minería / Agro</option>
                  <option value="finanzas">Finanzas / Banca</option>
                  <option value="tech">Tech / Startups</option>
                  <option value="deporte">Deporte / Entretenimiento</option>
                  <option value="otro">Otro</option>
                </select>
                <select name="formato" className="panel-select" defaultValue="">
                  <option value="" disabled>Formato preferido</option>
                  <option value="capsula">Cápsula 2 horas</option>
                  <option value="serie">Serie 3 sesiones</option>
                  <option value="programa">Programa 6 módulos</option>
                  <option value="nosé">No sé, quiero asesoramiento</option>
                </select>
                <textarea name="necesidad" placeholder="¿Cuál es el desafío de comunicación de tu equipo?" rows={3} className="panel-input" style={{ resize: 'vertical' }} />
                <button type="submit" className="panel-btn">Enviar consulta →</button>
                <div style={{ fontSize: 11, color: '#CCC', textAlign: 'center' }}>Sin compromiso. Respondemos en menos de 24 hs.</div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
