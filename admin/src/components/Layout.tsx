import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMe } from '../api/client';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {
      localStorage.removeItem('admin_token');
      navigate('/login');
    });
  }, []);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Website Builder</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Dashboard
          </button>
          <button
            className={`sidebar-link ${location.pathname.includes('/tenants/new') ? 'active' : ''}`}
            onClick={() => navigate('/tenants/new')}
          >
            + Nuevo cliente
          </button>
        </nav>
        <div className="sidebar-footer">
          {user && <span className="user-email">{user.email}</span>}
          <button className="btn btn-sm btn-logout" onClick={handleLogout}>Cerrar sesi&oacute;n</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
