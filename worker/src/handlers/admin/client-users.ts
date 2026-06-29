import { Context } from 'hono';
import { Env, ClientUser } from '../../types';
import { queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

function generateId(): string {
  return crypto.randomUUID();
}

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  return pwd;
}

export async function get(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const user = await queryOne<ClientUser>(
    c.env,
    'SELECT id, tenant_id, email, name, created_at FROM client_users WHERE tenant_id = ?',
    [tenantId]
  );
  if (!user) return notFound('Client user not found');
  return json(user);
}

export async function createOrUpdate(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { email, name, regenerate } = body;

  const existing = await queryOne<ClientUser>(c.env, 'SELECT * FROM client_users WHERE tenant_id = ?', [tenantId]);

  if (existing && !regenerate) {
    if (email) await execute(c.env, 'UPDATE client_users SET email = ?, name = ? WHERE tenant_id = ?', [email, name || '', tenantId]);
    const user = await queryOne<ClientUser>(c.env, 'SELECT id, tenant_id, email, name FROM client_users WHERE tenant_id = ?', [tenantId]);
    return json(user);
  }

  const password = generatePassword();
  const data = new TextEncoder().encode(password);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hashBuf);
  const hash = btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  if (existing) {
    await execute(c.env,
      'UPDATE client_users SET email = ?, password_hash = ?, name = ? WHERE tenant_id = ?',
      [email || existing.email, hash, name || existing.name, tenantId]
    );
  } else {
    const id = generateId();
    await execute(c.env,
      'INSERT INTO client_users (id, tenant_id, email, password_hash, name) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, email || `${tenantId}@client.local`, hash, name || '']
    );
  }

  return json({ email: email || `${tenantId}@client.local`, password, regenerated: true });
}
