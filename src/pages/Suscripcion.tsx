import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useSesion } from '@/hooks/useAcceso';
import { fraseProximoPulso } from '@/lib/pulso';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import TableroFrame from '@/components/tablero/TableroFrame';
import '@/styles/acceso.css';

type Suscripcion = Tables<'suscripciones'>;
type Tablero = Tables<'tableros'>;

type Estado =
  | { paso: 'cargando' }
  | { paso: 'sin-acceso' }
  | { paso: 'pausada'; suscripcion: Suscripcion }
  | { paso: 'sin-tablero'; suscripcion: Suscripcion }
  | { paso: 'listo'; suscripcion: Suscripcion; tablero: Tablero };

const WA_NARRA = 'https://wa.me/5493417545069';

const Suscripcion = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const { sesion, cargando } = useSesion();
  const [estado, setEstado] = useState<Estado>({ paso: 'cargando' });

  useEffect(() => {
    if (!sesion || !codigo) return;
    let vivo = true;
    setEstado({ paso: 'cargando' });

    (async () => {
      const { data: sus } = await supabase
        .from('suscripciones')
        .select('*')
        .eq('codigo', codigo)
        .maybeSingle();
      if (!vivo) return;
      if (!sus) {
        setEstado({ paso: 'sin-acceso' });
        return;
      }
      if (sus.estado === 'pausado') {
        setEstado({ paso: 'pausada', suscripcion: sus });
        return;
      }
      const { data: tab } = await supabase
        .from('tableros')
        .select('*')
        .eq('suscripcion_id', sus.id)
        .eq('estado', 'publicado')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!vivo) return;
      if (!tab) {
        setEstado({ paso: 'sin-tablero', suscripcion: sus });
        return;
      }
      setEstado({ paso: 'listo', suscripcion: sus, tablero: tab });
    })();

    return () => {
      vivo = false;
    };
  }, [sesion, codigo]);

  const salir = () => supabase.auth.signOut();

  if (cargando) {
    return (
      <div className="acc-pantalla">
        <div className="acc-pie">narraglobal · tablero de suscripción</div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="acc-pantalla">
        <MagicLinkForm
          kick="Tablero de suscripción"
          titulo="Entrá a tu tablero"
          detalle="Ingresá el email de tu suscripción y te mandamos un link de acceso. Sin contraseñas."
          redirectTo={window.location.origin + '/suscripcion/' + (codigo ?? '')}
        />
        <div className="acc-pie">narraglobal · datos NarraNoise®</div>
      </div>
    );
  }

  if (estado.paso === 'cargando') {
    return (
      <div className="tb-shell">
        <div className="tb-cargando">Cargando tu tablero…</div>
      </div>
    );
  }

  if (estado.paso === 'sin-acceso') {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Tablero de suscripción</div>
          <h1 className="acc-h">Esta cuenta no tiene acceso</h1>
          <p className="acc-p">
            Estás con <b>{sesion.user.email}</b>, pero esa dirección no corresponde a esta
            suscripción. Si es tu tablero, entrá con el email con el que te suscribiste — o
            escribinos y lo resolvemos.
          </p>
          <div className="acc-form">
            <a className="acc-btn" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
              Escribirnos por WhatsApp
            </a>
            <button className="acc-btn sec" onClick={salir}>
              Entrar con otro email
            </button>
          </div>
          <div className="acc-links">
            <Link to="/entrar">Buscar mi suscripción</Link>
          </div>
        </div>
      </div>
    );
  }

  if (estado.paso === 'pausada') {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Suscripción en pausa</div>
          <h1 className="acc-h">Tu tablero está en pausa</h1>
          <p className="acc-p">
            La suscripción de <b>{estado.suscripcion.nombre}</b> no está activa en este momento.
            Escribinos y la reactivamos en el día.
          </p>
          <div className="acc-form">
            <a className="acc-btn" href={WA_NARRA} target="_blank" rel="noopener noreferrer">
              Reactivar por WhatsApp
            </a>
            <button className="acc-btn sec" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (estado.paso === 'sin-tablero') {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Tablero de suscripción</div>
          <h1 className="acc-h">Tu tablero se está preparando</h1>
          <p className="acc-p">
            Hola, <b>{estado.suscripcion.nombre}</b>. Tu primera semana de datos NarraNoise® está
            en la mesa de trabajo. Tu entrega llega{' '}
            <b>{fraseProximoPulso(estado.suscripcion.pulso_dia, estado.suscripcion.pulso_hora)}</b>.
          </p>
          <div className="acc-form">
            <button className="acc-btn sec" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { suscripcion, tablero } = estado;
  const exp =
    suscripcion.plan === 'demo' && suscripcion.demo_expira
      ? suscripcion.demo_expira.slice(0, 16)
      : null;

  return (
    <div className="tb-shell">
      <div className="tb-barra">
        <img className="wm" src="/land/wm-a.svg" alt="narraglobal" />
        <span className="quien">{sesion.user.email}</span>
        <button className="salir" onClick={salir}>
          Salir
        </button>
      </div>
      <TableroFrame
        datos={tablero.datos}
        plan={suscripcion.plan}
        exp={exp}
        titulo={'Tablero · ' + suscripcion.nombre}
      />
    </div>
  );
};

export default Suscripcion;
