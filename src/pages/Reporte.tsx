import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { enviarPedido, telefonoValido, unir } from '@/lib/pedidos';
import { waNarra } from '@/lib/enlaces';
import '@/styles/posicion.css';

/* El reporte NarraNoise® Santa Fe 2026, sin cargo: una tarjeta, cuatro
   campos, y el equipo lo manda por WhatsApp. */

const ROLES = ['Figura pública', 'Jefe o jefa de prensa', 'Asesor o consultora', 'Periodista', 'Empresa u organización', 'Otro'];

const VACIO = { nombre: '', mail: '', wsp: '', rol: '', hp: '' };
type Campos = typeof VACIO;

const Reporte = () => {
  const [f, setF] = useState<Campos>(VACIO);
  const [enviando, setEnviando] = useState(false);
  // fallo=true es la base que no tomó el pedido: ahí se ofrece WhatsApp
  const [error, setError] = useState<{ texto: string; fallo: boolean } | null>(null);
  const [listo, setListo] = useState(false);

  const set = (k: keyof Campos) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [listo]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!telefonoValido(f.wsp)) {
      setError({ texto: 'El WhatsApp necesita el código de país y el número completo: +54 9 341 …', fallo: false });
      return;
    }
    setEnviando(true);
    setError(null);
    const err = await enviarPedido({
      tipo: 'reporte',
      telefono: f.wsp,
      email: f.mail,
      datos: { nombre: f.nombre.trim(), rol: f.rol },
      honeypot: f.hp,
    });
    setEnviando(false);
    if (err) {
      setError({ texto: 'No pudimos guardar tu pedido: ' + err + '.', fallo: true });
      return;
    }
    setListo(true);
  };

  const waFallback = waNarra(
    'Hola, quiero el reporte Narrativa Santa Fe 2026. ' + unir(f.nombre, f.rol, f.mail) + '.',
  );

  return (
    <div className="pos-wrap">
      <div className="pos-top">
        <div className="in">
          <Link className="pos-volver" to="/">← Volver a la home</Link>
          <Link to="/"><img className="wm-img" src="/land/wm-tinta.svg" alt="narraglobal" /></Link>
          <span className="cupo"><i />Reporte 2026 · sin cargo</span>
        </div>
      </div>

      <div className="pos-hoja">
        {listo ? (
          <section className="pos-tarjeta">
            <span className="pos-eyebrow">Reporte NarraNoise® · Santa Fe 2026</span>
            <div className="pos-ok-h"><span className="pos-ok-i" /><h2>¡Listo!</h2></div>
            <p className="pos-sub">Te mandamos el reporte por WhatsApp al <b>{f.wsp.trim()}</b>, sin cargo. Un correo, un reporte: no mandamos nada más.</p>
            <div className="pos-resumen">
              <div className="pos-rr"><span className="rk">Nombre</span><span className="rv">{f.nombre.trim() || '—'}</span></div>
              <div className="pos-rr"><span className="rk">Llega por WhatsApp</span><span className="rv">{f.wsp.trim()}</span></div>
              <div className="pos-rr"><span className="rk">Correo</span><span className="rv">{f.mail.trim() || '—'}</span></div>
              <div className="pos-rr"><span className="rk">Quién sos</span><span className="rv">{f.rol || '—'}</span></div>
            </div>
            <div className="pos-acciones">
              <Link className="pos-btn p" to="/">← Volver a narraglobal</Link>
            </div>
          </section>
        ) : (
          <form className="pos-tarjeta" onSubmit={enviar}>
            <span className="pos-eyebrow">Reporte NarraNoise® · Santa Fe 2026</span>
            <div className="pos-preg">¿A dónde te mandamos el reporte?</div>
            <div className="pos-campos">
              <div className="pos-fila">
                <div className="pos-campo">
                  <label htmlFor="rp-nombre">Tu nombre</label>
                  <input id="rp-nombre" type="text" placeholder="Nombre y apellido" value={f.nombre} onChange={set('nombre')} />
                </div>
                <div className="pos-campo">
                  <label htmlFor="rp-mail">Tu correo</label>
                  <input id="rp-mail" type="email" placeholder="vos@tuorganizacion.com" value={f.mail} onChange={set('mail')} />
                </div>
              </div>
              <div className="pos-fila">
                <div className="pos-campo">
                  <label htmlFor="rp-wsp">WhatsApp · ahí te llega el informe</label>
                  <input id="rp-wsp" type="tel" placeholder="+54 9 341 …" value={f.wsp} onChange={set('wsp')} required />
                </div>
                <div className="pos-campo">
                  <label htmlFor="rp-rol">Quién sos</label>
                  <select id="rp-rol" value={f.rol} onChange={set('rol')}>
                    <option value="">Elegí una</option>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <input className="pos-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={set('hp')} />
            </div>

            {error && (
              <div className="pos-error" role="alert">
                {error.texto}
                {error.fallo && (
                  <> Probá de nuevo o <a href={waFallback} target="_blank" rel="noopener noreferrer">pedilo por WhatsApp</a> y te lo mandamos igual.</>
                )}
              </div>
            )}

            <div className="pos-acciones">
              <Link className="pos-btn t" to="/">← Volver</Link>
              <button className="pos-btn p" type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Quiero el reporte →'}</button>
            </div>
            <div className="pos-pie">Sin cargo · un correo, un reporte · no mandamos nada más</div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Reporte;
