import { ShieldAlert, ArrowLeft, LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SinPermisos() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Acceso restringido</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">No tienes permisos para entrar aquí</h1>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole size={18} className="mt-0.5 text-zinc-500" />
            <p className="text-sm leading-6 text-zinc-600">
              Tu cuenta no tiene el rol necesario para acceder a esta sección. Si crees que esto es un error, contacta con el administrador del sistema.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-100"
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
