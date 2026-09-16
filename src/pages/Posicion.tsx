import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAISES, enviarPedido, telefonoValido, unir } from '@/lib/pedidos';
import { waNarra } from '@/lib/enlaces';
import '@/styles/posicion.css';

/* La demo sin cargo del Narra ID, en dos pasos: primero el elenco (territorio
   si es política, vertical si es negocios), después el contacto. La rama sale
   de la URL (?tipo=persona|empresa) para que el switch del hero llegue acá ya
   elegido, y se puede cambiar arriba de la tarjeta. */

type Rama = 'persona' | 'empresa';
type Paso = 1 | 2 | 3;

const QUIEN = ['El propio · soy yo', 'Jefe o jefa de prensa', 'Asesor o consultora externa', 'Alguien del equipo'];
const SECTORES = ['Energía', 'Ciencia, farma y salud', 'Agro', 'Bancos y fintech', 'Consumo masivo'];
const SECTOR_OTRO = 'Otro — decinos cuál';

const VACIO = {
  pais: 'Argentina',
  // política
  prov: '',
  ciudad: '',
  cargo: '',
  // negocios
  sector: '',
  sectorOtro: '',
  empresa: '',
  cuentasEmp: '',
  // contacto
  cuenta: '',
  wsp: '',
  mail: '',
  quien: '',
  hp: '',
};
type Campos = typeof VACIO;

const Posicion = () => {
  const [params, setParams] = useSearchParams();
  const rama: Rama = params.get('tipo') === 'empresa' ? 'empresa' : 'persona';
  const cambiarRama = (r: Rama) => setParams({ tipo: r }, { replace: true });

  const [paso, setPaso] = useState<Paso>(1);
  const [f, setF] = useState<Campos>(VACIO);
  const [enviando, setEnviando] = useState(false);
  // fallo=true es la base que no tomó el pedido: ahí se ofrece WhatsApp
  const [error, setError] = useState<{ texto: string; fallo: boolean } | null>(null);

  const set = (k: keyof Campos) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  // cada paso arranca arriba, como una pantalla nueva
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [paso]);

  const sector = f.sector === SECTOR_OTRO ? f.sectorOtro.trim() || 'Otro' : f.sector;

  const siguiente = (e: FormEvent) => {
    e.preventDefault();
    setPaso(2);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!telefonoValido(f.wsp)) {
      setError({ texto: 'El WhatsApp necesita el código de país y el número completo: +54 9 341 …', fallo: false });
      return;
    }
    setEnviando(true);
    setError(null);
    const datos =
      rama === 'persona'
        ? { pais: f.pais, provincia: f.prov.trim(), ciudad: f.ciudad.trim(), cargo: f.cargo.trim(), cuenta: f.cuenta.trim(), quien: f.quien }
        : { pais: f.pais, sector, empresa: f.empresa.trim(), cuentas: f.cuentasEmp.trim(), quien: f.quien };
    const err = await enviarPedido({
      tipo: rama === 'persona' ? 'demo_persona' : 'demo_empresa',
      telefono: f.wsp,
      email: f.mail,
      datos,
      honeypot: f.hp,
    });
    setEnviando(false);
    if (err) {
      setError({ texto: 'No pudimos guardar tu pedido: ' + err + '.', fallo: true });
      return;
    }
    setPaso(3);
  };

  // Si la base no contestó, que el pedido llegue igual: por WhatsApp, ya tipeado.
  const waFallback = waNarra(
    'Hola, quiero mi demo del Narra ID. ' +
      (rama === 'persona'
        ? unir(f.cuenta, f.cargo, f.ciudad, f.prov, f.pais)
        : unir(f.empresa, sector, f.pais, f.cuentasEmp)) +
      '. Mi correo: ' + f.mail.trim(),
  );

  const listas = rama === 'persona' ? unir(f.ciudad, f.prov, f.pais) : unir(sector, f.pais);

  return (
    <div className="pos-wrap">
      <div className="pos-top">
        <div className="in">
          <Link className="pos-volver" to="/">← Volver a la home</Link>
          <Link to="/"><img className="wm-img" src="/land/wm-tinta.svg" alt="narraglobal" /></Link>
          <span className="cupo"><i />Demo · sin cargo</span>
        </div>
      </div>

      <div className="pos-hoja">
        <div className="pos-pasos">
          <span className={'pos-pt' + (paso === 1 ? ' on' : ' ok')}><b>1</b><span>Ya casi estamos</span></span>
          <span className="pos-linea" />
          <span className={'pos-pt' + (paso === 2 ? ' on' : paso === 3 ? ' ok' : '')}><b>2</b><span>¡Listo!</span></span>
        </div>

        {/* ===== paso 1 · el elenco ===== */}
        {paso === 1 && (
          <form className="pos-tarjeta" onSubmit={siguiente}>
            <div className="pos-rama" role="group" aria-label="A quién medimos">
              <button type="button" className={'pos-rb' + (rama === 'persona' ? ' on' : '')} aria-pressed={rama === 'persona'} onClick={() => cambiarRama('persona')}>Política</button>
              <button type="button" className={'pos-rb' + (rama === 'empresa' ? ' on' : '')} aria-pressed={rama === 'empresa'} onClick={() => cambiarRama('empresa')}>Negocios</button>
            </div>

            {rama === 'persona' ? (
              <>
                <div className="pos-preg">Tu territorio</div>
                <p className="pos-sub">Primero el país, después tu provincia y tu ciudad. <b>Se fijan al alta y no se cambian:</b> si la lista se mueve cada semana, el puesto no significa nada.</p>
                <div className="pos-campos">
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="pais">País</label>
                      <select id="pais" value={f.pais} onChange={set('pais')}>
                        {PAISES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="prov">Provincia · tu cancha electoral</label>
                      <input id="prov" type="text" placeholder="Santa Fe, Córdoba, Buenos Aires…" value={f.prov} onChange={set('prov')} required />
                    </div>
                  </div>
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="ciudad">Ciudad · tu municipio</label>
                      <input id="ciudad" type="text" placeholder="Rosario, Paraná, Salta…" value={f.ciudad} onChange={set('ciudad')} required />
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="cargo">Cargo o candidatura declarada</label>
                      <input id="cargo" type="text" placeholder="Concejala, senador, intendente…" value={f.cargo} onChange={set('cargo')} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="pos-preg">Tu vertical</div>
                <p className="pos-sub">El elenco es tu sector en tu país. <b>Se fija al alta y se revisa cada trimestre</b>, igual que el resto.</p>
                <div className="pos-campos">
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="pais">País</label>
                      <select id="pais" value={f.pais} onChange={set('pais')}>
                        {PAISES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="sector">Sector</label>
                      <select id="sector" value={f.sector} onChange={set('sector')} required>
                        <option value="">Elegí tu sector</option>
                        {SECTORES.map((s) => <option key={s}>{s}</option>)}
                        <option>{SECTOR_OTRO}</option>
                      </select>
                    </div>
                  </div>
                  {f.sector === SECTOR_OTRO && (
                    <div className="pos-campo">
                      <label htmlFor="sectorOtro">¿Cuál?</label>
                      <input id="sectorOtro" type="text" placeholder="Tu sector" value={f.sectorOtro} onChange={set('sectorOtro')} autoFocus />
                    </div>
                  )}
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="empresa">Empresa</label>
                      <input id="empresa" type="text" placeholder="Razón social o marca" value={f.empresa} onChange={set('empresa')} required />
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="cuentasEmp">Cuentas que se miden · marca y vocería</label>
                      <input id="cuentasEmp" type="text" placeholder="@lamarca, @elCEO, @ladirectora" value={f.cuentasEmp} onChange={set('cuentasEmp')} required />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pos-acciones">
              <Link className="pos-btn t" to="/">← Volver</Link>
              <button className="pos-btn p" type="submit">Siguiente →</button>
              <span className="nota">Dos preguntas · menos de un minuto</span>
            </div>
          </form>
        )}

        {/* ===== paso 2 · el contacto ===== */}
        {paso === 2 && (
          <form className="pos-tarjeta" onSubmit={enviar}>
            <div className="pos-preg">¿Con qué cuenta?</div>
            <p className="pos-sub">Medimos una cuenta, no una persona. Si la piden el jefe de prensa, el asesor y vos, la demo es la misma, con la misma fecha. <b>Te llega por WhatsApp</b> —por ahí también hablás con el asistente— y <b>con tu correo te damos de alta en el tablero</b>.</p>
            <div className="pos-campos">
              <div className="pos-fila">
                {/* en negocios las cuentas ya vinieron en el paso 1 */}
                {rama === 'persona' && (
                  <div className="pos-campo">
                    <label htmlFor="cuenta">Tu cuenta · X o Instagram</label>
                    <input id="cuenta" type="text" placeholder="@tucuenta" value={f.cuenta} onChange={set('cuenta')} required autoFocus />
                  </div>
                )}
                <div className="pos-campo">
                  <label htmlFor="wsp">WhatsApp · ahí te llega la demo</label>
                  <input id="wsp" type="tel" placeholder="+54 9 341 …" value={f.wsp} onChange={set('wsp')} required autoFocus={rama === 'empresa'} />
                </div>
              </div>
              <div className="pos-campo">
                <label htmlFor="mail">Tu correo · con este te damos de alta en el tablero</label>
                <input id="mail" type="email" placeholder="vos@tuorganizacion.com" value={f.mail} onChange={set('mail')} required />
              </div>
              <div className="pos-campo">
                <label htmlFor="quien">Quién completa esto</label>
                <select id="quien" value={f.quien} onChange={set('quien')}>
                  <option value="">Elegí una</option>
                  {QUIEN.map((q) => <option key={q}>{q}</option>)}
                </select>
              </div>
              <input className="pos-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={set('hp')} />
            </div>

            {error && (
              <div className="pos-error" role="alert">
                {error.texto}
                {error.fallo && (
                  <> Probá de nuevo o <a href={waFallback} target="_blank" rel="noopener noreferrer">mandanos el pedido por WhatsApp</a> y lo cargamos nosotros.</>
                )}
              </div>
            )}

            <div className="pos-acciones">
              <button className="pos-btn t" type="button" onClick={() => setPaso(1)}>← Atrás</button>
              <button className="pos-btn p" type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Quiero mi demo →'}</button>
            </div>
            <div className="pos-pie">No pedimos tarjeta ni acceso a tus cuentas: medimos lo que ya es público · la demo llega en 48 horas hábiles, sin cargo</div>
          </form>
        )}

        {/* ===== listo ===== */}
        {paso === 3 && (
          <section className="pos-tarjeta">
            <div className="pos-ok-h"><span className="pos-ok-i" /><h2>¡Listo!</h2></div>
            <p className="pos-sub">En 48 horas hábiles, sin cargo, te la mandamos por WhatsApp al <b>{f.wsp.trim()}</b>, con tu puesto en cada ranking, qué de lo tuyo funciona y cómo está tu calidad narrativa e influencia a tus públicos. Por ese mismo número vas a poder hablar con nuestro asistente IA y comenzar a editar tu narrativa. Y al correo <b>{f.mail.trim()}</b> te llegará el alta del tablero para mejorar tu experiencia de visualización.</p>
            <div className="pos-resumen">
              {rama === 'persona' ? (
                <>
                  <div className="pos-rr"><span className="rk">Cuenta</span><span className="rv">{f.cuenta.trim()}</span></div>
                  <div className="pos-rr"><span className="rk">Tus listas</span><span className="rv">{listas}</span></div>
                </>
              ) : (
                <>
                  <div className="pos-rr"><span className="rk">Cuentas</span><span className="rv">{f.cuentasEmp.trim()}</span></div>
                  <div className="pos-rr"><span className="rk">Empresa</span><span className="rv">{f.empresa.trim()}</span></div>
                  <div className="pos-rr"><span className="rk">Tu lista</span><span className="rv">{listas}</span></div>
                </>
              )}
              <div className="pos-rr"><span className="rk">Lo pidió</span><span className="rv">{f.quien || '—'}</span></div>
              <div className="pos-rr"><span className="rk">Llega por WhatsApp</span><span className="rv">{f.wsp.trim()}</span></div>
              <div className="pos-rr"><span className="rk">Alta del tablero</span><span className="rv">{f.mail.trim()}</span></div>
            </div>
            <div className="pos-acciones">
              <Link className="pos-btn p" to="/">← Volver a narraglobal</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Posicion;
