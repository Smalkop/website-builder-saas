import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDomains, createDomain, verifyDomain, deleteDomain } from '../api/client';

export default function Domains() {
  const { id: tenantId } = useParams();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);

  async function load() {
    try {
      const data = await getDomains(tenantId!);
      setDomains(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [tenantId]);

  async function handleAdd() {
    if (!newDomain) return;
    setAdding(true);
    try {
      await createDomain(tenantId!, newDomain);
      setNewDomain('');
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(domainId: string) {
    try {
      await verifyDomain(tenantId!, domainId);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(domainId: string) {
    if (!confirm('¿Eliminar este dominio?')) return;
    await deleteDomain(tenantId!, domainId);
    load();
  }

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Dominios</h2>
        <button className="btn" onClick={() => navigate(`/tenants/${tenantId}`)}>Volver</button>
      </div>

      <div className="add-domain">
        <input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="ej: tiendamaria.com.py"
          className="domain-input"
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={adding || !newDomain}>
          {adding ? 'Agregando...' : 'Agregar dominio'}
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Dominio</th>
              <th>Tipo</th>
              <th>Verificado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr key={d.id}>
                <td><code>{d.domain}</code></td>
                <td>
                  <span className={`badge ${d.type === 'subdomain' ? 'badge-info' : 'badge-secondary'}`}>
                    {d.type === 'subdomain' ? 'Subdominio' : 'Personalizado'}
                  </span>
                </td>
                <td>
                  {d.verified ? (
                    <span className="badge badge-success">Verificado</span>
                  ) : (
                    <span className="badge badge-warning">Pendiente</span>
                  )}
                </td>
                <td className="actions">
                  {!d.verified && d.type === 'custom' && (
                    <button className="btn btn-sm" onClick={() => handleVerify(d.id)}>Verificar</button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(d.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
