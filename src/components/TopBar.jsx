import React from 'react';
import { Menu } from 'lucide-react';

export default function TopBar({ onMenuClick }) {
  return (
    <header className="h-14 shrink-0 border-b border-[#1e293b] bg-gradient-to-r from-[#020b1a] via-[#0b1f3a] to-[#020b1a] px-3 sm:px-6 text-white">
      <div className="flex h-full items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#334155] bg-[#0f172a]/70 text-slate-200 transition hover:bg-[#1e293b] hover:text-white lg:hidden"
          aria-label="Abrir sidebar"
        >
          <Menu size={18} />
        </button>
        <span className="ml-auto hidden rounded-full border border-[#334155] bg-[#0f172a]/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-200 sm:inline-flex">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>
    </header>
  );
}