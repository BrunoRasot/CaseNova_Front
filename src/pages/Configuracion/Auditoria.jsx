import { useState, useEffect, useMemo } from 'react';
import { Activity, Search, ShieldCheck, AlertTriangle, Clock3 } from 'lucide-react';
import api from '../../api/apiClient';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/auditoria');
        setLogs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los registros de auditoria.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) =>
      [log.fecha_formateada, log.usuario, log.rol, log.accion, log.detalles]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [logs, search]);

  const totalEventos = logs.length;
  const eventosRiesgo = logs.filter(
    (log) => String(log.accion || '').includes('ELIMINAR') || String(log.accion || '').includes('ERROR')
  ).length;
  const sesiones = logs.filter((log) => String(log.accion || '').includes('INICIO_SESION')).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Seguridad y Control</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">Registro de Auditoria</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Monitoreo de actividad del sistema y operadores
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
            <Activity size={13} /> Flujo en linea
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Total Eventos</p>
            <ShieldCheck size={15} className="text-zinc-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900">{totalEventos}</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sesiones</p>
            <Clock3 size={15} className="text-zinc-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900">{sesiones}</p>
        </article>

        <article className="rounded-xl border border-zinc-300 bg-zinc-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700">Eventos de Riesgo</p>
            <AlertTriangle size={15} className="text-zinc-700" />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900">{eventosRiesgo}</p>
        </article>
      </section>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700" size={17} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por usuario, accion, rol o detalle..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Timeline de eventos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-white">
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Operador</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Accion</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Detalles del Evento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-zinc-500 text-xs font-semibold uppercase tracking-[0.18em]">
                    Cargando eventos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-red-600 text-xs font-semibold uppercase tracking-[0.18em]">
                    {error}
                  </td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-zinc-500 text-xs font-semibold uppercase tracking-[0.18em]">
                    Sin registros para el filtro actual
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log, idx) => (
                  <tr key={`${log.id || 'row'}-${idx}`} className="transition-colors hover:bg-zinc-50">
                    <td className="px-5 py-3 text-[11px] font-semibold text-zinc-600">{log.fecha_formateada || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tight text-zinc-900">{log.usuario || 'SISTEMA'}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-500">{log.rol || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                          String(log.accion || '').includes('ELIMINAR') || String(log.accion || '').includes('ERROR')
                            ? 'border-zinc-300 bg-zinc-100 text-zinc-800'
                            : 'border-zinc-200 bg-white text-zinc-600'
                        }`}
                      >
                        {log.accion || 'EVENTO'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-[11px] text-zinc-600" title={log.detalles || 'Sin detalle'}>
                      {log.detalles || 'Sin detalle'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

