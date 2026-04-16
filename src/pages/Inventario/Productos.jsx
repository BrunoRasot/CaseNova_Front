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
  imagen_url: '' // Cambiado de 'imagen' (file) a 'imagen_url' (string)
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
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.modelo_celular?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
    setError('');
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
      imagen_url: prod.imagen_url || ''
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    if (!form.nombre || !form.marca_celular || !form.modelo_celular || !form.precio_venta) {
      setError('Completa los campos obligatorios.');
      return;
    }

    try {
      setSaving(true);
      
      // Enviamos como JSON para evitar problemas de Multipart en Render
      const dataToSend = {
        ...form,
        precio_venta: Number(form.precio_venta),
        stock: Number(form.stock)
      };

      if (editingId) {
        await api.put(`/productos/${editingId}`, dataToSend);
        setSuccess('Producto actualizado correctamente.');
      } else {
        await api.post('/productos', dataToSend);
        setSuccess('Producto creado correctamente.');
      }

      handleCloseModal();
      await fetchProductos();
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.delete(`/productos/${id}`);
      setSuccess('Producto eliminado.');
      await fetchProductos();
    } catch (err) {
      setError('No se pudo eliminar.');
    }
  };

  return (
    <div className="space-y-4 p-4 lg:p-8">
      {/* HEADER Y ESTADÍSTICAS */}
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 uppercase italic">Inventario CaseNova</h1>
            <p className="text-sm text-zinc-500">Gestión centralizada de productos para el catálogo público.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 font-bold text-white hover:bg-black transition-all"
          >
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>
      </section>

      {/* BUSCADOR */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o modelo..."
          className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-zinc-100"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* LISTADO DE PRODUCTOS */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-zinc-300" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((prod) => (
            <div key={prod.id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="h-40 bg-zinc-50 flex items-center justify-center overflow-hidden">
                {prod.imagen_url ? (
                  <img src={prod.imagen_url} className="h-full w-full object-contain p-2" alt={prod.nombre} />
                ) : (
                  <ImageIcon size={32} className="text-zinc-300" />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-zinc-900 truncate">{prod.nombre}</h3>
                <p className="text-xs text-zinc-500">{prod.marca_celular} - {prod.modelo_celular}</p>
                <div className="mt-4 flex justify-between items-end border-t pt-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Precio Venta</p>
                    <p className="font-black text-zinc-900">S/ {parseFloat(prod.precio_venta).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditProduct(prod)} className="p-2 bg-zinc-100 rounded-lg hover:bg-zinc-200"><Edit2 size={14}/></button>
                    <button onClick={() => setProductoEliminar(prod)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-black italic">{editingId ? 'EDITAR' : 'NUEVO'} PRODUCTO</h2>
              <button onClick={handleCloseModal}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">Nombre del Producto</label>
                <input name="nombre" value={form.nombre} onChange={handleInputChange} className="w-full border-b py-2 outline-none focus:border-zinc-900" placeholder="Ej: Case Silicona" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Marca Celular</label>
                  <input name="marca_celular" value={form.marca_celular} onChange={handleInputChange} className="w-full border-b py-2 outline-none" placeholder="Apple" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Modelo Celular</label>
                  <input name="modelo_celular" value={form.modelo_celular} onChange={handleInputChange} className="w-full border-b py-2 outline-none" placeholder="iPhone 15 Pro" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Precio Venta (S/)</label>
                  <input type="number" step="0.01" name="precio_venta" value={form.precio_venta} onChange={handleInputChange} className="w-full border-b py-2 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Stock Inicial</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleInputChange} className="w-full border-b py-2 outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400">URL de la Imagen (Link)</label>
                <input name="imagen_url" value={form.imagen_url} onChange={handleInputChange} className="w-full border-b py-2 outline-none focus:border-blue-500" placeholder="https://..." />
              </div>

              {error && <p className="text-red-600 text-xs font-bold">{error}</p>}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-3 font-bold text-zinc-400">CANCELAR</button>
                <button type="submit" disabled={saving} className="flex-1 bg-zinc-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">
                  {saving ? 'GUARDANDO...' : 'GUARDAR PRODUCTO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOGO DE CONFIRMACIÓN */}
      <ConfirmDialog
        open={!!productoEliminar}
        onClose={() => setProductoEliminar(null)}
        onConfirm={() => handleDeleteProduct(productoEliminar.id)}
        title="¿Eliminar producto?"
        message="Esta acción no se puede deshacer."
      />
    </div>
  );
}