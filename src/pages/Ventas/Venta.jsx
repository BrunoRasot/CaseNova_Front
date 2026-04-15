import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Search, Loader2, DollarSign, Target, Package, Image as ImageIcon } from 'lucide-react';
import api from '../../api/apiClient';
import FeedbackToast from '../../components/FeedbackToast';

export default function NuevaVenta() {
  const [productosDB, setProductosDB] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [codigoComprobante, setCodigoComprobante] = useState('');
  const [marcaTarjeta, setMarcaTarjeta] = useState('');
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => setToast({ message, type });

  const requiereComprobante = ['Yape', 'Plin', 'Transferencia', 'Tarjeta'].includes(metodoPago);
  const requiereMarcaTarjeta = metodoPago === 'Tarjeta';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosRes, clientesRes, usuariosRes] = await Promise.allSettled([
          api.get('/productos'),
          api.get('/clientes'),
          api.get('/usuarios'),
        ]);

        if (productosRes.status === 'fulfilled') {
          setProductosDB(productosRes.value.data || []);
        } else {
          console.error('Error productos:', productosRes.reason);
        }

        if (clientesRes.status === 'fulfilled') {
          const clientesDB = clientesRes.value.data || [];
          setClientes(clientesDB);
          if (clientesDB.length) setClienteId(String(clientesDB[0].id));
        } else {
          console.error('Error clientes:', clientesRes.reason);
        }

        if (usuariosRes.status === 'fulfilled') {
          const usuariosDB = usuariosRes.value.data || [];
          const vendedoresFiltrados = Array.isArray(usuariosDB)
            ? usuariosDB.filter((u) => (u.rol === 'VENDEDOR' || u.rol === 'ADMINISTRADOR') && u.activo !== 0 && u.activo !== false)
            : [];
          setVendedores(vendedoresFiltrados);
          if (vendedoresFiltrados.length) setUsuarioId(String(vendedoresFiltrados[0].id));
        } else {
          console.error('Error usuarios:', usuariosRes.reason);
        }
      } catch (e) {
        console.error('Error inesperado de carga:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const agregarAlCarrito = (prod, cantidadSeleccionada = 1) => {
    if (prod.stock <= 0) return;
    const cantidad = Math.max(1, Number(cantidadSeleccionada) || 1);
    const existe = carrito.find(item => item.id === prod.id);
    if (existe) {
      const nuevaCantidad = Math.min(prod.stock, existe.cantidad + cantidad);
      if (nuevaCantidad === existe.cantidad) return;
      setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: nuevaCantidad } : item));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: Math.min(prod.stock, cantidad) }]);
    }
  };

  const quitarDelCarrito = (id) => setCarrito(carrito.filter(item => item.id !== id));

  const actualizarCantidadCarrito = (id, nuevaCantidad) => {
    setCarrito((prev) => prev.flatMap((item) => {
      if (item.id !== id) return [item];
      const max = Number(item.stock) || 1;
      const cantidad = Math.max(0, Math.min(Number(nuevaCantidad) || 0, max));
      if (cantidad === 0) return [];
      return [{ ...item, cantidad }];
    }));
  };

  const total = carrito.reduce((acc, item) => acc + (item.precio_venta * item.cantidad), 0);

  const finalizarVenta = async () => {
    if (carrito.length === 0) return;

    if (!usuarioId) {
      showToast('Selecciona un vendedor para continuar.');
      return;
    }

    if (requiereComprobante && !codigoComprobante.trim()) {
      showToast('Completa el código de comprobante para continuar.');
      return;
    }

    if (requiereMarcaTarjeta && !marcaTarjeta) {
      showToast('Selecciona una marca de tarjeta para continuar.');
      return;
    }

    setProcesando(true);
    try {
      await api.post('/ventas', {
        total,
        metodo_pago: metodoPago,
        codigo_comprobante: requiereComprobante ? codigoComprobante.trim() : null,
        marca_tarjeta: requiereMarcaTarjeta ? marcaTarjeta : null,
        cliente_id: clienteId ? Number(clienteId) : null,
        usuario_id: Number(usuarioId),
        productos: carrito
      });
      showToast('Venta registrada correctamente.', 'success');
      setCarrito([]);
      setCodigoComprobante('');
      setMarcaTarjeta('');
      const { data } = await api.get('/productos');
      setProductosDB(data);
    } catch (error) {
      showToast(error.response?.data?.message || 'No fue posible registrar la venta.');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filtrados = productosDB.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.modelo_celular.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getImageUrl = (imagenPath) => {
    if (!imagenPath) return null;
    if (imagenPath.startsWith('http') || imagenPath.startsWith('data:')) return imagenPath;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${imagenPath}`;
  };

  return (
    <div className="relative flex min-h-[calc(100dvh-150px)] flex-col gap-4 overflow-visible animate-in fade-in duration-300 font-sans selection:bg-black selection:text-white 2xl:h-[calc(100vh-140px)] 2xl:flex-row 2xl:overflow-hidden">
      <FeedbackToast toast={toast} onClose={() => setToast(null)} />

      <div className="flex-1 flex min-h-[420px] flex-col rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-zinc-100 bg-white/90 backdrop-blur flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por modelo o nombre..."
              className="w-full rounded-xl bg-zinc-50 border border-zinc-200 py-3 pl-11 pr-4 outline-none focus:border-black focus:bg-white transition-all text-sm font-medium placeholder:text-zinc-400"
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <div className="flex items-center gap-2">
              <Package size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{filtrados.length} Items</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-start gap-4 custom-scrollbar bg-[#F8FAFC]">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center pt-20 text-zinc-300">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando...</p>
            </div>
          ) : (
            filtrados.map(prod => (
              <div
                key={prod.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex flex-col"
              >
                <div className="relative flex h-48 w-full items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-slate-100">
                  {prod.imagen ? (
                    <img
                      src={getImageUrl(prod.imagen)}
                      alt={prod.nombre}
                      className="max-h-full max-w-full object-contain p-4 transition duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <ImageIcon size={32} className="text-slate-300" />
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${prod.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {prod.stock <= 5 ? 'Crítico' : 'OK'}
                    </span>
                    <span className="text-xs text-slate-500">#{prod.id}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-base leading-tight">
                    {prod.nombre}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {prod.marca_celular} - {prod.modelo_celular}
                  </p>
                  {(prod.material || prod.color) && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      {prod.material && <span>{prod.material}</span>}
                      {prod.color && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span>{prod.color}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs text-slate-500">Precio</p>
                      <p className="mt-0.5 font-semibold text-slate-900">S/ {parseFloat(prod.precio_venta).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Stock</p>
                      <p className={`mt-0.5 font-semibold ${prod.stock <= 5 ? 'text-red-600' : 'text-slate-900'}`}>{prod.stock}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => agregarAlCarrito(prod, 1)}
                    disabled={prod.stock <= 0}
                    className="mt-3 w-full bg-black text-white py-2 text-xs font-black uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 disabled:opacity-20 active:scale-95 rounded-md"
                  >
                    + AGREGAR
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="w-full shrink-0 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-100 flex max-h-[78dvh] flex-col overflow-hidden shadow-2xl border border-slate-700 2xl:w-[420px] 2xl:max-h-none">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3">
            <ShoppingCart size={16} className="text-cyan-400" /> Detalle Operativo
          </h2>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Terminal_01</span>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar-light">
          {carrito.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 mb-4 shadow-sm">
                <ShoppingCart size={28} strokeWidth={1.5} className="opacity-70 text-slate-300" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em]">Sin items en cola</p>
              <p className="text-xs text-slate-400 mt-2">Agrega productos desde el panel izquierdo</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="rounded-lg bg-slate-900/70 border border-slate-700 p-3 hover:bg-slate-900 transition-colors animate-in slide-in-from-right-2 shadow-sm">
                <div className="flex justify-between items-center gap-3">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-bold truncate text-slate-50 uppercase">{item.nombre}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">
                      S/ {parseFloat(item.precio_venta).toFixed(2)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-black text-xs text-white">S/ {(item.cantidad * item.precio_venta).toFixed(2)}</span>
                    <button onClick={() => quitarDelCarrito(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Cantidad</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => actualizarCantidadCarrito(item.id, item.cantidad - 1)}
                      className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidadCarrito(item.id, e.target.value)}
                      className="w-14 h-7 rounded-md border border-slate-700 bg-slate-950 text-center text-xs font-bold text-white outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => actualizarCantidadCarrito(item.id, item.cantidad + 1)}
                      className="h-7 w-7 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-950/65 border-t border-slate-800 space-y-6">
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Vendedor</p>
            <select
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-cyan-500"
            >
              <option value="">Seleccionar vendedor</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Cliente</p>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white outline-none focus:border-cyan-500"
            >
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Seleccionar método de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {['Efectivo', 'Yape', 'Plin', 'Transferencia', 'Tarjeta'].map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMetodoPago(m);
                    if (m === 'Efectivo') {
                      setCodigoComprobante('');
                      setMarcaTarjeta('');
                    }
                    if (m !== 'Tarjeta') {
                      setMarcaTarjeta('');
                    }
                  }}
                  className={`py-3 border text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${metodoPago === m
                    ? 'bg-slate-100 text-slate-950 border-slate-100 shadow-sm'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200 rounded-md'
                    }`}
                >
                  <Target size={10} className={metodoPago === m ? 'opacity-100' : 'opacity-20'} />
                  {m}
                </button>
              ))}
            </div>
          </div>

          {requiereComprobante && (
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Código de comprobante</p>
              <input
                type="text"
                value={codigoComprobante}
                onChange={(e) => setCodigoComprobante(e.target.value)}
                placeholder=""
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {requiereMarcaTarjeta && (
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Marca de tarjeta</p>
              <select
                value={marcaTarjeta}
                onChange={(e) => setMarcaTarjeta(e.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-white outline-none focus:border-cyan-500"
              >
                <option value="">Seleccionar</option>
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="AMERICAN EXPRESS">American Express</option>
                <option value="DINERS CLUB">Diners Club</option>
                <option value="OTRA">Otra</option>
              </select>
            </div>
          )}

          <div className="flex justify-between items-end pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.36em] text-cyan-400">Total Neto</span>
            <span className="text-4xl font-black text-white tracking-tighter">S/ {total.toFixed(2)}</span>
          </div>

          <button
            onClick={finalizarVenta}
            disabled={carrito.length === 0 || procesando}
            className="w-full bg-cyan-500 hover:bg-cyan-400 py-4 rounded-lg text-[11px] font-black uppercase tracking-[0.28em] text-slate-950 transition-all disabled:opacity-20 active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
          >
            {procesando ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <DollarSign size={16} /> Procesar Transacción
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E4E4E7; }
        .custom-scrollbar-light::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </div>
  );
}