import { Context } from 'hono';
import { Env, Tenant } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';
import { invalidateTenantCache } from '../../utils/cache';
import { createDnsRecord, deleteDnsRecord } from '../../utils/dns';

function generateId(): string {
  return crypto.randomUUID();
}

export async function list(c: Context<{ Bindings: Env }>) {
  const tenants = await query<Tenant>(c.env, 'SELECT * FROM tenants ORDER BY created_at DESC');
  return json(tenants);
}

export async function get(c: Context<{ Bindings: Env }>) {
  const { id } = c.req.param();
  const tenant = await queryOne<Tenant>(c.env, 'SELECT * FROM tenants WHERE id = ?', [id]);
  if (!tenant) return notFound('Tenant not found');

  const settings = await queryOne(c.env, 'SELECT * FROM tenant_settings WHERE tenant_id = ?', [id]);
  const domains = await query(c.env, 'SELECT * FROM domains WHERE tenant_id = ?', [id]);

  return json({ ...tenant, settings, domains });
}

export async function create(c: Context<{ Bindings: Env }>) {
  const body = await c.req.json();
  const { name, slug, primary_color, secondary_color, whatsapp_number, business_name, custom_domain } = body;

  if (!name || !slug) return error('Name and slug are required');

  const id = generateId();
  const platformDomain = c.env.PLATFORM_DOMAIN;
  const subdomain = `${slug}.${platformDomain}`;

  await execute(c.env, 'INSERT INTO tenants (id, name, slug) VALUES (?, ?, ?)', [id, name, slug]);

  await execute(c.env, `
    INSERT INTO tenant_settings (tenant_id, business_name, primary_color, secondary_color, whatsapp_number)
    VALUES (?, ?, ?, ?, ?)
  `, [id, business_name || name, primary_color || '#3B82F6', secondary_color || '#10B981', whatsapp_number || '']);

  await execute(c.env,
    'INSERT INTO domains (id, tenant_id, domain, type, verified) VALUES (?, ?, ?, ?, ?)',
    [generateId(), id, subdomain, 'subdomain', 1]
  );

  if (custom_domain) {
    await execute(c.env,
      'INSERT INTO domains (id, tenant_id, domain, type, verified) VALUES (?, ?, ?, ?, ?)',
      [generateId(), id, custom_domain, 'custom', 0]
    );
  }

  await createDnsRecord(c.env, slug);

  const tenant = await queryOne<Tenant>(c.env, 'SELECT * FROM tenants WHERE id = ?', [id]);
  return json(tenant, 201);
}

export async function update(c: Context<{ Bindings: Env }>) {
  const { id } = c.req.param();
  const body = await c.req.json();
  const { name, slug, status } = body;

  const existing = await queryOne<{ slug: string }>(c.env, 'SELECT slug FROM tenants WHERE id = ?', [id]);
  if (!existing) return notFound('Tenant not found');

  if (name) await execute(c.env, 'UPDATE tenants SET name = ? WHERE id = ?', [name, id]);
  if (slug && slug !== existing.slug) {
    await deleteDnsRecord(c.env, existing.slug);
    await execute(c.env, 'UPDATE tenants SET slug = ? WHERE id = ?', [slug, id]);
    await invalidateTenantCache(c.env, existing.slug);
    await createDnsRecord(c.env, slug);
  } else if (slug) {
    await execute(c.env, 'UPDATE tenants SET slug = ? WHERE id = ?', [slug, id]);
    await invalidateTenantCache(c.env, existing.slug);
  }
  if (status) await execute(c.env, 'UPDATE tenants SET status = ? WHERE id = ?', [status, id]);

  const tenant = await queryOne<Tenant>(c.env, 'SELECT * FROM tenants WHERE id = ?', [id]);
  return json(tenant);
}

export async function toggleStatus(c: Context<{ Bindings: Env }>) {
  const { id } = c.req.param();
  const existing = await queryOne<Tenant>(c.env, 'SELECT * FROM tenants WHERE id = ?', [id]);
  if (!existing) return notFound('Tenant not found');

  const newStatus = existing.status === 'active' ? 'inactive' : 'active';
  await execute(c.env, 'UPDATE tenants SET status = ? WHERE id = ?', [newStatus, id]);

  return json({ id, status: newStatus });
}

export async function remove(c: Context<{ Bindings: Env }>) {
  const { id } = c.req.param();
  const existing = await queryOne<{ slug: string }>(c.env, 'SELECT slug FROM tenants WHERE id = ?', [id]);
  if (!existing) return notFound('Tenant not found');

  await execute(c.env, 'DELETE FROM tenants WHERE id = ?', [id]);
  await invalidateTenantCache(c.env, existing.slug);

  await deleteDnsRecord(c.env, existing.slug);

  return json({ deleted: true });
}
