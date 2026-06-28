import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/client';

export default function Products() {
  const { id: tenantId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '' });

  async function load() {
    try {
      const data = await getProducts(tenantId!);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tenantId]);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category: '' });
    setShowModal(true);
  }

  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category || '' });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name) return alert('El nombre es obligatorio');
    const payload = { ...form, price: parseFloat(form.price) || 0 };
    try {
      if (editing) {
        await updateProduct(tenantId!, editing.id, payload);
      } else {
        await createProduct(tenantId!, payload);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    await deleteProduct(tenantId!, productId);
    load();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Productos</h2>
        <div>
          <button className="btn" onClick={() => navigate(`/tenants/${tenantId}`)}>Volver</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nuevo producto</button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No hay productos. Crea el primero.</p>
          <button className="btn btn-primary" onClick={openCreate}>Crear producto</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categor&iacute;a</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>Gs. {p.price.toLocaleString()}</td>
                  <td>{p.category || '—'}</td>
                  <td>
                    <span className={`badge ${p.active ? 'badge-success' : 'badge-danger'}`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(p)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
            <div className="form">
              <div className="form-group">
                <label>Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripci&oacute;n</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio (Gs.)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Categor&iacute;a</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
