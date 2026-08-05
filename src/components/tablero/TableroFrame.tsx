import { useEffect, useMemo, useState } from 'react';
import { prepararTablero } from '@/lib/tablero';

interface Props {
  /** El objeto NARRA (schema_version 1 o 2) que ve este cliente. */
  datos: unknown;
  /** Plan de la suscripción: base | demo | pro. */
  plan: string;
  /** Vencimiento de la demo (ISO), si aplica. */
  exp?: string | null;
  titulo?: string;
}

/* Carga el producto de public/tablero/index.html, le inyecta los datos del
   cliente (ver src/lib/tablero.ts) y lo monta en un iframe. */
const TableroFrame = ({ datos, plan, exp, titulo = 'Tablero de suscripción' }: Props) => {
  const [producto, setProducto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch('/tablero/index.html')
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((texto) => {
        if (vivo) setProducto(texto);
      })
      .catch(() => {
        if (vivo) setError('No se pudo cargar el producto tablero.');
      });
    return () => {
      vivo = false;
    };
  }, []);

  const preparado = useMemo(() => {
    if (!producto) return null;
    try {
      return { srcDoc: prepararTablero(producto, datos, plan, exp) };
    } catch (e) {
      return { falla: e instanceof Error ? e.message : String(e) };
    }
  }, [producto, datos, plan, exp]);

  if (error) return <div className="tb-cargando">{error}</div>;
  if (!preparado) return <div className="tb-cargando">Cargando tu tablero…</div>;
  if ('falla' in preparado) return <div className="tb-cargando">{preparado.falla}</div>;

  return <iframe className="tb-iframe" title={titulo} srcDoc={preparado.srcDoc} />;
};

export default TableroFrame;
