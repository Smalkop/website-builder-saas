import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/client';
import { showToast } from '../toast';

export default function Categories() {
  const { id: tenantId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');

  async function load() {
    try {
      const data = await getCategories(tenantId!);
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tenantId]);

  function openCreate() {
    setEditing(null);
    setName('');
    setShowModal(true);
  }

  function openEdit(cat: any) {
    setEditing(cat);
    setName(cat.name);
    setShowModal(true);
  }

  async function handleSave() {
    if (!name.trim()) return showToast('El nombre es obligatorio', 'error');
    try {
      if (editing) {
        await updateCategory(tenantId!, editing.id, name.trim());
      } else {
        await createCategory(tenantId!, name.trim());
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(catId: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await deleteCategory(tenantId!, catId);
    load();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Categorías</h2>
        <div>
          <button className="btn" onClick={() => navigate(`/tenants/${tenantId}`)}>Volver</button>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva categoría</button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No hay categorías. Crea la primera.</p>
          <button className="btn btn-primary" onClick={openCreate}>Crear categoría</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(cat)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id)}>Eliminar</button>
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
            <h3>{editing ? 'Editar categoría' : 'Nueva categoría'}</h3>
            <div className="form" style={{ maxWidth: '100%' }}>
              <div className="form-group">
                <label>Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Electrónicos" required />
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
