import { useState, useEffect } from 'react';

interface Category { id: string; name: string; }

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');

  async function api(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('client_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/client${path}`, { ...options, headers });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error' })); throw new Error(err.error); }
    return res.json();
  }

  async function load() {
    try {
      const data = await api('/categories');
      setCategories(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setName(''); setShowModal(true); }
  function openEdit(cat: Category) { setEditing(cat); setName(cat.name); setShowModal(true); }

  async function handleSave() {
    if (!name.trim()) return alert('El nombre es obligatorio');
    try {
      if (editing) {
        await api(`/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify({ name: name.trim() }) });
      } else {
        await api('/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      }
      setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
  }

  async function handleDelete(catId: string) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    await api(`/categories/${catId}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Categorías</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nueva categoría</button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No hay categorías. Creá la primera.</p>
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
