import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AVISO_TELEFONO, guardarPedido, numeroPedido, telefonoValido, unir } from '@/lib/pedidos';
import { supabase } from '@/integrations/supabase/client';
import {
  MP_NARRA_ID,
  PAYPAL_CLIENT_ID,
  PAYPAL_LINK_NARRA_ID,
  PAYPAL_PLAN_NARRA_ID,
  waLisandro,
} from '@/lib/enlaces';
import '@/styles/posicion.css';

/* Activar el Narra ID, en dos pasos: primero los datos (quién, la cuenta que
   medimos y el correo del alta), que quedan guardados como pedido; después
   cómo paga: Mercado Pago (link fijo de la suscripción), PayPal (el botón de
   suscripción, que lleva el número de pedido) o efectivo por WhatsApp. El
   pago se cruza a mano con el número de pedido y se marca en el back office.
   La rama llega del switch del hero (?rama=). */

type Rama = 'politica' | 'negocios';

const QUIEN = ['El propio · soy yo', 'Jefe o jefa de prensa', 'Asesor o consultora externa', 'Alguien del equipo'];

const VACIO = { nombre: '', mail: '', wsp: '', cuenta: '', quien: '', hp: '' };
type Campos = typeof VACIO;

/* Lo justo del SDK de PayPal que usa el botón de suscripción. */
interface PayPalSdk {
  Buttons: (o: {
    style: Record<string, string>;
    createSubscription: (data: unknown, actions: { subscription: { create: (o: Record<string, string>) => Promise<string> } }) => Promise<string>;
    onApprove: (data: { subscriptionID?: string | null }) => void;
    onError: () => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
}
declare global {
  interface Window { paypal?: PayPalSdk }
}

const SDK_PAYPAL =
  'https://www.paypal.com/sdk/js?client-id=' + PAYPAL_CLIENT_ID + '&vault=true&intent=subscription';

/** Carga el SDK de PayPal una sola vez por página. */
let cargaPayPal: Promise<PayPalSdk> | null = null;
const cargarPayPal = () =>
  (cargaPayPal ??= new Promise<PayPalSdk>((ok, mal) => {
    if (window.paypal) return ok(window.paypal);
    const s = document.createElement('script');
    s.src = SDK_PAYPAL;
    s.setAttribute('data-sdk-integration-source', 'button-factory');
    s.onload = () => (window.paypal ? ok(window.paypal) : mal(new Error('sin paypal')));
    s.onerror = () => {
      cargaPayPal = null;
      mal(new Error('no cargó'));
    };
    document.head.appendChild(s);
  }));

/* El botón de suscripción de PayPal. Lleva el número de pedido en custom_id
   (así llega en el aviso de PayPal) y, al aprobarse, anota el id de la
   suscripción en el pedido. Si el SDK no carga, queda el link directo. */
const BotonPayPal = ({ pedidoId, numero, onListo }: { pedidoId: string; numero: string; onListo: (sub: string) => void }) => {
  const caja = useRef<HTMLDivElement>(null);
  const [falla, setFalla] = useState(false);

  useEffect(() => {
    let vivo = true;
    let botones: { close?: () => void } | null = null;
    cargarPayPal()
      .then((pp) => {
        if (!vivo || !caja.current) return;
        botones = pp.Buttons({
          style: { shape: 'rect', color: 'blue', layout: 'vertical', label: 'subscribe' },
          createSubscription: (_d, actions) =>
            actions.subscription.create({ plan_id: PAYPAL_PLAN_NARRA_ID, custom_id: numero }),
          onApprove: (data) => {
            const sub = data.subscriptionID ?? '';
            // anotarlo es ayuda para cruzar el pago: si falla, el pago igual entró
            if (sub) supabase.rpc('registrar_suscripcion_paypal', { p_pedido: pedidoId, p_suscripcion: sub }).then(() => undefined);
            onListo(sub);
          },
          onError: () => setFalla(true),
        });
        return (botones as { render: (el: HTMLElement) => Promise<void> }).render(caja.current);
      })
      .catch(() => vivo && setFalla(true));
    return () => {
      vivo = false;
      botones?.close?.();
    };
  }, [pedidoId, numero, onListo]);

  return (
    <div className="pos-paypal">
      <div ref={caja} />
      {falla && (
        <p className="pos-sub">
          El botón de PayPal no cargó. <a href={PAYPAL_LINK_NARRA_ID} target="_blank" rel="noopener noreferrer">Suscribite desde este link</a> y
          poné el pedido <b>{numero}</b> si te pide una nota.
        </p>
      )}
    </div>
  );
};

const Activar = () => {
  const [params, setParams] = useSearchParams();
  const rama: Rama = params.get('rama') === 'negocios' ? 'negocios' : 'politica';
  const cambiarRama = (r: Rama) => setParams({ rama: r }, { replace: true });

  const [f, setF] = useState<Campos>(VACIO);
  const [enviando, setEnviando] = useState(false);
  // fallo=true es la base que no tomó el pedido: ahí se ofrece WhatsApp
  const [error, setError] = useState<{ texto: string; fallo: boolean } | null>(null);
  const [pedido, setPedido] = useState<{ id: string; numero: string } | null>(null);
  const [verPayPal, setVerPayPal] = useState(false);
  const [paypalListo, setPaypalListo] = useState<string | null>(null);
  const alSuscribirPayPal = useRef((sub: string) => setPaypalListo(sub || 'ok')).current;

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
    setPedido({ id: r.id, numero: numeroPedido(r.id) });
  };

  const waFallback = waLisandro(
    'Hola, quiero activar mi Narra ID (' + (rama === 'politica' ? 'política' : 'negocios') + '). ' +
      unir(f.nombre, f.cuenta, f.mail) + '.',
  );
  const waEfectivo = waLisandro(
    'Hola, quiero activar mi Narra ID. Pedido ' + (pedido?.numero ?? '') + '. Pago en efectivo.',
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

        {pedido && paypalListo ? (
          <section className="pos-tarjeta">
            <span className="pos-eyebrow">Narra ID · pedido {pedido.numero}</span>
            <div className="pos-ok-h"><span className="pos-ok-i" /><h2>¡Suscripción activa!</h2></div>
            <p className="pos-sub">
              PayPal confirmó tu suscripción{paypalListo !== 'ok' && <> (<b>{paypalListo}</b>)</>}. Te escribimos
              al <b>{f.wsp.trim()}</b> para el alta y con <b>{f.mail.trim()}</b> entrás a tu tablero.
            </p>
            <div className="pos-acciones">
              <Link className="pos-btn p" to="/">← Volver a narraglobal</Link>
            </div>
          </section>
        ) : pedido ? (
          <section className="pos-tarjeta">
            <span className="pos-eyebrow">Narra ID · pedido {pedido.numero}</span>
            <div className="pos-preg">¿Cómo pagás?</div>
            <p className="pos-sub">
              USD 1,000 por mes, IVA incluido. Pagá con tu correo, <b>{f.mail.trim()}</b>, y si el medio
              te deja una nota, poné <b>{pedido.numero}</b>: así cruzamos tu pago con el pedido.
            </p>
            <div className="pos-medios">
              <a className="pos-medio" href={MP_NARRA_ID} target="_blank" rel="noopener noreferrer">
                <b>Mercado Pago</b>
                <span>En pesos. Suscribite y congelás tu precio: se debita cada mes.</span>
              </a>
              <button type="button" className={'pos-medio' + (verPayPal ? ' on' : '')} aria-expanded={verPayPal} onClick={() => setVerPayPal(true)}>
                <b>PayPal</b>
                <span>USD 1,000 por mes, desde cualquier país.</span>
              </button>
              <a className="pos-medio" href={waEfectivo} target="_blank" rel="noopener noreferrer">
                <b>Efectivo</b>
                <span>Lo coordinamos por WhatsApp.</span>
              </a>
            </div>
            {verPayPal && <BotonPayPal pedidoId={pedido.id} numero={pedido.numero} onListo={alSuscribirPayPal} />}
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
