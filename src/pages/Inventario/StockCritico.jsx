import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ArrowRight, Package, TrendingDown, ShieldAlert } from 'lucide-react';
import api from '../../api/apiClient';

export default function StockCritico() {
  const [criticos, setCriticos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const totalCriticos = criticos.length;

  const getProgress = (stock, stockMinimo) => {
    const minimo = Number(stockMinimo) || 0;
    const actual = Number(stock) || 0;

    if (minimo <= 0) return 0;

    return Math.max(8, Math.min((actual / minimo) * 100, 100));
  };

  const fetchCriticos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/productos/critico');
      setCriticos(data);
    } catch (e) {
      console.error('Fallo al sincronizar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCriticos(); }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-white px-6 py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-700">
                <ShieldAlert size={12} />
                Reposicion prioritaria
              </div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">Stock critico</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
                Productos que tocaron o pasaron su umbral minimo. Revisa primero los de mayor riesgo de quiebre.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchCriticos}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-300 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-900 p-2 text-white">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Productos en alerta</p>
                <p className="mt-1 text-2xl font-black text-zinc-900">{totalCriticos}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-900 p-2 text-white">
                <TrendingDown size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nivel de riesgo</p>
                <p className="mt-1 text-sm font-bold text-zinc-900">Revision inmediata</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-900 p-2 text-white">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Accion sugerida</p>
                <p className="mt-1 text-sm font-bold text-zinc-900">Generar orden de compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 p-3">
        {criticos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600 shadow-sm">
              <Package size={28} />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-zinc-500">Inventario saludable</p>
            <h3 className="mt-2 text-xl font-bold text-zinc-950">No hay alertas activas</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">
              Todo el stock se mantiene dentro del rango de seguridad. Este panel se actualizara cuando detecte productos por debajo del minimo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {criticos.map((prod) => {
              const progress = getProgress(prod.stock, prod.stock_minimo);

              return (
                <div
                  key={prod.id}
                  className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                        #{prod.id}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-black uppercase tracking-tight text-zinc-950">{prod.nombre}</p>
                          <span className="rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">
                            Critico
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                          {prod.marca_celular} · {prod.modelo_celular}
                        </p>

                        <div className="mt-4 w-full max-w-md">
                          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            <span>Stock actual</span>
                            <span>Minimo: {prod.stock_minimo}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-zinc-900 to-zinc-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-start lg:self-center">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Disponibles</p>
                        <div className="mt-2 flex items-end justify-end gap-2">
                          <span className="text-3xl font-black leading-none text-zinc-900">{prod.stock}</span>
                          <span className="pb-0.5 text-xs font-bold uppercase tracking-[0.2em] text-zinc-300">/ {prod.stock_minimo}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/inventario/productos')}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-700 transition hover:border-zinc-900 hover:bg-zinc-900 hover:text-white"
                        aria-label={`Ir a productos para revisar ${prod.nombre}`}
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {criticos.length > 0 && (
        <div className="border-t border-zinc-200 bg-white px-6 py-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">
            Se requieren {criticos.length} ordenes de compra
          </p>
        </div>
      )}
    </div>
  );
}

