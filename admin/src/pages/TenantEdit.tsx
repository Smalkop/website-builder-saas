import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenant, updateTenant, getSettings, updateSettings, uploadImage, getClientUser, createOrUpdateClientUser } from '../api/client';
import { showToast } from '../toast';

export default function TenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'branding' | 'client' | 'limits'>('info');
  const [tenant, setTenant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [clientUser, setClientUser] = useState<any>(null);
  const [clientPassword, setClientPassword] = useState('');
  const [clientLoading, setClientLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => { load(); }, [id]);

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
      showToast('Guardado correctamente', 'success');
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
      });
      showToast('Guardado correctamente', 'success');
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
      showToast(`Usuario creado. Email: ${result.email} | Contraseña: ${result.password} | Guarda esta contraseña, no se mostrará de nuevo.`, 'success');
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
      showToast('Límite guardado', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
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
    </div>
  );
}
