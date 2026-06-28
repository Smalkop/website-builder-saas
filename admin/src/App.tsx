import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenantCreate from './pages/TenantCreate';
import TenantEdit from './pages/TenantEdit';
import Products from './pages/Products';
import Domains from './pages/Domains';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const token = localStorage.getItem('admin_token');

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="tenants/new" element={<TenantCreate />} />
        <Route path="tenants/:id" element={<TenantEdit />} />
        <Route path="tenants/:id/products" element={<Products />} />
        <Route path="tenants/:id/domains" element={<Domains />} />
      </Route>
    </Routes>
  );
}
