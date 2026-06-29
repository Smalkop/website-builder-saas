import { useState, useEffect, useRef } from 'react';
import { showToast } from '../toast';

interface Settings {
  tenant_id: string; logo_url: string | null; banner_url: string | null;
  primary_color: string; secondary_color: string; font_family: string;
  animations_enabled: number; layout_type: string; whatsapp_number: string;
  business_name: string; business_description: string;
  facebook_url: string | null; instagram_url: string | null; footer_credit_enabled: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
      const data = await api('/settings');
      setSettings(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          business_name: settings.business_name,
          business_description: settings.business_description,
          whatsapp_number: settings.whatsapp_number,
          facebook_url: settings.facebook_url || '',
          instagram_url: settings.instagram_url || '',
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          font_family: settings.font_family,
          animations_enabled: settings.animations_enabled ? 1 : 0,
          layout_type: settings.layout_type,
          footer_credit_enabled: settings.footer_credit_enabled ? 1 : 0,
        }),
      });
      showToast('Guardado correctamente', 'success');
    } catch (err: any) { showToast(err.message, 'error'); } finally { setSaving(false); }
  }

  async function handleLogoUpload(file: File) {
    const token = localStorage.getItem('client_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/client/settings/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    const result = await res.json();
    setSettings((s) => s ? { ...s, logo_url: result.url } : s);
    await api('/settings', { method: 'PUT', body: JSON.stringify({ logo_url: result.url }) });
  }

  if (loading) return <div className="loading">Cargando...</div>;
  if (!settings) return <div className="loading">Error al cargar configuración</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Configuración del sitio</h2>
      </div>

      <div className="form">
        <div className="form-group">
          <label>Nombre del negocio</label>
          <input value={settings.business_name} onChange={(e) => setSettings({ ...settings, business_name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <textarea value={settings.business_description} onChange={(e) => setSettings({ ...settings, business_description: e.target.value })} rows={3} />
        </div>

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
          <label>Fuente</label>
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
          <input type="file" accept="image/*" ref={logoInputRef} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
          <button type="button" className="btn" onClick={() => logoInputRef.current?.click()}>Subir logo</button>
        </div>

        <div className="form-group">
          <label>Banner URL</label>
          <input value={settings.banner_url || ''} onChange={(e) => setSettings({ ...settings, banner_url: e.target.value })} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>WhatsApp</label>
            <input value={settings.whatsapp_number} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} />
          </div>
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

        <div className="form-group">
          <label>
            <input type="checkbox" checked={!!settings.animations_enabled} onChange={(e) => setSettings({ ...settings, animations_enabled: e.target.checked ? 1 : 0 })} />
            &nbsp;Animaciones habilitadas
          </label>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={!!settings.footer_credit_enabled} onChange={(e) => setSettings({ ...settings, footer_credit_enabled: e.target.checked ? 1 : 0 })} />
            &nbsp;Mostrar crédito en el pie de página
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
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
