import { Context, Next } from 'hono';
import { Env, Variables } from '../types';
import { queryOne } from '../utils/db';
import { getCachedTenant, setCachedTenant, getCachedDomain, setCachedDomain } from '../utils/cache';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

export async function resolveTenant(c: Ctx, next: Next) {
  const env = c.env;
  const host = c.req.header('host') || '';

  let tenantId = '';
  let tenantSlug = '';
  let tenantName = '';

  const adminDomain = env.ADMIN_DOMAIN;
  const platformDomain = env.PLATFORM_DOMAIN;

  if (host === adminDomain) {
    return next();
  }

  if (host.endsWith(`.${platformDomain}`)) {
    const slug = host.replace(`.${platformDomain}`, '').split('.')[0];
    const cached = await getCachedTenant(env, slug);
    if (cached) {
      tenantId = cached.id;
      tenantSlug = cached.slug;
      tenantName = cached.name;
    } else {
      const tenant = await queryOne<{ id: string; slug: string; name: string }>(
        env,
        'SELECT id, slug, name FROM tenants WHERE slug = ? AND status = ?',
        [slug, 'active']
      );
      if (tenant) {
        tenantId = tenant.id;
        tenantSlug = tenant.slug;
        tenantName = tenant.name;
        await setCachedTenant(env, slug, tenant);
      }
    }
  } else {
    const cached = await getCachedDomain(env, host);
    if (cached) {
      tenantId = cached.tenant_id;
      tenantSlug = cached.slug;
      tenantName = cached.name;
    } else {
      const result = await queryOne<{ tenant_id: string; slug: string; name: string }>(
        env,
        `SELECT d.tenant_id, t.slug, t.name
         FROM domains d
         JOIN tenants t ON t.id = d.tenant_id
         WHERE d.domain = ? AND d.verified = 1 AND t.status = ?`,
        [host, 'active']
      );
      if (result) {
        tenantId = result.tenant_id;
        tenantSlug = result.slug;
        tenantName = result.name;
        await setCachedDomain(env, host, result);
      }
    }
  }

  if (tenantId) {
    c.set('tenantId', tenantId);
    c.set('tenantSlug', tenantSlug);
    c.set('tenantName', tenantName);
  }

  return next();
}
