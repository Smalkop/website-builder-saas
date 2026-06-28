import { Context, Next } from 'hono';
import { Env, Variables, JwtPayload } from '../types';
import { unauthorized } from '../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

function b64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(b64UrlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = `${parts[0]}.${parts[1]}`;
    const sigBytes = Uint8Array.from(b64UrlDecode(parts[2]), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!valid) return null;

    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export async function adminAuth(c: Ctx, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized('Missing or invalid token');
  }

  const token = authHeader.slice(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return unauthorized('Invalid or expired token');
  }

  c.set('userId', payload.sub);
  c.set('userEmail', payload.email);
  c.set('userRole', payload.role);

  return next();
}
