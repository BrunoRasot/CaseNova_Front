import { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, Search, ShieldCheck, AlertTriangle, Clock3, RefreshCcw } from 'lucide-react';
import api from '../../api/apiClient';

export default function Auditoria() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/auditoria');
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Fetch logs error:", e);
      setError('No se pudo sincronizar el registro de auditoría.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logsFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((log) =>
      [log.fecha_formateada, log.usuario, log.rol, log.accion, log.detalles, log.ip_address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [logs, search]);

  // Estadísticas rápidas
  const stats = useMemo(() => ({
    total: logs.length,
    riesgo: logs.filter(l => /(ELIMINAR|BORRAR|ERROR|FALLO)/i.test(l.accion)).length,
    sesiones: logs.filter(l => /(LOGIN|INICIO_SESION)/i.test(l.accion)).length
  }), [logs]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Seguridad y Control</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">Auditoría del Sistema</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
              Historial de movimientos y accesos de CaseNova
            </p>
          </div>
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50"
          >
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> 
            {loading ? 'Sincronizando...' : 'Refrescar'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between text-zinc-500">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Eventos</p>
            <ShieldCheck size={16} />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900">{stats.total}</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between text-zinc-500">
            <p className="text-[10px] font-black uppercase tracking-widest">Sesiones</p>
            <Clock3 size={16} />
          </div>
          <p className="mt-2 text-3xl font-black text-zinc-900">{stats.sesiones}</p>
        </article>

        <article className={`rounded-xl border p-4 transition-colors ${stats.riesgo > 0 ? 'border-orange-200 bg-orange-50' : 'border-zinc-200 bg-white'}`}>
          <div className="flex items-center justify-between text-zinc-600">
            <p className="text-[10px] font-black uppercase tracking-widest">Eventos de Riesgo</p>
            <AlertTriangle size={16} className={stats.riesgo > 0 ? 'text-orange-500' : ''} />
          </div>
          <p className={`mt-2 text-3xl font-black ${stats.riesgo > 0 ? 'text-orange-700' : 'text-zinc-900'}`}>{stats.riesgo}</p>
        </article>
      </section>

      {/* Buscador */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700" size={17} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por usuario, acción o detalle..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Timestamp</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Operador</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Acción</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">Detalles</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Cargando bitácora...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-xs font-bold uppercase tracking-widest text-red-500">{error}</td>
                </tr>
              ) : logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Sin registros encontrados</td>
                </tr>
              ) : (
                logsFiltrados.map((log) => {
                  const isCritical = /(ELIMINAR|BORRAR|ERROR)/i.test(log.accion);
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-5 py-4 text-[11px] font-medium text-zinc-500 tabular-nums">
                        {log.fecha_formateada}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-zinc-900">{log.usuario}</span>
                          <span className="text-[9px] font-bold text-zinc-400">{log.rol}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          isCritical ? 'border-red-200 bg-red-50 text-red-700' : 'border-zinc-200 bg-white text-zinc-600'
                        }`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[11px] text-zinc-600">
                        {log.detalles}
                      </td>
                      <td className="px-5 py-4 text-right text-[10px] font-mono text-zinc-400">
                        {log.ip_address || '---'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}