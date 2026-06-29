import { useState, useEffect, useRef } from 'react';
import { showToast } from '../toast';

interface Props { onLogout: () => void; }

interface Product {
  id: string; name: string; description: string; price: number;
  images: string[]; category: string; category_id: string | null;
  category_name: string; active: number; offer_price: number | null; offer_active: number;
}

interface Category { id: string; name: string; }

export default function Products({ onLogout }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', offer_price: '', offer_active: false });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function api(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('client_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/client${path}`, { ...options, headers });
    if (res.status === 401) { onLogout(); throw new Error('Unauthorized'); }
    if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error' })); throw new Error(err.error); }
    return res.json();
  }

  async function load() {
    try {
      const [data, cats] = await Promise.all([
        api('/products'),
        fetch('/api/site/categories').then(r => r.json()).catch(() => []),
      ]);
      setProducts(data);
      setCategories(cats);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', category_id: '', offer_price: '', offer_active: false });
    setImageFile(null); setImagePreview(''); setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      category_id: p.category_id || '', offer_price: p.offer_price ? String(p.offer_price) : '', offer_active: !!p.offer_active,
    });
    setImageFile(null); setImagePreview(p.images?.[0] || ''); setShowModal(true);
  }

  function handleImageSelect(file: File) {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const cropped = new File([blob], 'product.webp', { type: 'image/webp' });
        setImageFile(cropped);
        setImagePreview(URL.createObjectURL(cropped));
      }, 'image/webp', 85);
    };
    setImageFile(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;
    const token = localStorage.getItem('client_token');
    const formData = new FormData();
    formData.append('file', imageFile);
    const res = await fetch('/api/client/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const result = await res.json();
    return result.url;
  }

  async function handleSave() {
    if (!form.name) return showToast('El nombre del producto es obligatorio', 'error');
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const payload = {
        name: form.name, description: form.description, price: parseFloat(form.price) || 0,
        category_id: form.category_id || null, offer_price: form.offer_active ? (parseFloat(form.offer_price) || 0) : null, offer_active: form.offer_active,
      };
      if (editing) {
        await api(`/products/${editing.id}`, { method: 'PUT', body: JSON.stringify({ ...payload, images: imageUrl ? [imageUrl] : undefined }) });
      } else {
        await api('/products', { method: 'POST', body: JSON.stringify({ ...payload, images: imageUrl ? [imageUrl] : [] }) });
      }
      setShowModal(false); load();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function handleDelete(productId: string) {
    if (!confirm('¿Eliminar este producto?')) return;
    await api(`/products/${productId}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Mis Productos</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo producto</button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No tenés productos todavía.</p>
          <button className="btn btn-primary" onClick={openCreate}>Crear primer producto</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Oferta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.images?.[0] && <img src={p.images[0]} alt="" style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover' }} />}</td>
                  <td>{p.name}</td>
                  <td>Gs. {p.price.toLocaleString()}</td>
                  <td>{p.offer_active ? <span className="badge badge-warning">Gs. {p.offer_price?.toLocaleString()}</span> : '—'}</td>
                  <td><span className={`badge ${p.active ? 'badge-success' : 'badge-danger'}`}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
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
            <div className="form" style={{ maxWidth: '100%' }}>
              <div className="form-group">
                <label>Nombre</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio (Gs.)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Sin categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Imagen</label>
                {imagePreview && <div style={{ marginBottom: '0.5rem' }}><img src={imagePreview} alt="" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)' }} /></div>}
                <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
              </div>
              <div className="form-group">
                <label><input type="checkbox" checked={form.offer_active} onChange={(e) => setForm({ ...form, offer_active: e.target.checked })} />&nbsp;En oferta</label>
              </div>
              {form.offer_active && (
                <div className="form-group">
                  <label>Precio de oferta (Gs.)</label>
                  <input type="number" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} />
                </div>
              )}
              <div className="form-actions">
                <button className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
