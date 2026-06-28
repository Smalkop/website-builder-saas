import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTenant } from '../api/client';

export default function TenantCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    business_name: '',
    whatsapp_number: '',
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    custom_domain: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTenant(form);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al crear cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Nuevo cliente</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del negocio</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Ej: Tienda de María" />
          </div>
          <div className="form-group">
            <label>Slug (identificador &uacute;nico)</label>
            <input name="slug" value={form.slug} onChange={handleChange} required placeholder="tienda-maria" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre comercial</label>
            <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Tienda de María S.A." />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange} placeholder="+595981000000" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Color primario</label>
            <input name="primary_color" type="color" value={form.primary_color} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Color secundario</label>
            <input name="secondary_color" type="color" value={form.secondary_color} onChange={handleChange} />
          </div>
        </div>
        <div className="form-group">
          <label>Dominio personalizado (opcional)</label>
          <input name="custom_domain" value={form.custom_domain} onChange={handleChange} placeholder="ej: tiendamaria.com.py" />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate('/')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
