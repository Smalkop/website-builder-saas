import { useState, useEffect } from 'react';
import { showToast } from '../toast';

async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('client_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/client${path}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: 'Error' })); throw new Error(err.error); }
  return res.json();
}

export default function Variants() {
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingValueFor, setAddingValueFor] = useState<string | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [valueColorHex, setValueColorHex] = useState('');

  async function load() {
    try {
      const data = await api('/attributes');
      setAttributes(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddValue(attrId: string) {
    if (!valueInput.trim()) return showToast('El valor es obligatorio', 'error');
    try {
      await api(`/attributes/${attrId}/values`, {
        method: 'POST',
        body: JSON.stringify({ value: valueInput.trim(), color_hex: valueColorHex || null }),
      });
      showToast('✓ Valor agregado correctamente', 'success');
      setValueInput('');
      setValueColorHex('');
      setAddingValueFor(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Variantes</h2>
      </div>

      {attributes.length === 0 ? (
        <div className="empty-state">
          <p>No hay variantes configuradas. El administrador de la plataforma debe crear los atributos primero.</p>
        </div>
      ) : (
        <div className="variants-list">
          {attributes.map(attr => (
            <div key={attr.id} className="variant-card">
              <div className="variant-card-header">
                <div className="variant-card-title">
                  <strong>{attr.name}</strong>
                  {attr.required ? <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Obligatorio</span> : null}
                </div>
              </div>
              <div className="variant-values">
                {attr.values && attr.values.length > 0 ? (
                  <div className="values-grid">
                    {attr.values.map((val: any) => (
                      <div key={val.id} className="value-chip" style={{ cursor: 'default' }}>
                        {val.color_hex ? <span className="color-swatch" style={{ backgroundColor: val.color_hex, display: 'inline-block', width: 16, height: 16, borderRadius: '50%', marginRight: 4, verticalAlign: 'middle', border: '1px solid var(--border-color)' }} /> : null}
                        <span>{val.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="values-empty">Sin valores aún</p>
                )}

                {addingValueFor === attr.id ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                      <input
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        placeholder="Nuevo valor"
                        style={{ flex: 1, padding: '0.375rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontSize: '0.8rem' }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddValue(attr.id); if (e.key === 'Escape') { setAddingValueFor(null); setValueInput(''); setValueColorHex(''); } }}
                        autoFocus
                      />
                      <button className="btn btn-sm btn-primary" onClick={() => handleAddValue(attr.id)}>Agregar</button>
                      <button className="btn btn-sm" onClick={() => { setAddingValueFor(null); setValueInput(''); setValueColorHex(''); }}>Cancelar</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      <input type="color" value={valueColorHex || '#000000'} onChange={(e) => setValueColorHex(e.target.value)} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', cursor: 'pointer' }} />
                      <input value={valueColorHex} onChange={(e) => setValueColorHex(e.target.value)} placeholder="#RRGGBB (opcional — color)" style={{ flex: 1, padding: '0.375rem 0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', fontSize: '0.8rem', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => { setAddingValueFor(attr.id); setValueInput(''); setValueColorHex(''); }}>
                    + Agregar valor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
