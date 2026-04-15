import { useState, useEffect } from 'react';
import { UserPlus, Shield, Power, Loader2, X, Trash2 } from 'lucide-react';
import api from '../../api/apiClient';
import FeedbackToast from '../../components/FeedbackToast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'VENDEDOR'
  });

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch (e) {
      console.error(e);
      setToast({ type: 'error', message: 'No se pudo cargar la lista de usuarios.' });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      await api.put(`/usuarios/estado/${id}`, { estado: nuevoEstado });
      setToast({ type: 'success', message: `Usuario ${nuevoEstado.toLowerCase()} correctamente.` });
      fetchUsuarios();
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.message || 'Error al cambiar estado.' });
    }
  };

  const openCreateModal = () => {
    setForm({ nombre: '', email: '', password: '', rol: 'VENDEDOR' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (!savingUser) setShowCreateModal(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    const nombre = form.nombre.trim();
    const email = form.email.trim();

    if (!nombre || !email || !form.password) {
      setToast({ type: 'error', message: 'Completa todos los campos para registrar el usuario.' });
      return;
    }

    if (form.password.length < 6) {
      setToast({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setSavingUser(true);
    try {
      await api.post('/auth/register', {
        nombre,
        email,
        password: form.password,
        rol: form.rol
      });

      setToast({ type: 'success', message: 'Usuario registrado exitosamente.' });
      setShowCreateModal(false);
      await fetchUsuarios();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'No se pudo registrar el usuario.' });
    } finally {
      setSavingUser(false);
    }
  };

  const openDeleteDialog = (user) => {
    setDeleteDialog({ open: true, userId: user.id, userName: user.nombre });
  };

  const closeDeleteDialog = () => {
    if (deletingUserId) return;
    setDeleteDialog({ open: false, userId: null, userName: '' });
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    setDeletingUserId(deleteDialog.userId);
    try {
      const { data } = await api.delete(`/usuarios/${deleteDialog.userId}`);
      setToast({
        type: 'success',
        message: data?.message || 'Operación completada correctamente.'
      });
      setDeleteDialog({ open: false, userId: null, userName: '' });
      await fetchUsuarios();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'No se pudo eliminar el usuario.' });
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Administración interna</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.12em] text-zinc-900">Gestión de Personal</h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Control de acceso y roles ⬢ CaseNova</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-1">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
            >
              <UserPlus size={14} /> Registrar Usuario
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Usuario</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rol</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Estado</th>
              <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin inline-block text-zinc-300" size={30} /></td></tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-12 text-center text-sm font-semibold text-zinc-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : usuarios.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-zinc-50/70">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-950 text-xs font-black uppercase text-white">
                      {user.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-zinc-900">{user.nombre}</p>
                      <p className="text-[10px] font-semibold text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Shield size={13} className={String(user.rol || '').toLowerCase().includes('admin') ? 'text-zinc-900' : 'text-zinc-400'} />
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-800">{user.rol}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                    user.estado === 'Activo' ? 'border-zinc-300 bg-zinc-100 text-zinc-800' : 'border-zinc-200 bg-white text-zinc-500'
                  }`}>
                    {user.estado}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button 
                      onClick={() => toggleEstado(user.id, user.estado)}
                      className={`rounded-lg border p-2 transition ${user.estado === 'Activo' ? 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900' : 'border-zinc-200 text-zinc-400 hover:border-zinc-700 hover:text-zinc-700'}`}
                      title={user.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(user)}
                      className="rounded-lg border border-zinc-200 p-2 text-zinc-400 transition hover:border-rose-300 hover:text-rose-600"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Nuevo usuario</p>
                <h3 className="mt-1 text-base font-black uppercase tracking-[0.08em] text-white">Registro de personal</h3>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Cerrar formulario de registro"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 px-6 py-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Nombre completo</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:bg-white"
                  placeholder="Ej. Juan Perez"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Correo</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:bg-white"
                    placeholder="usuario@casenova.com"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Rol</label>
                  <select
                    value={form.rol}
                    onChange={(e) => setForm((prev) => ({ ...prev, rol: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:bg-white"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Contrasena</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:bg-white"
                  placeholder="Minimo 6 caracteres"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={savingUser}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingUser ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {savingUser ? 'Registrando' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FeedbackToast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={deleteDialog.open}
        title="Eliminar usuario"
        message={`Se eliminara el usuario ${deleteDialog.userName}. Si tiene ventas o dependencias bloqueantes, no se podra completar la eliminacion.`}
        confirmLabel={deletingUserId ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteUser}
        variant="danger"
      />
    </div>
  );
}
