import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Wallet,
  UserRound,
  CreditCard,
  Clock3,
  BarChart3,
  ShieldCheck,
  Package2
} from 'lucide-react';
import api from '../../api/apiClient';
import useAuthStore from '../../store/useAuthStore';

export default function DashboardHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.nombre?.split(' ')[0] || 'Usuario';
  const [summary, setSummary] = useState({
    totalVentasHoy: 0,
    totalVentasMes: 0,
    cantidadVentasHoy: 0,
    cantidadVentasMes: 0,
    ticketPromedioHoy: 0,
    ticketPromedioMes: 0,
    totalCases: 0,
    stockCritico: 0,
    recentSales: [],
    criticalProducts: [],
    salesByMethod: [],
    topSellerMonth: null,
  });

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await api.get('/dashboard/summary');
        setSummary({
          totalVentasHoy: Number(data.totalVentasHoy) || 0,
          totalVentasMes: Number(data.totalVentasMes) || 0,
          cantidadVentasHoy: Number(data.cantidadVentasHoy) || 0,
          cantidadVentasMes: Number(data.cantidadVentasMes) || 0,
          ticketPromedioHoy: Number(data.ticketPromedioHoy) || 0,
          ticketPromedioMes: Number(data.ticketPromedioMes) || 0,
          totalCases: Number(data.totalCases) || 0,
          stockCritico: Number(data.stockCritico) || 0,
          recentSales: Array.isArray(data.recentSales) ? data.recentSales : [],
          criticalProducts: Array.isArray(data.criticalProducts) ? data.criticalProducts : [],
          salesByMethod: Array.isArray(data.salesByMethod) ? data.salesByMethod : [],
          topSellerMonth: data.topSellerMonth || null,
        });
      } catch (error) {
        console.error('Error al cargar resumen del dashboard:', error);
      }
    };

    loadSummary();
  }, []);

  const stats = [
    {
      name: 'Ventas Hoy',
      value: `S/ ${summary.totalVentasHoy.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.cantidadVentasHoy} operaciones`,
      icon: Wallet,
      trend: '+0%',
      isPositive: true,
    },
    {
      name: 'Ventas Mes',
      value: `S/ ${summary.totalVentasMes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `${summary.cantidadVentasMes} operaciones`,
      icon: TrendingUp,
      trend: '+0%',
      isPositive: true,
    },
    { name: 'Stock Total', value: `${summary.totalCases} unidades`, sub: 'Inventario activo', icon: Package2, trend: '+0%', isPositive: true },
    { name: 'Alertas Críticas', value: `${summary.stockCritico}`, sub: 'Productos por debajo del umbral', icon: AlertTriangle, trend: '+0%', isPositive: true },
  ];

  const quickActions = [
    { label: 'Nueva Venta', icon: ShoppingBag, path: '/ventas/nueva' },
    { label: 'Productos', icon: Package, path: '/inventario/productos' },
    { label: 'Reportes', icon: FileText, path: '/reportes' },
    { label: 'Stock Crítico', icon: AlertTriangle, path: '/inventario/alerta' },
  ];

  const formatRelativeTime = (value) => {
    if (!value) return 'hace poco';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'hace poco';

    const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'hace unos segundos';
    if (diffMinutes < 60) return `hace ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;

    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays} d`;
  };

  const recentActivity = summary.recentSales.map((sale) => ({
    label: `Venta #${sale.id}`,
    description: `${sale.cliente} · ${sale.vendedor}`,
    time: formatRelativeTime(sale.fecha),
    status: String(sale.estado || '').toUpperCase() === 'PROCESADA' ? 'completado' : 'pendiente',
  }));

  const paymentMethods = useMemo(() => summary.salesByMethod.map((method) => ({
    name: method.metodo_pago,
    amount: Number(method.monto) || 0,
    count: Number(method.cantidad) || 0,
  })), [summary.salesByMethod]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Panel Ejecutivo</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">Resumen Operativo</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Bienvenido, {firstName}. Este es el estado comercial y operativo del día.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
            <ShieldCheck size={14} /> Operacion monitoreada
          </div>
        </div>
      </section>

      {/* Indicadores Principales */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <stat.icon size={18} />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 mb-2">
              {stat.name}
            </p>
            <p className="text-2xl font-black text-zinc-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Acciones Rápidas */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Acciones Directas</h2>
            <BarChart3 size={14} className="text-zinc-400" />
          </div>
          <div className="space-y-2.5">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <action.icon size={18} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-zinc-900">{action.label}</span>
                    <span className="text-[10px] font-medium text-zinc-500">Acceso inmediato</span>
                  </div>
                </div>
                <span className="text-zinc-400">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actividad Reciente y Stock */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stock Crítico */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Estado de Inventario</h2>
              <Package size={14} className="text-zinc-400" />
            </div>
            {summary.criticalProducts.length > 0 ? (
              <div className="space-y-3">
                {summary.criticalProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-zinc-900">{product.nombre}</p>
                      <p className="truncate text-xs text-zinc-500">{product.modelo_celular}</p>
                    </div>
                    <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-700">
                      {product.stock} uds
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center text-zinc-500">
                <div>
                  <Package className="mx-auto mb-2 opacity-30" size={32} />
                  <p className="text-sm font-bold">Inventario en orden</p>
                  <p className="mt-1 text-xs text-zinc-400">Sin alertas activas</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Canales de Pago</h2>
                <CreditCard size={14} className="text-zinc-400" />
              </div>
              <div className="space-y-3">
                {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                  <div key={method.name} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{method.name}</p>
                      <p className="text-sm font-black text-zinc-900">S/ {method.amount.toFixed(2)}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-zinc-900"
                        style={{ width: `${Math.max(12, (method.amount / Math.max(...paymentMethods.map((item) => item.amount), 1)) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{method.count} operaciones</p>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                    Sin movimientos por canal de pago.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Vendedor del Mes</h2>
                <UserRound size={14} className="text-zinc-400" />
              </div>
              {summary.topSellerMonth ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{summary.topSellerMonth.nombre}</p>
                  <p className="mt-1 text-xs text-zinc-500">{summary.topSellerMonth.ventas} ventas registradas</p>
                  <p className="mt-3 text-2xl font-black text-zinc-900">S/ {Number(summary.topSellerMonth.monto || 0).toFixed(2)}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Monto acumulado del mes</p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
                  Aún no hay ventas suficientes para calcular el vendedor del mes.
                </div>
              )}
            </div>
          </div>

          {/* Actividad */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Actividad Reciente</h2>
              <Clock3 size={14} className="text-zinc-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b border-zinc-100 last:border-0 last:pb-0">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${activity.status === 'completado' ? 'bg-zinc-900' : 'bg-zinc-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900">{activity.label}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{activity.description}</p>
                  </div>
                  <p className="flex-shrink-0 whitespace-nowrap text-[10px] text-zinc-400">{activity.time}</p>
                </div>
              )) : (
                <div className="flex items-center justify-center py-8 text-center text-zinc-500">
                  <div>
                    <FileText className="mx-auto mb-2 opacity-30" size={32} />
                    <p className="text-sm font-bold">Sin actividad reciente</p>
                    <p className="mt-1 text-xs text-zinc-400">Las nuevas ventas aparecerán aquí</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
