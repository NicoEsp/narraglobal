import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/** Sesión de Supabase, con estado de carga inicial. */
export function useSesion() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSesion(s);
      setCargando(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { sesion, cargando };
}

/** ¿La sesión tiene el rol admin? null = todavía no se sabe. */
export function useEsAdmin(sesion: Session | null) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const userId = sesion?.user.id;

  useEffect(() => {
    if (!userId) {
      setEsAdmin(null);
      return;
    }
    let vivo = true;
    setEsAdmin(null);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setEsAdmin(Boolean(data));
      });
    return () => {
      vivo = false;
    };
  }, [userId]);

  return esAdmin;
}
