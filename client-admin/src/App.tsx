import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Toast from './components/Toast';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('client_token'));

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('client_token'));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <>
      <Toast />
      {!token ? <Login onLogin={() => setToken(localStorage.getItem('client_token'))} /> : <Layout onLogout={() => { localStorage.removeItem('client_token'); setToken(null); }} />}
    </>
  );
}
