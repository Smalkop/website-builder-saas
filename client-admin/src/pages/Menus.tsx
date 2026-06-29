import { useState, useEffect, useRef } from 'react';

interface MenuItem { id: string; label: string; anchor: string; sort_order: number; parent_id: string | null; children?: MenuItem[]; }

const ANCHOR_OPTIONS = [
  { value: 'inicio', label: 'Inicio' },
  { value: 'productos', label: 'Productos' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'nosotros', label: 'Nosotros' },
];

export default function Menus() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ label: '', anchor: 'inicio', parent_id: '' });

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
      const data = await api('/menus');
      setItems(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm({ label: '', anchor: 'inicio', parent_id: '' }); setShowModal(true); }
  function openEdit(item: any) { setEditing(item); setForm({ label: item.label, anchor: item.anchor, parent_id: item.parent_id || '' }); setShowModal(true); }

  async function handleSave() {
    if (!form.label.trim()) return alert('La etiqueta es obligatoria');
    try {
      const payload = { label: form.label.trim(), anchor: form.anchor, sort_order: 0, parent_id: form.parent_id || null };
      if (editing) {
        await api(`/menus/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/menus', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('¿Eliminar este item del menú?')) return;
    await api(`/menus/${itemId}`, { method: 'DELETE' });
    load();
  }

  const topItems = items.filter((i) => !i.parent_id);
  const subItems = (parentId: string) => items.filter((i) => i.parent_id === parentId);

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Menú de navegación</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo item</button>
      </div>

      {topItems.length === 0 ? (
        <div className="empty-state">
          <p>No hay items en el menú. Creá el primero.</p>
          <button className="btn btn-primary" onClick={openCreate}>Crear item</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Item</th><th>Ancla</th><th>Subitems</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {topItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.label}</strong></td>
                  <td><code>#{item.anchor}</code></td>
                  <td>
                    {subItems(item.id).length > 0
                      ? subItems(item.id).map((s) => <span key={s.id} className="badge badge-info" style={{ margin: '0 0.25rem 0.25rem 0', display: 'inline-block' }}>{s.label}</span>)
                      : <span className="badge badge-secondary">Sin subitems</span>
                    }
                  </td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => openEdit(item)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Eliminar</button>
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
            <h3>{editing ? 'Editar item' : 'Nuevo item'}</h3>
            <div className="form" style={{ maxWidth: '100%' }}>
              <div className="form-group">
                <label>Etiqueta</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ej: Inicio" required />
              </div>
              <div className="form-group">
                <label>Sección (ancla)</label>
                <select value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })}>
                  {ANCHOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Item padre (para subitems)</label>
                <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                  <option value="">— Ninguno (item principal) —</option>
                  {topItems.filter((i) => i.id !== editing?.id).map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
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
