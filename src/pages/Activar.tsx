import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PAISES, guardarPedido, numeroPedido, telefonoConPais, telefonoValido, unir } from '@/lib/pedidos';
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
   medimos, el territorio o la vertical —que definen la competencia, nadie la
   elige— y el correo del alta), que quedan guardados como pedido; después
   cómo paga: Mercado Pago (link fijo de la suscripción), PayPal (el botón de
   suscripción, que lleva el número de pedido) o efectivo por WhatsApp. El
   pago se cruza a mano con el número de pedido y se marca en el back office.
   La rama llega del switch del hero (?rama=). Al costado, todo el tiempo, el
   resumen con lo que se está comprando. */

type Rama = 'politica' | 'negocios';

const QUIEN = ['El propio · soy yo', 'Jefe o jefa de prensa', 'Asesor o consultora externa', 'Alguien del equipo'];

const SECTORES = ['Energía', 'Ciencia, farma y salud', 'Agro', 'Bancos y fintech', 'Consumo masivo'];
const SECTOR_OTRO = 'Otro — decinos cuál';

const VACIO = {
  nombre: '', mail: '', wsp: '', cuenta: '', quien: '', hp: '',
  pais: 'Argentina',
  // política: el territorio
  prov: '', ciudad: '', cargo: '',
  // negocios: la vertical
  sector: '', sectorOtro: '',
};
type Campos = typeof VACIO;

/* Lo que se compra, con los mismos ítems que la placa del Narra ID de la home. */
const Resumen = ({ rama }: { rama: Rama }) => (
  <aside className="ac-resumen" aria-label="Lo que estás comprando">
    <span className="pos-eyebrow">Lo que estás comprando</span>
    <div className="ac-r-t">Narra ID · Suscripción mensual</div>
    <ul className="ac-checks">
      <li>Cómo te fue: medimos tus piezas de social media, semana a semana</li>
      <li>
        Alertas semanales sobre tu narrativa, tu influencia digital y tu competencia{' '}
        {rama === 'politica' ? 'en tu ciudad, tu provincia y el país' : 'en tu vertical, la región y el mundo'}
      </li>
      <li>Un asistente IA en WhatsApp, a cualquier hora, para pensar tu próxima narrativa</li>
      <li>Call táctica mensual con Lisandro Bregant, director de narraglobal</li>
    </ul>
    <div className="ac-r-total">
      <span>Total</span>
      <b>USD 1,000 <s>/ mes</s></b>
    </div>
    <div className="ac-r-pie">IVA incluido · se renueva cada mes · cancelás cuando quieras</div>
  </aside>
);

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
    const telefono = telefonoConPais(f.wsp, f.pais);
    if (!telefonoValido(telefono)) {
      setError({ texto: 'Revisá tu WhatsApp: tiene que tener el código de área y el número.', fallo: false });
      return;
    }
    setEnviando(true);
    setError(null);
    const sector = f.sector === SECTOR_OTRO ? f.sectorOtro.trim() || 'Otro' : f.sector;
    const elenco =
      rama === 'politica'
        ? { pais: f.pais, provincia: f.prov.trim(), ciudad: f.ciudad.trim(), cargo: f.cargo.trim() }
        : { pais: f.pais, sector };
    const r = await guardarPedido({
      tipo: 'narra_id',
      telefono,
      email: f.mail,
      datos: { nombre: f.nombre.trim(), cuenta: f.cuenta.trim(), rama, quien: f.quien, ...elenco },
      honeypot: f.hp,
    });
    setEnviando(false);
    if ('error' in r) {
      setError({ texto: 'No pudimos guardar tu pedido: ' + r.error + '.', fallo: true });
      return;
    }
    setPedido({ id: r.id, numero: numeroPedido(r.id) });
  };

  // también es la salida «Prefiero hacerlo por WhatsApp»: lleva lo que ya escribió, si escribió algo
  const yaCargado = unir(f.nombre, f.cuenta, f.mail);
  const waFallback = waLisandro(
    'Hola Lisandro, quiero activar mi Narra ID (' + (rama === 'politica' ? 'política' : 'negocios') + ').' +
      (yaCargado ? ' ' + yaCargado + '.' : ''),
  );
  const waEfectivo = waLisandro(
    'Hola, quiero activar mi Narra ID. Pedido ' + (pedido?.numero ?? '') + '. Pago en efectivo.',
  );

  return (
    <div className="pos-wrap ancho">
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

        <div className="ac-grid">
        <div className="ac-col">
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
            <div className="pos-preg">Activá tu Narra ID</div>
            <div className="pos-rama ac-rama" role="group" aria-label="A quién medimos">
              <button type="button" className={'pos-rb' + (rama === 'politica' ? ' on' : '')} aria-pressed={rama === 'politica'} onClick={() => cambiarRama('politica')}>Política</button>
              <button type="button" className={'pos-rb' + (rama === 'negocios' ? ' on' : '')} aria-pressed={rama === 'negocios'} onClick={() => cambiarRama('negocios')}>Negocios</button>
            </div>
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
                  <input id="ac-wsp" type="tel" placeholder="341 555 1234" value={f.wsp} onChange={set('wsp')} required />
                </div>
              </div>
              {rama === 'politica' ? (
                <>
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="ac-pais">País</label>
                      <select id="ac-pais" value={f.pais} onChange={set('pais')}>
                        {PAISES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="ac-prov">Provincia</label>
                      <input id="ac-prov" type="text" placeholder="Santa Fe, Córdoba, Buenos Aires…" value={f.prov} onChange={set('prov')} required />
                    </div>
                  </div>
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="ac-ciudad">Ciudad · tu municipio</label>
                      <input id="ac-ciudad" type="text" placeholder="Rosario, Paraná, Salta…" value={f.ciudad} onChange={set('ciudad')} required />
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="ac-cargo">Cargo o candidatura</label>
                      <input id="ac-cargo" type="text" placeholder="Concejala, senador, intendente…" value={f.cargo} onChange={set('cargo')} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="pos-fila">
                    <div className="pos-campo">
                      <label htmlFor="ac-pais">País</label>
                      <select id="ac-pais" value={f.pais} onChange={set('pais')}>
                        {PAISES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="pos-campo">
                      <label htmlFor="ac-sector">Sector · tu vertical</label>
                      <select id="ac-sector" value={f.sector} onChange={set('sector')} required>
                        <option value="">Elegí tu sector</option>
                        {SECTORES.map((x) => <option key={x}>{x}</option>)}
                        <option>{SECTOR_OTRO}</option>
                      </select>
                    </div>
                  </div>
                  {f.sector === SECTOR_OTRO && (
                    <div className="pos-campo">
                      <label htmlFor="ac-sector-otro">¿Cuál?</label>
                      <input id="ac-sector-otro" type="text" placeholder="Tu sector" value={f.sectorOtro} onChange={set('sectorOtro')} required />
                    </div>
                  )}
                </>
              )}
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
              <a className="ac-wa" href={waFallback} target="_blank" rel="noopener noreferrer">Prefiero hacerlo por WhatsApp</a>
            </div>
          </form>
        )}
        </div>
        <Resumen rama={rama} />
        </div>
      </div>
    </div>
  );
};

export default Activar;
