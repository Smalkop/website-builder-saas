import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('client_token'));

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('client_token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!token) return <Login onLogin={() => setToken(localStorage.getItem('client_token'))} />;
  return <Layout onLogout={() => { localStorage.removeItem('client_token'); setToken(null); }} />;
}
