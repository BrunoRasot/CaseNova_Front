import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  PieChart,
  ArrowUpRight,
  Wallet,
  Users,
  CalendarDays,
  Search,
  X,
  Loader2
} from 'lucide-react';
import api from '../api/apiClient';
import ConfirmDialog from '../components/ConfirmDialog';

const toDateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const formatDate = (value) => new Date(value).toLocaleDateString('es-PE');

export default function Reportes() {
  const [data, setData] = useState({
    resumen: { total_ventas: 0, ingresos_totales: 0, ticket_promedio: 0 },
    topProductos: [],
    metodosPago: [],
    ventasVendedorDia: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('ALL');
  const [filtroVendedor, setFiltroVendedor] = useState('ALL');
  const [busqueda, setBusqueda] = useState('');
  const [sellerModal, setSellerModal] = useState({ open: false, vendedor: '', ventas: [], loading: false, error: '' });

  useEffect(() => {
    const fetchReportes = async () => {
      try {
        const { data } = await api.get('/reportes/general');
        setData({
          resumen: {
            total_ventas: Number(data?.resumen?.total_ventas) || 0,
            ingresos_totales: Number(data?.resumen?.ingresos_totales) || 0,
            ticket_promedio: Number(data?.resumen?.ticket_promedio) || 0,
          },
          topProductos: Array.isArray(data?.topProductos) ? data.topProductos : [],
          metodosPago: Array.isArray(data?.metodosPago) ? data.metodosPago : [],
          ventasVendedorDia: Array.isArray(data?.ventasVendedorDia) ? data.ventasVendedorDia : [],
        });
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar los reportes.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportes();
  }, []);

  const ingresos = Number(data.resumen?.ingresos_totales) || 0;
  const transacciones = Number(data.resumen?.total_ventas) || 0;
  const ticketPromedio = Number(data.resumen?.ticket_promedio) || 0;
  const maxVendidos = Number(data.topProductos?.[0]?.vendidos) || 1;
  const maxMetodoPago = Math.max(...(data.metodosPago.map((m) => Number(m.monto) || 0)), 1);

  const rows = useMemo(
    () => data.ventasVendedorDia.map((row) => {
      const totalVentasDia = Number(row.total_ventas_dia) || 0;
      const montoVentasDia = Number(row.monto_ventas_dia) || 0;

      return {
        ...row,
        fechaKey: toDateKey(row.fecha),
        fechaLabel: formatDate(row.fecha),
        totalVentasDia,
        montoVentasDia,
        ticketVendedorDia: totalVentasDia > 0 ? montoVentasDia / totalVentasDia : 0,
      };
    }),
    [data.ventasVendedorDia]
  );

  const fechasDisponibles = useMemo(() => {
    const keys = [...new Set(rows.map((r) => r.fechaKey))];
    return keys.sort((a, b) => new Date(b) - new Date(a));
  }, [rows]);

  const vendedoresDisponibles = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.vendedor))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return rows.filter((r) => {
      if (filtroFecha !== 'ALL' && r.fechaKey !== filtroFecha) return false;
      if (filtroVendedor !== 'ALL' && r.vendedor !== filtroVendedor) return false;

      if (!q) return true;
      return r.vendedor.toLowerCase().includes(q) || r.fechaLabel.includes(q);
    });
  }, [rows, filtroFecha, filtroVendedor, busqueda]);

  const totalVentasFiltradas = filteredRows.reduce((acc, r) => acc + r.totalVentasDia, 0);
  const totalMontoFiltrado = filteredRows.reduce((acc, r) => acc + r.montoVentasDia, 0);
  const ticketPromedioFiltrado = totalVentasFiltradas > 0 ? totalMontoFiltrado / totalVentasFiltradas : 0;

  const vendedorTopFiltrado = filteredRows.slice().sort((a, b) => b.montoVentasDia - a.montoVentasDia)[0];

  const rowsConParticipacion = filteredRows.map((r) => ({
    ...r,
    participacion: totalMontoFiltrado > 0 ? (r.montoVentasDia / totalMontoFiltrado) * 100 : 0,
  }));

  const printCierreDia = () => {
    const now = new Date();
    const fecha = now.toLocaleDateString('es-PE');
    const hora = now.toLocaleTimeString('es-PE');

    const rowsHtml = rowsConParticipacion.length
      ? rowsConParticipacion
          .map((row) => `
            <tr>
              <td>${row.fechaLabel}</td>
              <td>${row.vendedor}</td>
              <td style="text-align:right;">${row.totalVentasDia}</td>
              <td style="text-align:right;">S/ ${row.montoVentasDia.toFixed(2)}</td>
              <td style="text-align:right;">S/ ${row.ticketVendedorDia.toFixed(2)}</td>
              <td style="text-align:right;">${row.participacion.toFixed(2)}%</td>
            </tr>
          `)
          .join('')
      : '<tr><td colspan="6" style="text-align:center;">Sin ventas para el filtro actual.</td></tr>';

    const html = `
      <html>
        <head>
          <title>Cierre Diario - CaseNova</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1, p { margin: 0; }
            .header { margin-bottom: 18px; }
            .muted { color: #64748b; font-size: 12px; }
            .kpis { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 16px 0; }
            .kpi { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
            .kpi-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: .08em; }
            .kpi-value { font-size: 20px; font-weight: 800; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 12px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: .08em; font-size: 10px; color: #475569; text-align: left; }
            .section-title { margin-top: 14px; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
            .footer { margin-top: 18px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Cierre Diario de Ventas</h1>
            <p class="muted">CaseNova ERP</p>
            <p class="muted">Fecha: ${fecha} | Hora: ${hora}</p>
          </div>

          <div class="kpis">
            <div class="kpi">
              <div class="kpi-label">Ventas del periodo</div>
              <div class="kpi-value">${totalVentasFiltradas}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Total vendido</div>
              <div class="kpi-value">S/ ${totalMontoFiltrado.toFixed(2)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Ticket promedio</div>
              <div class="kpi-value">S/ ${ticketPromedioFiltrado.toFixed(2)}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Vendedores activos</div>
              <div class="kpi-value">${new Set(rowsConParticipacion.map((r) => r.vendedor)).size}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Top vendedor</div>
              <div class="kpi-value">${vendedorTopFiltrado ? vendedorTopFiltrado.vendedor : 'N/A'}</div>
            </div>
            <div class="kpi">
              <div class="kpi-label">Top venta diaria</div>
              <div class="kpi-value">S/ ${vendedorTopFiltrado ? vendedorTopFiltrado.montoVentasDia.toFixed(2) : '0.00'}</div>
            </div>
          </div>

          <div class="section-title">Detalle por vendedor</div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th style="text-align:right;">Ventas</th>
                <th style="text-align:right;">Venta diaria</th>
                <th style="text-align:right;">Ticket dia</th>
                <th style="text-align:right;">Participacion</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="section-title">Metodos de pago del periodo</div>
          <table>
            <thead>
              <tr>
                <th>Metodo</th>
                <th style="text-align:right;">Operaciones</th>
                <th style="text-align:right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${data.metodosPago.length
                ? data.metodosPago
                    .map((m) => `<tr><td>${m.metodo_pago}</td><td style="text-align:right;">${m.cantidad}</td><td style="text-align:right;">S/ ${(Number(m.monto) || 0).toFixed(2)}</td></tr>`)
                    .join('')
                : '<tr><td colspan="3" style="text-align:center;">Sin datos disponibles.</td></tr>'}
            </tbody>
          </table>

          <p class="footer">Documento generado automaticamente por CaseNova ERP.</p>
        </body>
      </html>
    `;

    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(frame);
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();

      setTimeout(() => {
        if (document.body.contains(frame)) {
          document.body.removeChild(frame);
        }
      }, 800);
    };
  };

  const openSellerSales = async (vendedor) => {
    setSellerModal({ open: true, vendedor, ventas: [], loading: true, error: '' });

    try {
      const { data } = await api.get('/ventas/historial');
      const ventas = Array.isArray(data)
        ? data
            .filter((v) => String(v.vendedor || '').toLowerCase() === String(vendedor || '').toLowerCase())
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        : [];

      setSellerModal({ open: true, vendedor, ventas, loading: false, error: '' });
    } catch (err) {
      setSellerModal({
        open: true,
        vendedor,
        ventas: [],
        loading: false,
        error: err.response?.data?.message || 'No se pudieron cargar las ventas del vendedor.'
      });
    }
  };

  const closeSellerModal = () => {
    setSellerModal({ open: false, vendedor: '', ventas: [], loading: false, error: '' });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50 p-10 text-center">
        <p className="animate-pulse text-xs font-black uppercase tracking-[0.35em] text-slate-500">Generando inteligencia de datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 text-center text-rose-700">
        <p className="text-sm font-black uppercase tracking-[0.28em]">Error al cargar reportes</p>
        <p className="mt-2 text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5 md:px-8 md:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Business Intelligence</p>
            <h1 className="mt-1.5 text-xl font-black tracking-tight text-slate-950 sm:text-2xl md:text-3xl">Panel de Reportes</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Vista ejecutiva del desempeno comercial con enfoque en productividad por vendedor y rendimiento diario.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600">
              <CalendarDays size={14} className="text-slate-500" />
              Corte mensual
            </div>
            <button
              type="button"
              onClick={() => setShowFinalizeDialog(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-black"
            >
              <Wallet size={14} />
              Finalizar Dia
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Ingresos</p>
            <Wallet size={16} className="text-slate-500" />
          </div>
          <p className="text-2xl font-black tracking-tight text-slate-950">S/ {ingresos.toFixed(2)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Total acumulado del mes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Transacciones</p>
            <BarChart3 size={16} className="text-slate-500" />
          </div>
          <p className="text-2xl font-black tracking-tight text-slate-950">{transacciones}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Ventas registradas en el mes</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Ticket Promedio</p>
            <ArrowUpRight size={16} className="text-slate-500" />
          </div>
          <p className="text-2xl font-black tracking-tight text-slate-950">S/ {ticketPromedio.toFixed(2)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Valor promedio por transaccion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-700">
            <Package size={16} /> Productos de Alta Rotacion
          </h3>
          <div className="space-y-3">
            {data.topProductos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                Sin productos con ventas registradas.
              </div>
            ) : (
              data.topProductos.map((prod, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-white">{i + 1}</span>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-slate-900">{prod.nombre}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{prod.modelo_celular}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900">{prod.vendidos} U.</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-500"
                      style={{ width: `${Math.max(8, (Number(prod.vendidos) / maxVendidos) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-700">
            <TrendingUp size={16} /> Flujo por Canal de Pago
          </h3>
          <div className="space-y-3">
            {data.metodosPago.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
                Sin movimientos por metodo de pago.
              </div>
            ) : (
              data.metodosPago.map((m, i) => {
                const monto = Number(m.monto) || 0;
                const porcentaje = (monto / maxMetodoPago) * 100;

                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{m.metodo_pago}</p>
                      <p className="text-sm font-black text-slate-900">S/ {monto.toFixed(2)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-slate-900 to-slate-500" style={{ width: `${Math.max(10, porcentaje)}%` }} />
                    </div>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{m.cantidad} operaciones</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-900">Productividad por Vendedor</h3>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Tabla diaria con ventas, monto, ticket por vendedor y participacion.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              <Users size={12} />
              Ranking Diario
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar vendedor o fecha..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="ALL">Todas las fechas</option>
              {fechasDisponibles.map((f) => (
                <option key={f} value={f}>{formatDate(f)}</option>
              ))}
            </select>

            <select
              value={filtroVendedor}
              onChange={(e) => setFiltroVendedor(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="ALL">Todos los vendedores</option>
              {vendedoresDisponibles.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ventas filtradas</p>
              <p className="mt-0.5 text-base font-black text-slate-900">{totalVentasFiltradas}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monto filtrado</p>
              <p className="mt-0.5 text-base font-black text-slate-900">S/ {totalMontoFiltrado.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Top vendedor filtro</p>
              <p className="mt-0.5 truncate text-base font-black uppercase text-slate-900">{vendedorTopFiltrado ? vendedorTopFiltrado.vendedor : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-white">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Fecha</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Vendedor</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Ventas Dia</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Venta Diaria</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Ticket Dia</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Participacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rowsConParticipacion.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                rowsConParticipacion.map((row, idx) => (
                  <tr key={`${row.fecha}-${row.vendedor_id}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-600">{row.fechaLabel}</td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => openSellerSales(row.vendedor)}
                        className="text-[12px] font-black uppercase tracking-wide text-slate-900 underline-offset-4 transition hover:text-black hover:underline"
                      >
                        {row.vendedor}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[12px] font-bold text-slate-800">{row.totalVentasDia}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] font-black text-slate-900">S/ {row.montoVentasDia.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right text-[12px] font-bold text-slate-700">S/ {row.ticketVendedorDia.toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-700">
                        {row.participacion.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sellerModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Detalle de ventas</p>
                <h3 className="mt-0.5 text-base font-black uppercase tracking-[0.06em] text-slate-900">{sellerModal.vendedor}</h3>
              </div>
              <button
                type="button"
                onClick={closeSellerModal}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Cerrar detalle de vendedor"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {sellerModal.loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="animate-spin" size={28} />
                </div>
              ) : sellerModal.error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm font-semibold text-rose-700">
                  {sellerModal.error}
                </div>
              ) : (
                <>
                  <div className="max-h-[70dvh] overflow-auto rounded-xl border border-slate-200 sm:max-h-[420px]">
                    <table className="w-full min-w-[640px] border-collapse">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">ID</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Fecha</th>
                          <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Metodo</th>
                          <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sellerModal.ventas.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                              Este vendedor no tiene ventas registradas.
                            </td>
                          </tr>
                        ) : (
                          sellerModal.ventas.map((venta) => (
                            <tr key={venta.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 text-sm font-black text-slate-900">#{venta.id}</td>
                              <td className="px-4 py-2.5 text-sm font-semibold text-slate-700">
                                {new Date(venta.fecha).toLocaleDateString('es-PE')} {new Date(venta.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2.5 text-sm font-semibold text-slate-700">{venta.metodo_pago || '-'}</td>
                              <td className="px-4 py-2.5 text-right text-sm font-black text-slate-900">S/ {(Number(venta.total) || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showFinalizeDialog}
        title="Finalizar dia"
        message="Se generara el cierre diario con resumen operativo y detalle por vendedor para impresion. ¿Deseas continuar?"
        confirmLabel="Imprimir cierre"
        cancelLabel="Cancelar"
        onClose={() => setShowFinalizeDialog(false)}
        onConfirm={() => {
          setShowFinalizeDialog(false);
          printCierreDia();
        }}
        variant="danger"
      />
    </div>
  );
}

