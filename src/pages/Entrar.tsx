import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSesion, useEsAdmin } from '@/hooks/useAcceso';
import { WA_NARRA } from '@/lib/enlaces';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import '@/styles/acceso.css';

/* Esperas entre reintentos de la búsqueda (ms). El webhook de Lemon Squeezy
   crea la fila del cliente unos segundos después del pago: quien viene del
   recibo puede llegar acá antes que su suscripción. Sin esta ventana, el que
   acaba de pagar leía «No encontramos tu suscripción» — el peor cartel posible
   justo después de dejar la tarjeta. */
const ESPERAS = [0, 2000, 3000, 5000, 8000];

type Estado = 'buscando' | 'activando' | 'sin-suscripcion' | 'error';

/* Puerta de entrada desde la landing: loguea por magic link y redirige
   al tablero del cliente (o al back office si la cuenta es admin). */
const Entrar = () => {
  const { sesion, cargando } = useSesion();
  const { esAdmin, error: errorRol } = useEsAdmin(sesion);
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>('buscando');
  // Sube con «Volver a intentar»: vuelve a correr la búsqueda desde cero.
  const [ronda, setRonda] = useState(0);
  const email = sesion?.user.email;
  const userId = sesion?.user.id;

  // Cambió la cuenta: el veredicto de la anterior no vale más. Sin esto, quien
  // sale y entra con otro email se queda mirando el cartel del email viejo.
  useEffect(() => {
    setEstado('buscando');
  }, [email]);

  const reintentar = useCallback(() => setRonda((n) => n + 1), []);

  useEffect(() => {
    // Si no pudimos leer el rol, seguimos como cliente: la pantalla de «sin
    // suscripción» tiene la puerta al back office para el equipo.
    if (!userId || (esAdmin === null && !errorRol)) return;
    if (esAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    let vivo = true;
    let reloj: ReturnType<typeof setTimeout>;

    const buscar = async (vuelta: number) => {
      const { data, error } = await supabase
        .from('suscripciones')
        .select('codigo, estado, created_at')
        .order('created_at', { ascending: false });
      if (!vivo) return;
      // Una consulta que no llegó no es una cuenta sin suscripción: decirle
      // «no encontramos tu suscripción» a alguien que sí la tiene lo manda a
      // soporte por un corte de red de dos segundos.
      if (error) {
        setEstado('error');
        return;
      }
      const lista = data ?? [];
      const destino = lista.find((s) => s.estado !== 'pausado') ?? lista[0];
      if (destino) {
        navigate('/suscripcion/' + destino.codigo, { replace: true });
        return;
      }
      if (vuelta + 1 < ESPERAS.length) {
        setEstado('activando');
        reloj = setTimeout(() => buscar(vuelta + 1), ESPERAS[vuelta + 1]);
        return;
      }
      setEstado('sin-suscripcion');
    };

    setEstado('buscando');
    buscar(0);

    return () => {
      vivo = false;
      clearTimeout(reloj);
    };
  }, [userId, esAdmin, errorRol, ronda, navigate]);

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

  if (estado === 'error') {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Clientes</div>
          <h1 className="acc-h">No pudimos conectarnos</h1>
          <p className="acc-p">
            Tu sesión está abierta, pero no llegamos a leer tu suscripción. Suele ser la conexión:
            probá de nuevo.
          </p>
          <div className="acc-form">
            <button className="acc-btn" onClick={reintentar}>
              Volver a intentar
            </button>
            <a className="acc-btn sec" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
              Escribirnos por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (estado === 'sin-suscripcion') {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Clientes</div>
          <h1 className="acc-h">No encontramos tu suscripción</h1>
          <p className="acc-p">
            No hay una suscripción asociada a <b>{sesion.user.email}</b>. Si te suscribiste con
            otro email, salí y volvé a entrar con ese. Si acabás de pagar, esperá un momento y
            volvé a intentar.
          </p>
          <div className="acc-form">
            <button className="acc-btn" onClick={reintentar}>
              Volver a intentar
            </button>
            <a className="acc-btn sec" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
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
      <div className="acc-pie">
        {estado === 'activando' ? 'Activando tu suscripción…' : 'Buscando tu tablero…'}
      </div>
    </div>
  );
};

export default Entrar;
