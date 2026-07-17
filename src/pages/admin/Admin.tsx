import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { generarCodigo } from '@/lib/narra';
import { DIA_LARGO } from '@/lib/pulso';
import AdminMarco from './AdminMarco';

type Suscripcion = Tables<'suscripciones'>;

interface Formulario {
  id: string | null;
  nombre: string;
  email: string;
  telefono: string;
  plan: string;
  demo_expira: string;
  estado: string;
  pulso_dia: string;
  pulso_hora: string;
}

const FORM_VACIO: Formulario = {
  id: null,
  nombre: '',
  email: '',
  telefono: '',
  plan: 'base',
  demo_expira: '',
  estado: 'activo',
  pulso_dia: 'dom',
  pulso_hora: '09:00',
};

/* Estados del cliente (ALTA-checklist): pagó→borrador→activo→con_historico→live (+pausado) */
const ESTADOS: Array<[string, string]> = [
  ['borrador', 'Borrador (pagó, sin alta)'],
  ['activo', 'Activo (alta completa)'],
  ['con_historico', 'Con histórico (backfill listo)'],
  ['live', 'Live (ritmo semanal)'],
  ['pausado', 'Pausado / baja'],
];

const chipEstado = (estado: string) =>
  estado === 'pausado' ? 'off' : estado === 'borrador' ? 'base' : 'ok';

const Admin = () => {
  const [lista, setLista] = useState<Suscripcion[] | null>(null);
  const [form, setForm] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const cargar = async () => {
    const { data, error: err } = await supabase
      .from('suscripciones')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError('No se pudieron cargar las suscripciones: ' + err.message);
    setLista(data ?? []);
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setGuardando(true);
    setError(null);
    const base = {
      nombre: form.nombre.trim(),
      email: form.email.trim().toLowerCase(),
      telefono: form.telefono.trim() || null,
      plan: form.plan,
      demo_expira:
        form.plan === 'demo' && form.demo_expira ? new Date(form.demo_expira).toISOString() : null,
      estado: form.estado,
      pulso_dia: form.pulso_dia,
      pulso_hora: form.pulso_hora,
    };
    const { error: err } = form.id
      ? await supabase.from('suscripciones').update(base).eq('id', form.id)
      : await supabase.from('suscripciones').insert({ ...base, codigo: generarCodigo() });
    setGuardando(false);
    if (err) {
      setError('No se pudo guardar: ' + err.message);
      return;
    }
    setForm(null);
    cargar();
  };

  const alternarPausa = async (s: Suscripcion) => {
    await supabase
      .from('suscripciones')
      .update({ estado: s.estado === 'pausado' ? 'activo' : 'pausado' })
      .eq('id', s.id);
    cargar();
  };

  const copiarLink = async (s: Suscripcion) => {
    await navigator.clipboard.writeText(window.location.origin + '/suscripcion/' + s.codigo);
    setCopiado(s.id);
    setTimeout(() => setCopiado(null), 1600);
  };

  const editarForm = (s: Suscripcion): Formulario => ({
    id: s.id,
    nombre: s.nombre,
    email: s.email,
    telefono: s.telefono ?? '',
    plan: s.plan,
    demo_expira: s.demo_expira ? s.demo_expira.slice(0, 16) : '',
    estado: s.estado,
    pulso_dia: s.pulso_dia,
    pulso_hora: s.pulso_hora.slice(0, 5),
  });

  return (
    <AdminMarco>
      <h1 className="bo-h">Suscripciones</h1>
      <p className="bo-sub">
        Una por cliente: la fuente de verdad del alta. El cliente entra con magic link desde su
        email a narraglobal.com/suscripcion/<i>código</i>.
      </p>

      <div className="bo-acciones">
        <button className="bo-btn" onClick={() => setForm(form ? null : { ...FORM_VACIO })}>
          {form && !form.id ? 'Cerrar' : '+ Nueva suscripción'}
        </button>
      </div>

      {error && <div className="bo-err" style={{ marginBottom: 14 }}>{error}</div>}

      {form && (
        <form className="bo-form" onSubmit={guardar}>
          <div className="campo">
            <label>Cliente (como se muestra)</label>
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ciro · Senador de Seguridad"
              required
            />
          </div>
          <div className="campo">
            <label>Email (la llave del magic link)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@email.com"
              required
            />
          </div>
          <div className="campo">
            <label>WhatsApp (lo captura narrachat)</label>
            <input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="549341…"
            />
          </div>
          <div className="campo">
            <label>Plan</label>
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="base">Base</option>
              <option value="pro">Pro</option>
              <option value="demo">Demo / cortesía</option>
            </select>
          </div>
          {form.plan === 'demo' && (
            <div className="campo">
              <label>La demo vence</label>
              <input
                type="datetime-local"
                value={form.demo_expira}
                onChange={(e) => setForm({ ...form, demo_expira: e.target.value })}
              />
            </div>
          )}
          <div className="campo">
            <label>Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              {ESTADOS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Pulso semanal (día del aviso)</label>
            <select
              value={form.pulso_dia}
              onChange={(e) => setForm({ ...form, pulso_dia: e.target.value })}
            >
              {Object.entries(DIA_LARGO).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Hora del pulso</label>
            <input
              type="time"
              value={form.pulso_hora}
              onChange={(e) => setForm({ ...form, pulso_hora: e.target.value })}
            />
          </div>
          <div className="pie">
            <button className="bo-btn" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear suscripción'}
            </button>
            <button className="bo-btn sec" type="button" onClick={() => setForm(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {lista === null ? (
        <div className="bo-vacio">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="bo-vacio">
          Todavía no hay suscripciones. Creá la primera con «+ Nueva suscripción».
        </div>
      ) : (
        <table className="bo-tabla">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Código</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Pulso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((s) => (
              <tr key={s.id}>
                <td>
                  <b>{s.nombre}</b>
                </td>
                <td>{s.email}</td>
                <td>
                  <span className="cod">{s.codigo}</span>
                </td>
                <td>
                  <span className={'bo-chip ' + s.plan}>{s.plan}</span>
                </td>
                <td>
                  <span className={'bo-chip ' + chipEstado(s.estado)}>
                    {s.estado.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {s.pulso_dia} {s.pulso_hora.slice(0, 5)}
                </td>
                <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                  <Link
                    className="bo-btn mini sec"
                    style={{ textDecoration: 'none', marginRight: 6 }}
                    to={'/admin/suscripcion/' + s.id}
                  >
                    Tableros →
                  </Link>
                  <button
                    className="bo-btn mini sec"
                    style={{ marginRight: 6 }}
                    onClick={() => copiarLink(s)}
                  >
                    {copiado === s.id ? '¡Copiado!' : 'Copiar link'}
                  </button>
                  <button
                    className="bo-btn mini sec"
                    style={{ marginRight: 6 }}
                    onClick={() => setForm(editarForm(s))}
                  >
                    Editar
                  </button>
                  <button className="bo-btn mini peligro" onClick={() => alternarPausa(s)}>
                    {s.estado === 'pausado' ? 'Reactivar' : 'Pausar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminMarco>
  );
};

export default Admin;
