import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, X, Boxes, Upload, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/apiClient';
import ConfirmDialog from '../../components/ConfirmDialog';

const initialForm = {
  nombre: '',
  marca_celular: '',
  modelo_celular: '',
  precio_venta: '',
  stock: '',
  material: '',
  color: '',
  imagen: null
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [productoEliminar, setProductoEliminar] = useState(null);

  const fetchProductos = async () => {
    try {
      const { data } = await api.get('/productos');
      setProductos(data);
    } catch (error) {
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductos(); }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => setSuccess(''), 2400);
    return () => clearTimeout(timeout);
  }, [success]);

  const filtrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.modelo_celular.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getTotalStock = () => productos.reduce((acc, p) => acc + Number(p.stock || 0), 0);
  const getStockCritico = () => productos.filter((p) => Number(p.stock) < 5).length;
  const getImageUrl = (imagenPath) => {
    if (!imagenPath) return null;
    if (imagenPath.startsWith('http') || imagenPath.startsWith('data:')) return imagenPath;
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    return `${baseUrl}${imagenPath}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({ ...prev, imagen: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setImagePreview(null);
    setError('');
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    resetForm();
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      setSuccess('Producto eliminado correctamente.');
      await fetchProductos();
    } catch (err) {
      setError('No se pudo eliminar el producto.');
    }
  };

  const handleEditProduct = (prod) => {
    setEditingId(prod.id);
    setForm({
      nombre: prod.nombre,
      marca_celular: prod.marca_celular,
      modelo_celular: prod.modelo_celular,
      precio_venta: prod.precio_venta,
      stock: prod.stock,
      material: prod.material || '',
      color: prod.color || '',
      imagen: null
    });
    setImagePreview(prod.imagen ? prod.imagen : null);
    setShowModal(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || !form.marca_celular || !form.modelo_celular || !form.precio_venta || form.stock === '') {
      setError('Completa los campos obligatorios.');
      return;
    }

    const precio = Number(form.precio_venta);
    const stock = Number(form.stock);

    if (Number.isNaN(precio) || precio <= 0) {
      setError('El precio debe ser mayor a 0.');
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      setError('El stock no puede ser negativo.');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('nombre', form.nombre);
      formData.append('marca_celular', form.marca_celular);
      formData.append('modelo_celular', form.modelo_celular);
      formData.append('precio_venta', precio);
      formData.append('stock', stock);
      formData.append('material', form.material);
      formData.append('color', form.color);
      if (form.imagen) {
        formData.append('imagen', form.imagen);
      }

      if (editingId) {
        const response = await api.put(`/productos/${editingId}`, formData);
        if (response.status === 200) {
          setSuccess('Producto actualizado correctamente.');
        }
      } else {
        const response = await api.post('/productos', formData);
        if (response.status === 201 || response.status === 200) {
          setSuccess('Producto creado correctamente.');
        }
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      await fetchProductos();
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || 'No se pudo guardar el producto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Gestión de Inventario</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">Productos</h1>
            <p className="mt-2 text-sm font-medium text-zinc-600">Administra tu catálogo de productos y controla el stock en tiempo real.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError('');
              setShowModal(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-black md:w-auto"
          >
            <Plus size={18} /> Agregar Producto
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Total de Productos</p>
          <p className="mt-2 text-3xl font-black leading-none text-zinc-900 sm:text-[40px]">{productos.length}</p>
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Stock Total</p>
          <p className="mt-2 text-3xl font-black leading-none text-zinc-900 sm:text-[40px]">{getTotalStock()}</p>
        </article>
        <article className="rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3.5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-700">Stock Crítico</p>
          <p className="mt-2 text-3xl font-black leading-none text-zinc-900 sm:text-[40px]">{getStockCritico()}</p>
        </article>
      </section>

      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700" size={17} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o modelo..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-300" size={40} /></div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <div className="rounded-lg bg-slate-200 p-4 text-slate-400"><Boxes size={28} /></div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Sin resultados</h3>
          <p className="mt-2 text-sm text-slate-600">No encontramos productos con ese filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {filtrados.map((prod) => (
            <div key={prod.id} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative flex h-44 w-full items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-slate-100">
                {prod.imagen ? (
                  <img 
                    src={getImageUrl(prod.imagen)}
                    alt={prod.nombre}
                    className="max-h-full max-w-full object-contain p-3 transition duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      console.error('Error loading image:', e.target.src);
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon size={40} className="text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${prod.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {prod.stock < 5 ? 'Crítico' : 'ok'}
                  </span>
                  <span className="text-xs text-slate-500">#{prod.id}</span>
                </div>
                <h3 className="font-semibold text-slate-900">{prod.nombre}</h3>
                <p className="mt-1.5 text-xs text-slate-500">{prod.marca_celular} - {prod.modelo_celular}</p>
                {(prod.material || prod.color) && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-600">
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
                    <p className={`mt-0.5 font-semibold ${prod.stock < 5 ? 'text-red-600' : 'text-slate-900'}`}>{prod.stock}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleEditProduct(prod)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setProductoEliminar(prod)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92dvh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                <p className="mt-1 text-xs text-slate-600">Completa el formulario para {editingId ? 'actualizar' : 'registrar'} un producto.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 max-h-[calc(92dvh-88px)]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-700">Imagen del Producto</label>
                  <div className="relative rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-slate-400 hover:bg-slate-100 transition">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="sr-only"
                      id="imagen-input"
                    />
                    <label htmlFor="imagen-input" className="cursor-pointer">
                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-3">
                          <img src={getImageUrl(imagePreview)} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-slate-200" />
                          <p className="text-xs text-slate-600">Click para cambiar imagen</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload size={24} className="text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">Sube una imagen</p>
                            <p className="text-xs text-slate-500">JPG, PNG o WebP (máx 5MB)</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Nombre</label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Case Impact Resistance"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Marca</label>
                  <input
                    name="marca_celular"
                    value={form.marca_celular}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Samsung"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Modelo</label>
                  <input
                    name="modelo_celular"
                    value={form.modelo_celular}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Galaxy A55"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Precio de Venta</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="precio_venta"
                    value={form.precio_venta}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="59.90"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Stock</label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={form.stock}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Material</label>
                  <input
                    name="material"
                    value={form.material}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="TPU / Silicona"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">Color</label>
                  <input
                    name="color"
                    value={form.color}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Negro"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!productoEliminar}
        title="Eliminar producto"
        message={`¿Deseas eliminar ${productoEliminar?.nombre || 'este producto'}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onClose={() => setProductoEliminar(null)}
        onConfirm={async () => {
          const producto = productoEliminar;
          setProductoEliminar(null);
          if (producto) await handleDeleteProduct(producto.id);
        }}
      />
    </div>
  );
}
