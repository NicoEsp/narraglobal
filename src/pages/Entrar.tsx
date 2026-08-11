import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSesion, useEsAdmin } from '@/hooks/useAcceso';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import '@/styles/acceso.css';

const WA_NARRA = 'https://wa.me/5493417545069';

/* Puerta de entrada desde la landing: loguea por magic link y redirige
   al tablero del cliente (o al back office si la cuenta es admin). */
const Entrar = () => {
  const { sesion, cargando } = useSesion();
  const { esAdmin, error: errorRol } = useEsAdmin(sesion);
  const navigate = useNavigate();
  const [sinSuscripcion, setSinSuscripcion] = useState(false);
  const email = sesion?.user.email;

  // Cambió la cuenta: el veredicto de la anterior no vale más. Sin esto, quien
  // sale y entra con otro email se queda mirando el cartel del email viejo.
  useEffect(() => {
    setSinSuscripcion(false);
  }, [email]);

  useEffect(() => {
    // Si no pudimos leer el rol, seguimos como cliente: la pantalla de «sin
    // suscripción» tiene la puerta al back office para el equipo.
    if (!sesion || (esAdmin === null && !errorRol)) return;
    if (esAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    let vivo = true;
    (async () => {
      const { data } = await supabase
        .from('suscripciones')
        .select('codigo, estado, created_at')
        .order('created_at', { ascending: false });
      if (!vivo) return;
      const lista = data ?? [];
      const destino = lista.find((s) => s.estado !== 'pausado') ?? lista[0];
      if (destino) {
        navigate('/suscripcion/' + destino.codigo, { replace: true });
      } else {
        setSinSuscripcion(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [sesion, esAdmin, errorRol, navigate]);

  if (cargando) {
    return (
      <div className="acc-pantalla">
        <div className="acc-pie">narraglobal</div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="acc-pantalla">
        <MagicLinkForm
          kick="Clientes"
          titulo="Entrá a tu tablero"
          detalle="Ingresá el email de tu suscripción y te mandamos un código de acceso directo a tu tablero."
          redirectTo={window.location.origin + '/entrar'}
        />
        <div className="acc-pie">narraglobal · datos NarraNoise®</div>
      </div>
    );
  }

  if (sinSuscripcion) {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Clientes</div>
          <h1 className="acc-h">No encontramos tu suscripción</h1>
          <p className="acc-p">
            No hay una suscripción asociada a <b>{sesion.user.email}</b>. Si te suscribiste con
            otro email, salí y volvé a entrar con ese. Si creés que es un error, escribinos.
          </p>
          <div className="acc-form">
            <a className="acc-btn" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
              Escribirnos por WhatsApp
            </a>
            <button className="acc-btn sec" onClick={() => supabase.auth.signOut()}>
              Entrar con otro email
            </button>
          </div>
          {/* Salida para el equipo: sin esto, una cuenta narraglobal termina acá
              sin ningún camino hacia la mesa de trabajo. */}
          <p className="acc-nota">
            ¿Sos del equipo? <a href="/admin">Entrá al back office</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="acc-pantalla">
      <div className="acc-pie">Buscando tu tablero…</div>
    </div>
  );
};

export default Entrar;
