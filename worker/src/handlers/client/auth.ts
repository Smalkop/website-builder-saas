import { Context } from 'hono';
import { Env, Variables } from '../../types';
import { queryOne } from '../../utils/db';
import { json, error, unauthorized } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

function b64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64UrlEncode(hash);
}

async function createJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = b64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64UrlEncode(new TextEncoder().encode(JSON.stringify({
    ...payload, exp: Math.floor(Date.now() / 1000) + 86400 * 7,
  })));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64UrlEncode(sig)}`;
}

export async function login(c: Ctx) {
  const { email, password } = await c.req.json();
  if (!email || !password) return error('Email and password required');

  const user = await queryOne<{ id: string; tenant_id: string; email: string; password_hash: string; name: string }>(
    c.env,
    'SELECT id, tenant_id, email, password_hash, name FROM client_users WHERE email = ?',
    [email]
  );
  if (!user) return unauthorized('Invalid credentials');

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) return unauthorized('Invalid credentials');

  const token = await createJwt(
    { sub: user.id, email: user.email, role: user.tenant_id },
    c.env.JWT_SECRET
  );

  return json({ token, user: { id: user.id, email: user.email, name: user.name } });
}
