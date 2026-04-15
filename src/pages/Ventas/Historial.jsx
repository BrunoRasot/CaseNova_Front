import { useState, useEffect } from 'react';
import { Search, Eye, FileText, Calendar, Clock, CreditCard, X, Loader2 } from 'lucide-react';
import api from '../../api/apiClient';

export default function Historial() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [accionTipo, setAccionTipo] = useState('');
  const [accionMotivo, setAccionMotivo] = useState('');
  const [accionLoading, setAccionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const fetchVentas = async () => {
    try {
      const { data } = await api.get('/ventas/historial');
      setVentas(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const verDetalle = async (venta) => {
    setLoadingDetalle(true);
    setDetalle({ ...venta, productos: [] });
    try {
      const { data } = await api.get(`/ventas/detalle/${venta.id}`);
      setDetalle({ ...venta, productos: data });
    } catch (e) { console.error(e); }
    finally { setLoadingDetalle(false); }
  };

  const abrirAccion = (tipo) => {
    setAccionTipo(tipo);
    setAccionMotivo('');
  };

  const ejecutarAccionEstado = async () => {
    if (!detalle || !accionTipo) return;
    if (!accionMotivo.trim()) {
      showToast('Debes ingresar un motivo para continuar.');
      return;
    }

    setAccionLoading(true);
    try {
      const { data } = await api.patch(`/ventas/${detalle.id}/estado`, {
        estado: accionTipo,
        motivo: accionMotivo.trim()
      });

      const nuevoEstado = data.estado || accionTipo;
      const nuevoMotivo = data.motivo_estado || accionMotivo.trim();

      setDetalle((prev) => prev ? { ...prev, estado: nuevoEstado, motivo_estado: nuevoMotivo } : prev);
      setVentas((prev) => prev.map((v) => v.id === detalle.id ? { ...v, estado: nuevoEstado, motivo_estado: nuevoMotivo } : v));
      setAccionTipo('');
      setAccionMotivo('');
      showToast(`Venta marcada como ${nuevoEstado}.`, 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'No se pudo actualizar el estado de la venta.');
    } finally {
      setAccionLoading(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => { fetchVentas(); }, []);

  const filtrados = ventas.filter((v) => {
    const q = busqueda.toLowerCase();
    return (
      v.id.toString().includes(busqueda) ||
      v.vendedor.toLowerCase().includes(q) ||
      (v.cliente || '').toLowerCase().includes(q) ||
      (v.cliente_documento || '').includes(busqueda) ||
      (v.marca_tarjeta || '').toLowerCase().includes(q)
    );
  });

  const methodClass = (metodo) => {
    const m = (metodo || '').toLowerCase();
    if (m === 'efectivo') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (m === 'yape' || m === 'plin') return 'bg-sky-50 text-sky-700 border-sky-200';
    return 'bg-violet-50 text-violet-700 border-violet-200';
  };

  const statusClass = (estado) => {
    const s = (estado || 'PROCESADA').toLowerCase();
    if (s === 'cancelada') return 'bg-red-100 text-red-700 border-red-300';
    if (s === 'ncr') return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  };

  const statusLabel = (estado) => {
    const s = (estado || 'PROCESADA').toUpperCase();
    if (s === 'PROCESADA') return 'REALIZADA';
    return s;
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-150px)] flex-col gap-4 animate-in fade-in duration-500 xl:h-[calc(100vh-140px)] xl:flex-row">
      {toast && (
        <div className="fixed right-6 top-6 z-[60] w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
          <div className={`h-1 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <div className="flex items-start gap-3 px-4 py-3">
            <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black uppercase ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {toast.type === 'success' ? 'OK' : '!'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                {toast.type === 'success' ? 'Operación completada' : 'Atención'}
              </p>
              <p className="mt-1 text-sm font-medium leading-5 text-slate-900">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cerrar mensaje"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      
      {/* LISTADO DE VENTAS */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex min-h-[420px] flex-col overflow-hidden shadow-sm">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col justify-between gap-3 sm:flex-row sm:items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-[0.2em]">Historial de Ventas</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registro de transacciones procesadas</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por ID, vendedor o cliente..."
              className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-wider outline-none focus:border-slate-700"
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">ID</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Fecha / Hora</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Vendedor</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Cliente</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Método</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Estado</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Tarjeta</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="9" className="p-20 text-center"><Loader2 className="animate-spin inline-block text-slate-300" size={26} /></td></tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-16 text-center text-slate-500 font-semibold">No hay ventas para mostrar con ese filtro.</td>
                </tr>
              ) : filtrados.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="p-5 text-[11px] font-black text-slate-900 tracking-widest">#{v.id}</td>
                  <td className="p-5">
                    <div className="space-y-1 text-[10px] font-bold text-slate-500 uppercase">
                      <div className="flex items-center gap-2"><Calendar size={12}/> {new Date(v.fecha).toLocaleDateString()}</div>
                      <div className="flex items-center gap-2"><Clock size={12}/> {new Date(v.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </td>
                  <td className="p-5 text-[10px] font-black uppercase text-slate-900">{v.vendedor}</td>
                  <td className="p-5">
                    <p className="text-[10px] font-black uppercase text-slate-900">{v.cliente || 'CLIENTE GENÉRICO'}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">DOC: {v.cliente_documento || '-'}</p>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider border px-2.5 py-1 rounded ${methodClass(v.metodo_pago)}`}>
                      <CreditCard size={10} /> {v.metodo_pago}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider border px-2.5 py-1 rounded ${statusClass(v.estado)}`}>
                      {statusLabel(v.estado)}
                    </span>
                  </td>
                  <td className="p-5">
                    {String(v.metodo_pago || '').toLowerCase() === 'tarjeta' ? (
                      <span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider border border-slate-300 bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
                        {v.marca_tarjeta || '-'}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-300">-</span>
                    )}
                  </td>
                  <td className="p-5 text-right font-black text-base text-slate-900">S/ {parseFloat(v.total).toFixed(2)}</td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => verDetalle(v)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-colors"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL DETALLE LATERAL (SIDEBAR DETALLE) */}
      <div className={`fixed inset-0 z-50 m-3 rounded-2xl bg-gradient-to-b from-slate-950 to-black text-white transition-all duration-300 transform border border-slate-800 shadow-2xl ${detalle ? 'flex flex-col translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'} xl:relative xl:inset-auto xl:z-auto xl:m-0 xl:w-[400px] ${detalle ? 'xl:flex xl:flex-col' : 'xl:hidden'}`}>
        {detalle && (
          <>
            <div className="p-7 border-b border-slate-800 flex justify-between items-center bg-black/40">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em]">Detalle de Operación</h2>
              <button onClick={() => setDetalle(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-7 space-y-7">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ID Transacción</span>
                  <span className="text-sm font-black text-white">#{detalle.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vendedor</span>
                  <span className="text-sm font-black text-white uppercase">{detalle.vendedor}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cliente</span>
                  <span className="text-sm font-black text-white uppercase text-right">{detalle.cliente || 'CLIENTE GENÉRICO'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Documento</span>
                  <span className="text-sm font-black text-white uppercase">{detalle.cliente_documento || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado</span>
                  <span className={`text-[10px] font-black uppercase border px-2 py-1 rounded ${statusClass(detalle.estado)}`}>
                    {statusLabel(detalle.estado)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comprobante</span>
                  <span className="text-sm font-black text-white uppercase">{detalle.codigo_comprobante || '-'}</span>
                </div>
                {String(detalle.metodo_pago || '').toLowerCase() === 'tarjeta' && (
                  <div className="flex justify-between border-b border-slate-800 pb-4">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Marca tarjeta</span>
                    <span className="text-sm font-black text-white uppercase">{detalle.marca_tarjeta || '-'}</span>
                  </div>
                )}
                {!!detalle.motivo_estado && (
                  <div className="border-b border-slate-800 pb-4">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivo</p>
                    <p className="text-xs text-slate-200 leading-relaxed">{detalle.motivo_estado}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Items Vendidos</p>
                {loadingDetalle ? <Loader2 className="animate-spin text-slate-700" /> : (
                  detalle.productos.map((p, i) => (
                    <div key={i} className="bg-slate-900/70 p-4 border border-slate-800 rounded-lg">
                      <p className="text-[10px] font-black uppercase text-white truncate">{p.producto_nombre}</p>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{p.cantidad} UNID. x S/ {parseFloat(p.precio_unitario).toFixed(2)}</span>
                        <span className="text-xs font-black text-white">S/ {parseFloat(p.subtotal).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-7 bg-black/40 border-t border-slate-800">
              {(detalle.estado || 'PROCESADA') === 'PROCESADA' && (
                <div className="mb-6 space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestión de venta</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => abrirAccion('CANCELADA')}
                      className={`rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${accionTipo === 'CANCELADA' ? 'border-red-400 bg-red-500/20 text-red-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                    >
                      Cancelar compra
                    </button>
                    <button
                      onClick={() => abrirAccion('NCR')}
                      className={`rounded-md border px-3 py-2 text-[10px] font-black uppercase tracking-wider ${accionTipo === 'NCR' ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                    >
                      Emitir NCR
                    </button>
                  </div>
                  {accionTipo && (
                    <>
                      <textarea
                        value={accionMotivo}
                        onChange={(e) => setAccionMotivo(e.target.value)}
                        placeholder="Escribe el motivo..."
                        className="min-h-[84px] w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={ejecutarAccionEstado}
                        disabled={accionLoading}
                        className="w-full rounded-md bg-cyan-500 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:bg-cyan-400 disabled:opacity-60"
                      >
                        {accionLoading ? 'Procesando...' : `Confirmar ${accionTipo}`}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between items-end mb-6">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Total Liquidado</span>
                <span className="text-4xl font-black text-white tracking-tighter">S/ {parseFloat(detalle.total).toFixed(2)}</span>
              </div>
              <button className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 py-4 text-[9px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all border border-slate-800">
                <FileText size={16} /> Exportar Ticket (PDF)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
