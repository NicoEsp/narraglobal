import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  kick?: string;
  titulo: string;
  detalle: string;
  /** URL absoluta a la que vuelve el magic link. */
  redirectTo: string;
}

/** Card de acceso por magic link: email → link al correo. */
const MagicLinkForm = ({ kick = 'Acceso', titulo, detalle, redirectTo }: Props) => {
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'enviado'>('inicial');
  const [error, setError] = useState<string | null>(null);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail) return;
    setEstado('enviando');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: redirectTo },
    });
    if (err) {
      setEstado('inicial');
      setError(
        err.message === 'Signups not allowed for otp'
          ? 'Ese email no tiene una cuenta habilitada. Escribinos y lo resolvemos.'
          : 'No pudimos enviar el link (' + err.message + '). Probá de nuevo en un minuto.',
      );
      return;
    }
    setEstado('enviado');
  };

  return (
    <div className="acc-card">
      <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
      <div className="acc-kick">{kick}</div>
      <h1 className="acc-h">{titulo}</h1>
      <p className="acc-p">{detalle}</p>

      {estado === 'enviado' ? (
        <div className="acc-ok">
          Te mandamos un link de acceso a <b>{email.trim().toLowerCase()}</b>. Abrilo desde este
          dispositivo y entrás directo. Si no llega en un par de minutos, revisá spam.
        </div>
      ) : (
        <form className="acc-form" onSubmit={enviar}>
          <input
            className="acc-input"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            aria-label="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <div className="acc-error">{error}</div>}
          <button className="acc-btn" type="submit" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Enviarme el link de acceso'}
          </button>
        </form>
      )}
    </div>
  );
};

export default MagicLinkForm;
