import { X, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function FeedbackToast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const toneClasses = isSuccess
    ? 'border-emerald-200 bg-white shadow-[0_20px_60px_-20px_rgba(16,185,129,0.35)]'
    : 'border-rose-200 bg-white shadow-[0_20px_60px_-20px_rgba(244,63,94,0.35)]';

  return (
    <div className={`fixed right-6 top-6 z-[60] w-[320px] overflow-hidden rounded-2xl border ${toneClasses}`}>
      <div className={`h-1 ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black uppercase ${isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isSuccess ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            {isSuccess ? 'Operación realizada' : 'Requiere atención'}
          </p>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-900">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar mensaje"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
