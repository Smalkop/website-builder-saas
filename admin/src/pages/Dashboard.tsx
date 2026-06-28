import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTenants, toggleTenantStatus, deleteTenant } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTenants() {
    try {
      const data = await getTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTenants(); }, []);

  async function handleToggleStatus(id: string) {
    await toggleTenantStatus(id);
    loadTenants();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    await deleteTenant(id);
    loadTenants();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Clientes</h2>
        <Link to="/tenants/new" className="btn btn-primary">+ Nuevo cliente</Link>
      </div>

      {tenants.length === 0 ? (
        <div className="empty-state">
          <p>No hay clientes registrados.</p>
          <Link to="/tenants/new" className="btn btn-primary">Crear primer cliente</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong></td>
                  <td><code>{t.slug}</code></td>
                  <td>
                    <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {t.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button className="btn btn-sm" onClick={() => navigate(`/tenants/${t.id}`)}>Editar</button>
                    <button className="btn btn-sm" onClick={() => navigate(`/tenants/${t.id}/products`)}>Productos</button>
                    <button className="btn btn-sm" onClick={() => navigate(`/tenants/${t.id}/domains`)}>Dominios</button>
                    <button className="btn btn-sm btn-warning" onClick={() => handleToggleStatus(t.id)}>
                      {t.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
