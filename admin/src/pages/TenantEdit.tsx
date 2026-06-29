import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenant, updateTenant, getSettings, updateSettings, uploadImage, getClientUser, createOrUpdateClientUser, getAttributes, createAttribute, updateAttribute, deleteAttribute, reorderAttributes, createAttributeValue, updateAttributeValue, deleteAttributeValue, reorderAttributeValues } from '../api/client';
import { showToast } from '../toast';

export default function TenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'branding' | 'variants' | 'client' | 'limits'>('info');
  const [tenant, setTenant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [clientUser, setClientUser] = useState<any>(null);
  const [clientPassword, setClientPassword] = useState('');
  const [clientLoading, setClientLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [attributes, setAttributes] = useState<any[]>([]);
  const [attrsLoading, setAttrsLoading] = useState(false);
  const [editingAttr, setEditingAttr] = useState<any>(null);
  const [attrForm, setAttrForm] = useState({ name: '', required: false, active: true });
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [editingValue, setEditingValue] = useState<{ attrId: string; value: any } | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [valueColorHex, setValueColorHex] = useState('');
  const [showValueModal, setShowValueModal] = useState(false);
  const [addingValueForAttr, setAddingValueForAttr] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const [t, s] = await Promise.all([getTenant(id!), getSettings(id!)]);
      setTenant(t);
      setSettings(s);
      const cu = await getClientUser(id!).catch(() => null);
      setClientUser(cu);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttributes() {
    setAttrsLoading(true);
    try {
      const data = await getAttributes(id!);
      setAttributes(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAttrsLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (tab === 'variants') loadAttributes();
  }, [tab]);

  async function handleLogoUpload(file: File) {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => { img.onload = resolve; });
    const min = Math.min(img.width, img.height);
    const sx = (img.width - min) / 2;
    const sy = (img.height - min) / 2;
    ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 85));
    const croppedFile = new File([blob], 'logo.webp', { type: 'image/webp' });
    const result = await uploadImage(id!, croppedFile);
    await updateSettings(id!, { logo_url: result.url });
    load();
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTenant(id!, { name: tenant.name, slug: tenant.slug });
      await updateSettings(id!, {
        business_name: settings.business_name,
        business_description: settings.business_description,
        whatsapp_number: settings.whatsapp_number,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
      });
      showToast('✓ Información guardada correctamente', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBranding(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(id!, {
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        font_family: settings.font_family,
        logo_url: settings.logo_url,
        banner_url: settings.banner_url,
        animations_enabled: settings.animations_enabled ? 1 : 0,
        layout_type: settings.layout_type,
        footer_credit_enabled: settings.footer_credit_enabled ? 1 : 0,
        variants_enabled: settings.variants_enabled ? 1 : 0,
      });
      showToast('✓ Marca y colores actualizados con éxito', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateClientUser() {
    const email = prompt('Email para el cliente:', clientUser?.email || `${tenant.slug}@client.local`);
    if (!email) return;
    setClientLoading(true);
    try {
      const result = await createOrUpdateClientUser(id!, { email, name: tenant.name, regenerate: true });
      setClientUser({ ...clientUser, email: result.email });
      setClientPassword(result.password);
      showToast(`✓ Usuario creado — Email: ${result.email} | Clave: ${result.password} | Guardala, no se mostrará de nuevo.`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setClientLoading(false);
    }
  }

  async function handleSaveLimits(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTenant(id!, { max_products: tenant.max_products });
      showToast('✓ Límite de productos actualizado correctamente', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function openAttrCreate() {
    setEditingAttr(null);
    setAttrForm({ name: '', required: false, active: true });
    setShowAttrModal(true);
  }

  function openAttrEdit(attr: any) {
    setEditingAttr(attr);
    setAttrForm({ name: attr.name, required: !!attr.required, active: !!attr.active });
    setShowAttrModal(true);
  }

  async function handleAttrSave() {
    if (!attrForm.name) return showToast('El nombre del atributo es obligatorio', 'error');
    try {
      if (editingAttr) {
        await updateAttribute(id!, editingAttr.id, attrForm);
        showToast('✓ Atributo actualizado', 'success');
      } else {
        await createAttribute(id!, attrForm);
        showToast('✓ Atributo creado', 'success');
      }
      setShowAttrModal(false);
      loadAttributes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleAttrDelete(attrId: string) {
    if (!confirm('¿Eliminar este atributo y todos sus valores?')) return;
    try {
      await deleteAttribute(id!, attrId);
      showToast('✓ Atributo eliminado', 'success');
      loadAttributes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  function openValueEdit(attrId: string, val: any) {
    setAddingValueForAttr(attrId);
    setEditingValue({ attrId, value: val });
    setValueInput(val.value);
    setValueColorHex(val.color_hex || '');
    setShowValueModal(true);
  }

  function openValueCreate(attrId: string) {
    setAddingValueForAttr(attrId);
    setEditingValue(null);
    setValueInput('');
    setValueColorHex('');
    setShowValueModal(true);
  }

  async function handleValueSave() {
    if (!valueInput || !addingValueForAttr) return showToast('El valor es obligatorio', 'error');
    try {
      const payload = { value: valueInput, color_hex: valueColorHex || null };
      if (editingValue) {
        await updateAttributeValue(id!, addingValueForAttr, editingValue.value.id, payload.value, payload.color_hex);
        showToast('✓ Valor actualizado', 'success');
      } else {
        await createAttributeValue(id!, addingValueForAttr, payload.value, payload.color_hex);
        showToast('✓ Valor agregado', 'success');
      }
      setShowValueModal(false);
      setAddingValueForAttr(null);
      loadAttributes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleValueDelete(attrId: string, valueId: string) {
    if (!confirm('¿Eliminar este valor?')) return;
    try {
      await deleteAttributeValue(id!, attrId, valueId);
      showToast('✓ Valor eliminado', 'success');
      loadAttributes();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  function moveAttr(index: number, direction: -1 | 1) {
    const newAttrs = [...attributes];
    const target = index + direction;
    if (target < 0 || target >= newAttrs.length) return;
    [newAttrs[index], newAttrs[target]] = [newAttrs[target], newAttrs[index]];
    setAttributes(newAttrs);
    reorderAttributes(id!, newAttrs.map(a => a.id)).catch(() => loadAttributes());
  }

  function moveValue(attrIndex: number, valueIndex: number, direction: -1 | 1) {
    const newAttrs = [...attributes];
    const vals = [...newAttrs[attrIndex].values];
    const target = valueIndex + direction;
    if (target < 0 || target >= vals.length) return;
    [vals[valueIndex], vals[target]] = [vals[target], vals[valueIndex]];
    newAttrs[attrIndex] = { ...newAttrs[attrIndex], values: vals };
    setAttributes(newAttrs);
    reorderAttributeValues(id!, newAttrs[attrIndex].id, vals.map((v: any) => v.id)).catch(() => loadAttributes());
  }

  if (loading) return <div className="loading">Cargando...</div>;
  if (!tenant) return <div className="error">Cliente no encontrado</div>;

  return (
    <div>
      <div className="page-header">
        <h2>{tenant.name}</h2>
        <button className="btn" onClick={() => navigate('/')}>Volver</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Información</button>
        <button className={`tab ${tab === 'branding' ? 'active' : ''}`} onClick={() => setTab('branding')}>Branding</button>
        <button className={`tab ${tab === 'variants' ? 'active' : ''}`} onClick={() => setTab('variants')}>Variantes</button>
        <button className={`tab ${tab === 'client' ? 'active' : ''}`} onClick={() => setTab('client')}>Cliente</button>
        <button className={`tab ${tab === 'limits' ? 'active' : ''}`} onClick={() => setTab('limits')}>Límites</button>
      </div>

      {tab === 'info' && (
        <form onSubmit={handleSaveInfo} className="form">
          <div className="form-group">
            <label>Nombre del negocio</label>
            <input value={tenant.name} onChange={(e) => setTenant({ ...tenant, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input value={tenant.slug} onChange={(e) => setTenant({ ...tenant, slug: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Nombre comercial</label>
            <input value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea value={settings.business_description} onChange={(e) => setSettings({ ...settings, business_description: e.target.value })} rows={3} />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Facebook URL</label>
              <input value={settings.facebook_url || ''} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input value={settings.instagram_url || ''} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {tab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Color primario</label>
              <input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} />
              <code>{settings.primary_color}</code>
            </div>
            <div className="form-group">
              <label>Color secundario</label>
              <input type="color" value={settings.secondary_color} onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })} />
              <code>{settings.secondary_color}</code>
            </div>
          </div>
          <div className="form-group">
            <label>Fuente tipográfica</label>
            <select value={settings.font_family} onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}>
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Poppins', sans-serif">Poppins</option>
            </select>
          </div>
          <div className="form-group">
            <label>Logo</label>
            {settings.logo_url && (
              <div style={{ marginBottom: '0.5rem' }}>
                <img src={settings.logo_url} alt="Logo" style={{ maxWidth: 200, maxHeight: 100, borderRadius: 8, border: '1px solid var(--border-color)' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://..." style={{ flex: 1 }} />
              <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              <button type="button" className="btn" onClick={() => logoInputRef.current?.click()}>Subir</button>
            </div>
          </div>
          <div className="form-group">
            <label>Banner URL</label>
            <input value={settings.banner_url || ''} onChange={(e) => setSettings({ ...settings, banner_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={!!settings.animations_enabled} onChange={(e) => setSettings({ ...settings, animations_enabled: e.target.checked ? 1 : 0 })} />
              &nbsp;Animaciones habilitadas
            </label>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={!!settings.variants_enabled} onChange={(e) => setSettings({ ...settings, variants_enabled: e.target.checked ? 1 : 0 })} />
              &nbsp;Variantes habilitadas (mostrar selectores en la página pública)
            </label>
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={!!settings.footer_credit_enabled} onChange={(e) => setSettings({ ...settings, footer_credit_enabled: e.target.checked ? 1 : 0 })} />
              &nbsp;Mostrar "desarrollado por Brahian Gonzalez" en el pie
            </label>
          </div>
          <div className="form-group">
            <label>Layout</label>
            <select value={settings.layout_type} onChange={(e) => setSettings({ ...settings, layout_type: e.target.value })}>
              <option value="modern">Moderno</option>
              <option value="classic">Clásico</option>
              <option value="minimal">Minimalista</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {tab === 'variants' && (
        <div>
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Atributos y variantes de productos</h3>
            <button className="btn btn-primary" onClick={openAttrCreate}>+ Nuevo atributo</button>
          </div>

          {!settings?.variants_enabled && (
            <div style={{ background: '#FEF3C7', color: '#92400E', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Las variantes están deshabilitadas. Activá "Variantes habilitadas" en la pestaña Branding para que los selectores aparezcan en la página pública.
            </div>
          )}

          {attrsLoading ? (
            <div className="loading">Cargando...</div>
          ) : attributes.length === 0 ? (
            <div className="empty-state">
              <p>No hay atributos definidos. Creá el primer atributo como "Color", "Talle", "Material", etc.</p>
              <button className="btn btn-primary" onClick={openAttrCreate}>Crear atributo</button>
            </div>
          ) : (
            <div className="variants-list">
              {attributes.map((attr, ai) => (
                <div key={attr.id} className="variant-card">
                  <div className="variant-card-header">
                    <div className="variant-card-title">
                      <div className="variant-reorder">
                        <button className="btn-icon" onClick={() => moveAttr(ai, -1)} disabled={ai === 0} title="Mover arriba">↑</button>
                        <button className="btn-icon" onClick={() => moveAttr(ai, 1)} disabled={ai === attributes.length - 1} title="Mover abajo">↓</button>
                      </div>
                      <strong>{attr.name}</strong>
                      {attr.required ? <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>Obligatorio</span> : <span className="badge badge-secondary" style={{ marginLeft: '0.5rem' }}>Opcional</span>}
                      {!attr.active && <span className="badge badge-danger" style={{ marginLeft: '0.5rem' }}>Inactivo</span>}
                    </div>
                    <div className="variant-card-actions">
                      <button className="btn btn-sm" onClick={() => openAttrEdit(attr)}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleAttrDelete(attr.id)}>Eliminar</button>
                    </div>
                  </div>
                  <div className="variant-values">
                    {attr.values && attr.values.length > 0 ? (
                      <div className="values-grid">
                        {attr.values.map((val: any, vi: number) => (
                          <div key={val.id} className="value-chip">
                            <div className="value-reorder">
                              <button className="btn-icon-sm" onClick={() => moveValue(ai, vi, -1)} disabled={vi === 0}>↑</button>
                              <button className="btn-icon-sm" onClick={() => moveValue(ai, vi, 1)} disabled={vi === attr.values.length - 1}>↓</button>
                            </div>
                            {val.color_hex ? <span className="color-swatch" style={{ backgroundColor: val.color_hex }} title={val.value} /> : null}
                            <span>{val.value}</span>
                            <button className="btn-icon-sm" onClick={() => openValueEdit(attr.id, val)} title="Editar">✎</button>
                            <button className="btn-icon-sm btn-icon-danger" onClick={() => handleValueDelete(attr.id, val.id)} title="Eliminar">×</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="values-empty">Sin valores aún</p>
                    )}
                    <button className="btn btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => openValueCreate(attr.id)}>+ Agregar valor</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'client' && (
        <div className="form">
          <div className="form-group">
            <label>Email del cliente</label>
            <input value={clientUser?.email || ''} placeholder="No creado aún" disabled />
          </div>
          {clientPassword && (
            <div className="form-group">
              <label>Contraseña generada</label>
              <input value={clientPassword} readOnly style={{ fontWeight: 700, fontFamily: 'monospace' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.25rem' }}>Guarda esta contraseña. No se mostrará de nuevo al regenerar.</p>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleGenerateClientUser} disabled={clientLoading}>
              {clientLoading ? 'Generando...' : clientUser ? 'Regenerar usuario' : 'Crear usuario'}
            </button>
          </div>
        </div>
      )}

      {tab === 'limits' && (
        <form onSubmit={handleSaveLimits} className="form">
          <div className="form-group">
            <label>Límite máximo de productos</label>
            <input type="number" value={tenant.max_products} min={1} max={1000}
              onChange={(e) => setTenant({ ...tenant, max_products: parseInt(e.target.value) || 50 })} />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              El cliente no podrá crear más de esta cantidad de productos desde su panel.
            </p>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {showAttrModal && (
        <div className="modal-overlay" onClick={() => setShowAttrModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingAttr ? 'Editar atributo' : 'Nuevo atributo'}</h3>
            <div className="form" style={{ maxWidth: '100%', boxShadow: 'none', padding: 0 }}>
              <div className="form-group">
                <label>Nombre del atributo</label>
                <input value={attrForm.name} onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })} placeholder="Ej: Color, Talle, Material" required />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={attrForm.required} onChange={(e) => setAttrForm({ ...attrForm, required: e.target.checked })} />
                  &nbsp;Obligatorio (el cliente deberá seleccionar un valor)
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={attrForm.active} onChange={(e) => setAttrForm({ ...attrForm, active: e.target.checked })} />
                  &nbsp;Activo
                </label>
              </div>
              <div className="form-actions">
                <button className="btn" onClick={() => setShowAttrModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleAttrSave}>
                  {editingAttr ? 'Guardar cambios' : 'Crear atributo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showValueModal && (
        <div className="modal-overlay" onClick={() => setShowValueModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingValue ? 'Editar valor' : 'Agregar valor'}</h3>
            <div className="form" style={{ maxWidth: '100%', boxShadow: 'none', padding: 0 }}>
              <div className="form-group">
                <label>Valor</label>
                <input value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="Ej: Rojo, S, Algodón" required />
              </div>
              <div className="form-group">
                <label>
                  Color (opcional — si es un color, aparecerá como círculo)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={valueColorHex || '#000000'} onChange={(e) => setValueColorHex(e.target.value)} style={{ width: 48, height: 48, padding: 2, border: '1px solid var(--color-gray-300)', borderRadius: 'var(--radius)', cursor: 'pointer' }} />
                  <input value={valueColorHex} onChange={(e) => setValueColorHex(e.target.value)} placeholder="#RRGGBB" style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--color-gray-300)', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontFamily: 'monospace' }} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn" onClick={() => setShowValueModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleValueSave}>
                  {editingValue ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
