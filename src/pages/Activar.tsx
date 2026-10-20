import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AVISO_TELEFONO, guardarPedido, numeroPedido, telefonoValido, unir } from '@/lib/pedidos';
import { MP_NARRA_ID, PAYPAL_NARRA_ID, waLisandro } from '@/lib/enlaces';
import '@/styles/posicion.css';

/* Activar el Narra ID, en dos pasos: primero los datos (quién, la cuenta que
   medimos y el correo del alta), que quedan guardados como pedido; después
   cómo paga. Los tres medios son links fijos —Mercado Pago, PayPal o efectivo
   por WhatsApp—, así que el pago se cruza a mano con el número de pedido y se
   marca en el back office. La rama llega del switch del hero (?rama=). */

type Rama = 'politica' | 'negocios';

const QUIEN = ['El propio · soy yo', 'Jefe o jefa de prensa', 'Asesor o consultora externa', 'Alguien del equipo'];

const VACIO = { nombre: '', mail: '', wsp: '', cuenta: '', quien: '', hp: '' };
type Campos = typeof VACIO;

const Activar = () => {
  const [params, setParams] = useSearchParams();
  const rama: Rama = params.get('rama') === 'negocios' ? 'negocios' : 'politica';
  const cambiarRama = (r: Rama) => setParams({ rama: r }, { replace: true });

  const [f, setF] = useState<Campos>(VACIO);
  const [enviando, setEnviando] = useState(false);
  // fallo=true es la base que no tomó el pedido: ahí se ofrece WhatsApp
  const [error, setError] = useState<{ texto: string; fallo: boolean } | null>(null);
  const [pedido, setPedido] = useState<string | null>(null);

  const set = (k: keyof Campos) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pedido]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!telefonoValido(f.wsp)) {
      setError({ texto: AVISO_TELEFONO, fallo: false });
      return;
    }
    setEnviando(true);
    setError(null);
    const r = await guardarPedido({
      tipo: 'narra_id',
      telefono: f.wsp,
      email: f.mail,
      datos: { nombre: f.nombre.trim(), cuenta: f.cuenta.trim(), rama, quien: f.quien },
      honeypot: f.hp,
    });
    setEnviando(false);
    if ('error' in r) {
      setError({ texto: 'No pudimos guardar tu pedido: ' + r.error + '.', fallo: true });
      return;
    }
    setPedido(numeroPedido(r.id));
  };

  const waFallback = waLisandro(
    'Hola, quiero activar mi Narra ID (' + (rama === 'politica' ? 'política' : 'negocios') + '). ' +
      unir(f.nombre, f.cuenta, f.mail) + '.',
  );
  const waEfectivo = waLisandro(
    'Hola, quiero activar mi Narra ID. Pedido ' + (pedido ?? '') + '. Pago en efectivo.',
  );

  return (
    <div className="pos-wrap">
      <div className="pos-top">
        <div className="in">
          <Link className="pos-volver" to="/">← Volver a la home</Link>
          <Link to="/"><img className="wm-img" src="/land/wm-tinta.svg" alt="narraglobal" /></Link>
          <span className="cupo"><i />Narra ID · USD 1,000 / mes</span>
        </div>
      </div>

      <div className="pos-hoja">
        <div className="pos-pasos">
          <span className={'pos-pt' + (pedido ? ' ok' : ' on')}><b>1</b><span>Tus datos</span></span>
          <span className="pos-linea" />
          <span className={'pos-pt' + (pedido ? ' on' : '')}><b>2</b><span>Cómo pagás</span></span>
        </div>

        {pedido ? (
          <section className="pos-tarjeta">
            <span className="pos-eyebrow">Narra ID · pedido {pedido}</span>
            <div className="pos-preg">¿Cómo pagás?</div>
            <p className="pos-sub">
              USD 1,000 por mes, IVA incluido. Pagá con tu correo, <b>{f.mail.trim()}</b>, y si el medio
              te deja una nota, poné <b>{pedido}</b>: así cruzamos tu pago con el pedido.
            </p>
            <div className="pos-medios">
              <a className="pos-medio" href={MP_NARRA_ID} target="_blank" rel="noopener noreferrer">
                <b>Mercado Pago</b>
                <span>En pesos. Suscribite y congelás tu precio: se debita cada mes.</span>
              </a>
              <a className="pos-medio" href={PAYPAL_NARRA_ID} target="_blank" rel="noopener noreferrer">
                <b>PayPal</b>
                <span>USD 1,000, desde cualquier país.</span>
              </a>
              <a className="pos-medio" href={waEfectivo} target="_blank" rel="noopener noreferrer">
                <b>Efectivo</b>
                <span>Lo coordinamos por WhatsApp.</span>
              </a>
            </div>
            <div className="pos-pie">
              Cuando se acredita el pago te escribimos al {f.wsp.trim()} para el alta · cancelás cuando quieras
            </div>
          </section>
        ) : (
          <form className="pos-tarjeta" onSubmit={enviar}>
            <div className="pos-rama" role="group" aria-label="A quién medimos">
              <button type="button" className={'pos-rb' + (rama === 'politica' ? ' on' : '')} aria-pressed={rama === 'politica'} onClick={() => cambiarRama('politica')}>Política</button>
              <button type="button" className={'pos-rb' + (rama === 'negocios' ? ' on' : '')} aria-pressed={rama === 'negocios'} onClick={() => cambiarRama('negocios')}>Negocios</button>
            </div>
            <div className="pos-preg">Activá tu Narra ID</div>
            <p className="pos-sub">
              USD 1,000 por mes, IVA incluido. Se renueva cada mes y cancelás cuando quieras.
              <b> Con tu correo te damos de alta en el tablero</b>; a quiénes mirar de cerca lo elegís después, en el alta.
            </p>
            <div className="pos-campos">
              <div className="pos-fila">
                <div className="pos-campo">
                  <label htmlFor="ac-nombre">Tu nombre</label>
                  <input id="ac-nombre" type="text" placeholder="Nombre y apellido" value={f.nombre} onChange={set('nombre')} required />
                </div>
                <div className="pos-campo">
                  <label htmlFor="ac-mail">Tu correo · tu acceso al tablero</label>
                  <input id="ac-mail" type="email" placeholder="vos@tuorganizacion.com" value={f.mail} onChange={set('mail')} required />
                </div>
              </div>
              <div className="pos-fila">
                <div className="pos-campo">
                  <label htmlFor="ac-cuenta">{rama === 'politica' ? 'La cuenta que medimos' : 'La empresa o marca que medimos'}</label>
                  <input id="ac-cuenta" type="text" placeholder="@cuenta o link" value={f.cuenta} onChange={set('cuenta')} required />
                </div>
                <div className="pos-campo">
                  <label htmlFor="ac-wsp">WhatsApp</label>
                  <input id="ac-wsp" type="tel" placeholder="+54 9 341 …" value={f.wsp} onChange={set('wsp')} required />
                </div>
              </div>
              <div className="pos-fila">
                <div className="pos-campo">
                  <label htmlFor="ac-quien">¿Quién lo activa?</label>
                  <select id="ac-quien" value={f.quien} onChange={set('quien')}>
                    <option value="">Elegí una</option>
                    {QUIEN.map((q) => <option key={q}>{q}</option>)}
                  </select>
                </div>
              </div>
              <input className="pos-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.hp} onChange={set('hp')} />
            </div>

            {error && (
              <div className="pos-error" role="alert">
                {error.texto}
                {error.fallo && (
                  <> Probá de nuevo o <a href={waFallback} target="_blank" rel="noopener noreferrer">escribinos por WhatsApp</a> y lo activamos igual.</>
                )}
              </div>
            )}

            <div className="pos-acciones">
              <Link className="pos-btn t" to="/">← Volver</Link>
              <button className="pos-btn p" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Elegir cómo pago →'}</button>
            </div>
            <div className="pos-pie">USD 1,000 / mes · IVA incluido · cancelás cuando quieras</div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Activar;
