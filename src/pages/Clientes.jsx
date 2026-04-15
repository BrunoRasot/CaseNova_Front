import { useState, useEffect } from 'react';
import { UserPlus, Search, Loader2, Mail, Phone, Trash2, X, CheckCircle2, Users } from 'lucide-react';
import api from '../api/apiClient';
import FeedbackToast from '../components/FeedbackToast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCliente, setNewCliente] = useState({ dni_ruc: '', nombre: '', telefono: '', email: '' });
  const [toast, setToast] = useState(null);
  const [clienteEliminar, setClienteEliminar] = useState(null);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const fetchClientes = async () => {
    try {
      const { data } = await api.get('/clientes');
      setClientes(data);
    } catch (e) { console.error("Error de sincronización"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClientes(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.post('/clientes', newCliente);
      setIsModalOpen(false);
      setNewCliente({ dni_ruc: '', nombre: '', telefono: '', email: '' });
      fetchClientes();
      showToast('Cliente registrado correctamente.', 'success');
    } catch (e) {
      showToast(e.response?.data?.message || 'No fue posible guardar el cliente.');
    } finally { setIsSaving(false); }
  };

  const eliminarCliente = async (id) => {
    try {
      await api.delete(`/clientes/${id}`);
      fetchClientes();
      showToast('Cliente eliminado correctamente.', 'success');
    } catch (e) { showToast(e.response?.data?.message || 'No fue posible eliminar el cliente.'); }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filtrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.dni_ruc.includes(busqueda)
  );

  const totalClientes = clientes.length;
  const clientesConCorreo = clientes.filter((c) => c.email).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 md:p-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-100/60 blur-2xl" />
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Gestor Comercial</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Clientes</h1>
            <p className="mt-2 text-sm text-slate-600">Administra tu base de clientes y mantén sus datos listos para ventas.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 md:w-auto"
          >
            <UserPlus size={15} /> Nuevo Cliente
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Clientes</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{totalClientes}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Con Correo</p>
          <p className="mt-3 text-3xl font-black text-slate-900">{clientesConCorreo}</p>
        </article>
      </section>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por DNI/RUC o nombre..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Documento</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nombre</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Contacto</th>
              <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-20 text-center">
                  <Loader2 className="animate-spin inline-block text-slate-300" size={32} />
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-14 text-center text-slate-500">
                  <Users className="mx-auto mb-3 text-slate-300" size={28} />
                  <p className="text-sm font-semibold">No se encontraron clientes</p>
                </td>
              </tr>
            ) : filtrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-5 font-black text-[11px] text-slate-900 uppercase tracking-widest">{c.dni_ruc || '-'}</td>
                <td className="p-5 font-black text-[12px] text-slate-900 uppercase tracking-tight">{c.nombre}</td>
                <td className="p-5 text-[10px] font-bold text-slate-500 uppercase">
                  <div className="flex items-center gap-2"><Phone size={12}/> {c.telefono || '-'}</div>
                  <div className="flex items-center gap-2"><Mail size={12}/> {c.email || '-'}</div>
                </td>
                <td className="p-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setClienteEliminar(c)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition hover:bg-red-100 inline-flex items-center gap-1"><Trash2 size={13} />Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <FeedbackToast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={!!clienteEliminar}
        title="Eliminar cliente"
        message={`¿Deseas eliminar ${clienteEliminar?.nombre || 'este cliente'}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onClose={() => setClienteEliminar(null)}
        onConfirm={async () => {
          const cliente = clienteEliminar;
          setClienteEliminar(null);
          if (cliente) await eliminarCliente(cliente.id);
        }}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-black uppercase tracking-[0.25em] text-slate-900">Registrar Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-7 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">DNI / RUC</label>
                  <input 
                    required 
                    maxLength={11}
                    value={newCliente.dni_ruc}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-700 font-semibold text-sm"
                    onChange={e => setNewCliente({...newCliente, dni_ruc: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Teléfono</label>
                  <input 
                    value={newCliente.telefono}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-700 font-semibold text-sm"
                    onChange={e => setNewCliente({...newCliente, telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nombre Completo / Razón Social</label>
                <input 
                  required 
                  value={newCliente.nombre}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-700 font-semibold text-sm uppercase"
                  onChange={e => setNewCliente({...newCliente, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Correo Electrónico</label>
                <input 
                  type="email"
                  value={newCliente.email}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-700 font-semibold text-sm"
                  onChange={e => setNewCliente({...newCliente, email: e.target.value})}
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="rounded-lg bg-slate-900 text-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <><CheckCircle2 size={16}/> Guardar Cliente</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
