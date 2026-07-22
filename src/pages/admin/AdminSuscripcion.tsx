import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { parseDatosJs, validarNarra, type DatosNarra, type ResultadoValidacion } from '@/lib/narra';
import { proximoPulso } from '@/lib/pulso';
import TableroFrame from '@/components/tablero/TableroFrame';
import AdminMarco from './AdminMarco';

type Suscripcion = Tables<'suscripciones'>;
type Tablero = Tables<'tableros'>;

interface Borrador {
  tableroId: string | null;
  texto: string;
  validacion: ResultadoValidacion | null;
  datos: DatosNarra | null;
}

const fFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

const fFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

/* datetime-local en hora local, sin pasar por toISOString (que va a UTC) */
const aInputLocal = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type RedItem = { red: string; usuario: string };

/** Datos que el cliente cargó en su alta (/alta). Read-only: sirve para
    confirmar los @ antes de tirar el pull de Apify. */
const PanelAlta = ({ sus }: { sus: Suscripcion }) => {
  const redes = Array.isArray(sus.redes) ? (sus.redes as unknown as RedItem[]) : [];
  const competidores = Array.isArray(sus.competidores)
    ? (sus.competidores as unknown as string[])
    : [];
  const hayAlta = Boolean(sus.alta_completada_en) || redes.length > 0;

  return (
    <div className="bo-form" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
      <div className="campo ancho">
        <label>Datos del alta {hayAlta ? '' : '· sin completar'}</label>
      </div>
      {!hayAlta ? (
        <div className="bo-nota">
          El cliente todavía no completó su alta en <b>/alta/{sus.codigo}</b>. Aparece acá cuando la
          termina (y pasa a estado <b>activo</b>).
        </div>
      ) : (
        <>
          <div className="campo">
            <label>Redes (los @ públicos)</label>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {redes.length === 0
                ? '—'
                : redes.map((r) => `${r.red}: ${r.usuario}`).join(' · ')}
            </div>
          </div>
          <div className="campo">
            <label>Categoría / mercado</label>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {sus.categoria || '—'}
              {sus.pais_para ? ` · para ${sus.pais_para}` : ''}
              {sus.pais_de ? ` · desde ${sus.pais_de}` : ''}
            </div>
          </div>
          <div className="campo">
            <label>Teléfono / equipo</label>
            <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
              {sus.telefono || '—'}
              {sus.equipo_tamano > 0 ? ` · equipo de ${sus.equipo_tamano}` : ' · trabaja solo'}
              {sus.equipo_telefono ? ` · compañero ${sus.equipo_telefono}` : ''}
            </div>
          </div>
          {competidores.length > 0 && (
            <div className="campo">
              <label>Competidores (PRO)</label>
              <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{competidores.join(' · ')}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const AdminSuscripcion = () => {
  const { id } = useParams<{ id: string }>();
  const [sus, setSus] = useState<Suscripcion | null>(null);
  const [tableros, setTableros] = useState<Tablero[] | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ datos: unknown; etiqueta: string } | null>(null);
  const [programando, setProgramando] = useState<{ tableroId: string; cuando: string } | null>(null);

  const cargar = useCallback(async () => {
    if (!id) return;
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from('suscripciones').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('tableros')
        .select('*')
        .eq('suscripcion_id', id)
        .order('updated_at', { ascending: false }),
    ]);
    setSus(s ?? null);
    setTableros(t ?? []);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* Valida el texto pegado sin guardarlo todavía */
  const validar = (b: Borrador): Borrador => {
    try {
      const datos = parseDatosJs(b.texto);
      return { ...b, datos, validacion: validarNarra(datos) };
    } catch (e) {
      return {
        ...b,
        datos: null,
        validacion: {
          ok: false,
          errores: [e instanceof Error ? e.message : String(e)],
          avisos: [],
        },
      };
    }
  };

  const guardarBorrador = async () => {
    if (!borrador || !id) return;
    const v = validar(borrador);
    setBorrador(v);
    if (!v.validacion?.ok || !v.datos) return;
    setGuardando(true);
    setError(null);
    const fila = {
      semana: typeof v.datos.meta?.semana === 'string' ? v.datos.meta.semana : '',
      datos: v.datos as never,
    };
    const { error: err } = v.tableroId
      ? await supabase.from('tableros').update(fila).eq('id', v.tableroId)
      : await supabase.from('tableros').insert({ ...fila, suscripcion_id: id });
    setGuardando(false);
    if (err) {
      setError('No se pudo guardar: ' + err.message);
      return;
    }
    setBorrador(null);
    cargar();
  };

  const cambiarEstado = async (t: Tablero, estado: string, programadoPara?: string | null) => {
    const { error: err } = await supabase
      .from('tableros')
      .update({ estado, programado_para: programadoPara ?? null })
      .eq('id', t.id);
    if (err) setError('No se pudo cambiar el estado: ' + err.message);
    setProgramando(null);
    cargar();
  };

  const abrirProgramar = (t: Tablero) => {
    const sugerido = sus ? proximoPulso(sus.pulso_dia, sus.pulso_hora.slice(0, 5)) : new Date();
    setProgramando({ tableroId: t.id, cuando: aInputLocal(sugerido) });
  };

  const borrar = async (t: Tablero) => {
    if (!window.confirm('¿Borrar esta semana del tablero? No se puede deshacer.')) return;
    await supabase.from('tableros').delete().eq('id', t.id);
    cargar();
  };

  const editar = (t: Tablero) => {
    setBorrador({
      tableroId: t.id,
      texto: JSON.stringify(t.datos, null, 2),
      validacion: null,
      datos: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!id) return null;

  return (
    <AdminMarco>
      <Link className="bo-volver" to="/admin">
        ← Suscripciones
      </Link>
      <h1 className="bo-h">{sus ? sus.nombre : 'Cargando…'}</h1>
      {sus && (
        <p className="bo-sub">
          {sus.email} · plan <b>{sus.plan}</b> · pulso {sus.pulso_dia} {sus.pulso_hora.slice(0, 5)}{' '}
          ·{' '}
          <a href={'/suscripcion/' + sus.codigo} target="_blank" rel="noopener noreferrer">
            /suscripcion/{sus.codigo}
          </a>
        </p>
      )}

      {sus && <PanelAlta sus={sus} />}

      <div className="bo-acciones">
        <button
          className="bo-btn"
          onClick={() =>
            setBorrador(
              borrador && !borrador.tableroId
                ? null
                : { tableroId: null, texto: '', validacion: null, datos: null },
            )
          }
        >
          {borrador && !borrador.tableroId ? 'Cerrar' : '+ Nueva semana'}
        </button>
      </div>

      {error && <div className="bo-err" style={{ marginBottom: 14 }}>{error}</div>}

      {borrador && (
        <div className="bo-form" style={{ gridTemplateColumns: '1fr' }}>
          <div className="campo ancho">
            <label>
              {borrador.tableroId
                ? 'Editar datos de la semana (JSON)'
                : 'Pegá el datos.js completo de la semana (o el JSON)'}
            </label>
            <textarea
              value={borrador.texto}
              onChange={(e) =>
                setBorrador({ ...borrador, texto: e.target.value, validacion: null })
              }
              placeholder={'window.NARRA={\n  schema_version: 1,\n  meta: { ... },\n  ...\n};'}
              spellCheck={false}
            />
          </div>
          <div className="bo-nota">
            El mismo archivo que hoy subís al repo del cliente. Se valida antes de guardar
            (schema_version 1, piezas, series, pool con un solo you:1…). Queda como{' '}
            <b>borrador</b>: el cliente lo ve recién cuando se publica — el ritual es sábado
            programás, el domingo se publica solo.
          </div>
          {borrador.validacion && (
            <div className="bo-lista-err">
              {borrador.validacion.errores.map((e, i) => (
                <div key={'e' + i} className="bo-err">
                  {e}
                </div>
              ))}
              {borrador.validacion.avisos.map((a, i) => (
                <div key={'a' + i} className="bo-aviso">
                  {a}
                </div>
              ))}
              {borrador.validacion.ok && (
                <div className="bo-ok">Estructura en verde. Listo para guardar.</div>
              )}
            </div>
          )}
          <div className="pie">
            <button
              className="bo-btn sec"
              type="button"
              onClick={() => setBorrador(validar(borrador))}
            >
              Validar
            </button>
            <button
              className="bo-btn sec"
              type="button"
              onClick={() => {
                const v = validar(borrador);
                setBorrador(v);
                if (v.datos) setPreview({ datos: v.datos, etiqueta: 'Borrador sin guardar' });
              }}
            >
              Ver como cliente
            </button>
            <button className="bo-btn" type="button" onClick={guardarBorrador} disabled={guardando}>
              {guardando ? 'Guardando…' : borrador.tableroId ? 'Guardar cambios' : 'Guardar borrador'}
            </button>
            <button className="bo-btn sec" type="button" onClick={() => setBorrador(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {programando && (
        <div className="bo-form" style={{ gridTemplateColumns: '1fr' }}>
          <div className="campo">
            <label>Se publica (y a futuro dispara el aviso) el…</label>
            <input
              type="datetime-local"
              value={programando.cuando}
              onChange={(e) => setProgramando({ ...programando, cuando: e.target.value })}
            />
          </div>
          <div className="bo-nota">
            Sugerido según el pulso del cliente. Al llegar la hora, la base lo pasa a{' '}
            <b>publicado</b> sola (pg_cron, cada 5 min).
          </div>
          <div className="pie">
            <button
              className="bo-btn"
              onClick={() => {
                const t = tableros?.find((x) => x.id === programando.tableroId);
                if (t && programando.cuando) {
                  cambiarEstado(t, 'programado', new Date(programando.cuando).toISOString());
                }
              }}
            >
              Programar
            </button>
            <button className="bo-btn sec" onClick={() => setProgramando(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {tableros === null ? (
        <div className="bo-vacio">Cargando…</div>
      ) : tableros.length === 0 ? (
        <div className="bo-vacio">
          Sin semanas cargadas. Pegá el primer datos.js con «+ Nueva semana».
        </div>
      ) : (
        <table className="bo-tabla">
          <thead>
            <tr>
              <th>Semana</th>
              <th>Actualizado</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableros.map((t) => (
              <tr key={t.id}>
                <td>
                  <b>{t.semana || 'Sin etiqueta'}</b>
                </td>
                <td>{fFecha(t.updated_at)}</td>
                <td>
                  <span
                    className={
                      'bo-chip ' +
                      (t.estado === 'publicado' ? 'ok' : t.estado === 'programado' ? 'demo' : 'base')
                    }
                  >
                    {t.estado === 'programado' && t.programado_para
                      ? 'programado · ' + fFechaHora(t.programado_para)
                      : t.estado}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <button
                    className="bo-btn mini sec"
                    style={{ marginRight: 6 }}
                    onClick={() => setPreview({ datos: t.datos, etiqueta: t.semana || 'Tablero' })}
                  >
                    Ver
                  </button>
                  <button
                    className="bo-btn mini sec"
                    style={{ marginRight: 6 }}
                    onClick={() => editar(t)}
                  >
                    Editar
                  </button>
                  {t.estado !== 'publicado' && (
                    <>
                      <button
                        className="bo-btn mini sec"
                        style={{ marginRight: 6 }}
                        onClick={() => abrirProgramar(t)}
                      >
                        Programar…
                      </button>
                      <button
                        className="bo-btn mini"
                        style={{ marginRight: 6 }}
                        onClick={() => cambiarEstado(t, 'publicado')}
                      >
                        Publicar ya
                      </button>
                    </>
                  )}
                  {t.estado !== 'borrador' && (
                    <button
                      className="bo-btn mini peligro"
                      style={{ marginRight: 6 }}
                      onClick={() => cambiarEstado(t, 'borrador')}
                    >
                      A borrador
                    </button>
                  )}
                  <button className="bo-btn mini peligro" onClick={() => borrar(t)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {preview && sus && (
        <div className="bo-preview">
          <div className="barra">
            <span className="t">
              Vista previa como cliente · {sus.nombre} · {preview.etiqueta} · plan {sus.plan}
            </span>
            <button className="cerrar" onClick={() => setPreview(null)}>
              Cerrar
            </button>
          </div>
          <TableroFrame
            datos={preview.datos}
            plan={sus.plan}
            exp={sus.plan === 'demo' && sus.demo_expira ? sus.demo_expira.slice(0, 16) : null}
            titulo={'Vista previa · ' + sus.nombre}
          />
        </div>
      )}
    </AdminMarco>
  );
};

export default AdminSuscripcion;
