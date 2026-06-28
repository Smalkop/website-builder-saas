import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenant, updateTenant, getSettings, updateSettings } from '../api/client';

export default function TenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'branding'>('info');
  const [tenant, setTenant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [t, s] = await Promise.all([getTenant(id!), getSettings(id!)]);
      setTenant(t);
      setSettings(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

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
      alert('Guardado correctamente');
    } catch (err: any) {
      alert(err.message);
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
      });
      alert('Guardado correctamente');
    } catch (err: any) {
      alert(err.message);
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
        <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>Informaci&oacute;n</button>
        <button className={`tab ${tab === 'branding' ? 'active' : ''}`} onClick={() => setTab('branding')}>Branding</button>
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
            <label>Descripci&oacute;n</label>
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
            <label>Fuente tipogr&aacute;fica</label>
            <select value={settings.font_family} onChange={(e) => setSettings({ ...settings, font_family: e.target.value })}>
              <option value="Inter, system-ui, sans-serif">Inter</option>
              <option value="'Segoe UI', system-ui, sans-serif">Segoe UI</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Poppins', sans-serif">Poppins</option>
            </select>
          </div>
          <div className="form-group">
            <label>Logo URL</label>
            <input value={settings.logo_url || ''} onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://..." />
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
            <label>Layout</label>
            <select value={settings.layout_type} onChange={(e) => setSettings({ ...settings, layout_type: e.target.value })}>
              <option value="modern">Moderno</option>
              <option value="classic">Cl&aacute;sico</option>
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
    </div>
  );
}
