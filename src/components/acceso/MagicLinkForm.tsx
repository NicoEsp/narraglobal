import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  kick?: string;
  titulo: string;
  detalle: string;
  /** URL absoluta a la que vuelve el magic link. */
  redirectTo: string;
}

/* Entre envíos al mismo email, Supabase exige 60s. Lo respetamos en la UI para
   no quemar el rate limit de emails con reintentos ansiosos. */
const ESPERA_REENVIO_S = 60;

/* Recordamos el último envío por email (sobrevive a recargas de la página):
   si el usuario vuelve o le rebota el reenvío, el código que ya tiene sigue
   siendo válido (~1 h) y puede usarlo igual. */
const claveEnvio = (email: string) => 'narra-otp-enviado:' + email;

const registrarEnvio = (email: string) => {
  try {
    sessionStorage.setItem(claveEnvio(email), String(Date.now()));
  } catch {
    /* storage lleno o bloqueado: solo perdemos el contador */
  }
};

const segundosParaReenviar = (email: string): number => {
  try {
    const t = Number(sessionStorage.getItem(claveEnvio(email)) ?? 0);
    if (!t) return 0;
    return Math.max(0, ESPERA_REENVIO_S - Math.floor((Date.now() - t) / 1000));
  } catch {
    return 0;
  }
};

/** ¿A este email ya le mandamos un código desde este navegador hace <1 h?
    (la validez del OTP). Evita mandar a alguien a mirar una casilla vacía. */
const hayEnvioPrevio = (email: string): boolean => {
  try {
    const t = Number(sessionStorage.getItem(claveEnvio(email)) ?? 0);
    return t > 0 && Date.now() - t < 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/** Card de acceso por email: mandamos un código de 6 dígitos + link mágico.
    El código es el camino principal (funciona en cualquier dispositivo y no
    lo rompe el antivirus del correo); el link es el atajo. */
const MagicLinkForm = ({ kick = 'Acceso', titulo, detalle, redirectTo }: Props) => {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [paso, setPaso] = useState<'email' | 'codigo'>('email');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ofrecerCodigo, setOfrecerCodigo] = useState(false);
  const [espera, setEspera] = useState(0);
  const codigoRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // countdown del reenvío
  useEffect(() => {
    if (paso !== 'codigo' || espera <= 0) return;
    const t = setInterval(() => setEspera(segundosParaReenviar(email.trim().toLowerCase())), 1000);
    return () => clearInterval(t);
  }, [paso, espera, email]);

  // El foco sigue al paso: al pedir el código va al input del código; al
  // volver con «Cambiar email» (que desmonta el botón enfocado) va al email.
  useEffect(() => {
    if (paso === 'codigo') codigoRef.current?.focus();
    else emailRef.current?.focus();
  }, [paso]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail || ocupado) return;

    // Si hace menos de 60s que ya le mandamos, no gastamos otro envío:
    // pasamos directo a la pantalla del código.
    const yaEsperando = segundosParaReenviar(mail);
    if (yaEsperando > 0) {
      setPaso('codigo');
      setEspera(yaEsperando);
      setAviso('Ya te mandamos un email hace un momento. Usá ese código: sigue siendo válido.');
      setError(null);
      return;
    }

    setOcupado(true);
    setError(null);
    setAviso(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: redirectTo },
    });
    setOcupado(false);

    if (err) {
      // Solo el código específico de límite de emails: un 429 genérico (p.ej.
      // over_request_rate_limit) no significa que haya un código esperando.
      if (err.code === 'over_email_send_rate_limit') {
        if (hayEnvioPrevio(mail)) {
          // Ya le mandamos uno hace <1 h: sigue vigente, dejamos entrar con ese.
          setPaso('codigo');
          setEspera(ESPERA_REENVIO_S);
          registrarEnvio(mail);
          setAviso(
            'Estamos al límite de envíos por unos minutos. El código que ya te mandamos sigue sirviendo — ponelo acá abajo.',
          );
          return;
        }
        // Sin envío previo desde este navegador: no lo mandamos a mirar una
        // casilla vacía. Puede esperar — o entrar directo si le llegó un
        // código pedido desde otro dispositivo.
        setError(
          'Estamos al límite de envíos de email por unos minutos. Esperá un poco y probá de nuevo.',
        );
        setOfrecerCodigo(true);
        return;
      }
      if (err.message === 'Signups not allowed for otp') {
        setError('Ese email no tiene una cuenta habilitada. Escribinos y lo resolvemos.');
        return;
      }
      setError('No pudimos enviar el email (' + err.message + '). Probá de nuevo en un minuto.');
      return;
    }

    registrarEnvio(mail);
    setEspera(ESPERA_REENVIO_S);
    setPaso('codigo');
  };

  const verificar = async (e: FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    const token = codigo.replace(/\D/g, '');
    if (token.length !== 6 || ocupado) return;

    setOcupado(true);
    setError(null);
    const { error: err } = await supabase.auth.verifyOtp({ email: mail, token, type: 'email' });
    setOcupado(false);

    if (err) {
      setCodigo('');
      setError(
        err.code === 'otp_expired'
          ? 'Ese código venció o no es el último que te mandamos. Pedí uno nuevo con «Reenviar email».'
          : 'No pudimos validar el código (' + err.message + '). Probá de nuevo.',
      );
      codigoRef.current?.focus();
      return;
    }
    // Con la sesión creada, la pantalla que nos montó sigue sola al tablero.
  };

  const cambiarEmail = () => {
    setPaso('email');
    setCodigo('');
    setError(null);
    setAviso(null);
    setOfrecerCodigo(false);
  };

  return (
    <div className="acc-card">
      <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
      <div className="acc-kick">{kick}</div>

      {paso === 'email' ? (
        <>
          <h1 className="acc-h">{titulo}</h1>
          <p className="acc-p">{detalle}</p>
          <form className="acc-form" onSubmit={enviar}>
            <input
              ref={emailRef}
              className="acc-input"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              aria-label="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <div className="acc-error" role="alert">{error}</div>}
            <button className="acc-btn" type="submit" disabled={ocupado}>
              {ocupado ? 'Enviando…' : 'Enviarme el código de acceso'}
            </button>
            {ofrecerCodigo && (
              <button
                className="acc-btn sec"
                type="button"
                onClick={() => {
                  setPaso('codigo');
                  setError(null);
                  setAviso(
                    'Si te llegó un código nuestro (pedido desde este u otro dispositivo), ponelo acá abajo.',
                  );
                }}
              >
                Ya tengo un código
              </button>
            )}
          </form>
          <p className="acc-nota">Sin contraseñas: te llega un código de 6 dígitos y un link.</p>
        </>
      ) : (
        <>
          <h1 className="acc-h">Revisá tu correo</h1>
          <p className="acc-p">
            Te mandamos un email a <b>{email.trim().toLowerCase()}</b> con un{' '}
            <b>código de 6 dígitos</b> y un link de acceso. Poné el código acá — o abrí el link
            desde este dispositivo. Si no llega en un par de minutos, revisá spam.
          </p>
          {aviso && <div className="acc-aviso" role="status">{aviso}</div>}
          <form className="acc-form" onSubmit={verificar}>
            <input
              ref={codigoRef}
              className="acc-input acc-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="······"
              aria-label="Código de 6 dígitos"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            {error && <div className="acc-error" role="alert">{error}</div>}
            <button
              className="acc-btn"
              type="submit"
              disabled={ocupado || codigo.replace(/\D/g, '').length !== 6}
            >
              {ocupado ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          <div className="acc-links">
            <button type="button" onClick={enviar} disabled={ocupado || espera > 0}>
              {espera > 0 ? `Reenviar en ${espera}s` : 'Reenviar email'}
            </button>
            <button type="button" onClick={cambiarEmail}>
              Cambiar email
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MagicLinkForm;
