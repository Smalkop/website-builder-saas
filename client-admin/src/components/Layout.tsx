import { useState } from 'react';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Settings from '../pages/Settings';
import Menus from '../pages/Menus';

interface Props {
  onLogout: () => void;
}

type Page = 'products' | 'categories' | 'settings' | 'menus';

export default function Layout({ onLogout }: Props) {
  const [page, setPage] = useState<Page>('products');

  function renderPage() {
    switch (page) {
      case 'products': return <Products onLogout={onLogout} />;
      case 'categories': return <Categories />;
      case 'settings': return <Settings />;
      case 'menus': return <Menus />;
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Mi Panel</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-link ${page === 'products' ? 'active' : ''}`} onClick={() => setPage('products')}>Productos</button>
          <button className={`sidebar-link ${page === 'categories' ? 'active' : ''}`} onClick={() => setPage('categories')}>Categorías</button>
          <button className={`sidebar-link ${page === 'menus' ? 'active' : ''}`} onClick={() => setPage('menus')}>Menú</button>
          <button className={`sidebar-link ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>Configuración</button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-sm btn-logout" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
