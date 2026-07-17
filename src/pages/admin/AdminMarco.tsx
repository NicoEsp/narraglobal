import type { ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSesion, useEsAdmin } from '@/hooks/useAcceso';
import MagicLinkForm from '@/components/acceso/MagicLinkForm';
import '@/styles/acceso.css';

/* Marco del back office: exige sesión + rol admin y pinta el header.
   Los admins se dan de alta agregando su email a la tabla admin_emails. */
const AdminMarco = ({ children }: { children: ReactNode }) => {
  const { sesion, cargando } = useSesion();
  const esAdmin = useEsAdmin(sesion);

  if (cargando) {
    return (
      <div className="acc-pantalla">
        <div className="acc-pie">narraglobal · back office</div>
      </div>
    );
  }

  if (!sesion) {
    return (
      <div className="acc-pantalla">
        <MagicLinkForm
          kick="Back office"
          titulo="Mesa de trabajo"
          detalle="Acceso para el equipo narraglobal. Ingresá tu email y te mandamos el link."
          redirectTo={window.location.origin + window.location.pathname}
        />
        <div className="acc-pie">narraglobal · back office</div>
      </div>
    );
  }

  if (esAdmin === null) {
    return (
      <div className="acc-pantalla">
        <div className="acc-pie">Verificando permisos…</div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="acc-pantalla">
        <div className="acc-card">
          <img className="acc-wm" src="/land/wm-b.svg" alt="narraglobal" />
          <div className="acc-kick">Back office</div>
          <h1 className="acc-h">Esta cuenta no tiene permisos</h1>
          <p className="acc-p">
            <b>{sesion.user.email}</b> no es una cuenta del equipo. Si tendría que serlo, hay que
            agregar el email a <b>admin_emails</b> en Supabase y volver a entrar.
          </p>
          <div className="acc-form">
            <button className="acc-btn sec" onClick={() => supabase.auth.signOut()}>
              Entrar con otro email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bo">
      <header className="bo-top">
        <img className="wm" src="/land/wm-a.svg" alt="narraglobal" />
        <span className="t">Back office</span>
        <span className="quien">{sesion.user.email}</span>
        <button className="salir" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </header>
      <main className="bo-main">{children}</main>
    </div>
  );
};

export default AdminMarco;
