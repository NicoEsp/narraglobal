import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sesión de Supabase, con estado de carga inicial.
 *
 * `sesion` es un objeto nuevo en cada evento de auth (refresh de token, volver
 * a la pestaña), aunque sea la misma persona. Al usarla en un `useEffect`,
 * dependé del `sesion?.user.id` — como acá abajo — y no del objeto, o el efecto
 * se vuelve a disparar solo cada tanto.
 */
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

/**
 * ¿La sesión tiene el rol admin?
 *
 * `esAdmin: null` = todavía no se sabe. Un `false` acá cierra la puerta del back
 * office, así que solo lo devolvemos cuando la base contestó: si la consulta
 * falla (red, 500), reintentamos y recién ahí marcamos `error` — nunca un
 * "no tenés permisos" que en realidad era una consulta que no llegó.
 */
const INTENTOS = 3;

export function useEsAdmin(sesion: Session | null) {
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const userId = sesion?.user.id;

  useEffect(() => {
    if (!userId) {
      setEsAdmin(null);
      setError(false);
      return;
    }
    let vivo = true;
    let reloj: ReturnType<typeof setTimeout>;
    setEsAdmin(null);
    setError(false);

    const consultar = async (vuelta: number) => {
      const { data, error: err } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      if (!vivo) return;
      if (!err) {
        setEsAdmin(Boolean(data));
        return;
      }
      if (vuelta + 1 < INTENTOS) {
        reloj = setTimeout(() => consultar(vuelta + 1), 400 * 2 ** vuelta);
        return;
      }
      setError(true);
    };

    consultar(0);
    return () => {
      vivo = false;
      clearTimeout(reloj);
    };
  }, [userId, intento]);

  /** Vuelve a preguntar desde cero (botón «Reintentar»). */
  const reintentar = () => setIntento((n) => n + 1);

  return { esAdmin, error, reintentar };
}
