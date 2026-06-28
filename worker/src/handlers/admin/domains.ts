import { Context } from 'hono';
import { Env, Domain } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';
import { invalidateDomainCache } from '../../utils/cache';

function generateId(): string {
  return crypto.randomUUID();
}

export async function list(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const domains = await query<Domain>(
    c.env,
    'SELECT * FROM domains WHERE tenant_id = ? ORDER BY created_at DESC',
    [tenantId]
  );
  return json(domains);
}

export async function create(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { domain } = body;

  if (!domain) return error('Domain is required');

  const existing = await queryOne(c.env, 'SELECT id FROM domains WHERE domain = ?', [domain]);
  if (existing) return error('Domain already registered');

  const id = generateId();
  await execute(c.env,
    'INSERT INTO domains (id, tenant_id, domain, type, verified) VALUES (?, ?, ?, ?, ?)',
    [id, tenantId, domain, 'custom', 0]
  );

  const created = await queryOne<Domain>(c.env, 'SELECT * FROM domains WHERE id = ?', [id]);
  return json(created, 201);
}

export async function verify(c: Context<{ Bindings: Env }>) {
  const { tenantId, domainId } = c.req.param();

  const existing = await queryOne<Domain>(
    c.env,
    'SELECT * FROM domains WHERE id = ? AND tenant_id = ?',
    [domainId, tenantId]
  );
  if (!existing) return notFound('Domain not found');

  await execute(c.env, 'UPDATE domains SET verified = 1 WHERE id = ?', [domainId]);
  await invalidateDomainCache(c.env, existing.domain);

  return json({ id: domainId, verified: 1 });
}

export async function remove(c: Context<{ Bindings: Env }>) {
  const { tenantId, domainId } = c.req.param();

  const existing = await queryOne<Domain>(
    c.env,
    'SELECT * FROM domains WHERE id = ? AND tenant_id = ?',
    [domainId, tenantId]
  );
  if (!existing) return notFound('Domain not found');

  await execute(c.env, 'DELETE FROM domains WHERE id = ?', [domainId]);
  await invalidateDomainCache(c.env, existing.domain);

  return json({ deleted: true });
}
