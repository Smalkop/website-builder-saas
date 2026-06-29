import { Context } from 'hono';
import { Env, MenuItem } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

function generateId(): string {
  return crypto.randomUUID();
}

export async function list(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const items = await query<MenuItem>(
    c.env,
    'SELECT * FROM menu_items WHERE tenant_id = ? ORDER BY sort_order ASC, created_at ASC',
    [tenantId]
  );
  return json(items);
}

export async function create(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { label, anchor, sort_order, parent_id } = body;
  if (!label || !anchor) return error('Label and anchor are required');

  if (parent_id) {
    const parent = await queryOne(c.env, 'SELECT id FROM menu_items WHERE id = ? AND tenant_id = ?', [parent_id, tenantId]);
    if (!parent) return error('Parent item not found');
  }

  const id = generateId();
  await execute(c.env,
    'INSERT INTO menu_items (id, tenant_id, label, anchor, sort_order, parent_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, tenantId, label, anchor, sort_order || 0, parent_id || null]
  );
  const item = await queryOne<MenuItem>(c.env, 'SELECT * FROM menu_items WHERE id = ?', [id]);
  return json(item, 201);
}

export async function update(c: Context<{ Bindings: Env }>) {
  const { tenantId, itemId } = c.req.param();
  const body = await c.req.json();
  const existing = await queryOne(c.env, 'SELECT id FROM menu_items WHERE id = ? AND tenant_id = ?', [itemId, tenantId]);
  if (!existing) return notFound('Menu item not found');

  const { label, anchor, sort_order, parent_id } = body;
  if (label !== undefined) await execute(c.env, 'UPDATE menu_items SET label = ? WHERE id = ?', [label, itemId]);
  if (anchor !== undefined) await execute(c.env, 'UPDATE menu_items SET anchor = ? WHERE id = ?', [anchor, itemId]);
  if (sort_order !== undefined) await execute(c.env, 'UPDATE menu_items SET sort_order = ? WHERE id = ?', [sort_order, itemId]);
  if (parent_id !== undefined) await execute(c.env, 'UPDATE menu_items SET parent_id = ? WHERE id = ?', [parent_id || null, itemId]);

  const item = await queryOne<MenuItem>(c.env, 'SELECT * FROM menu_items WHERE id = ?', [itemId]);
  return json(item);
}

export async function remove(c: Context<{ Bindings: Env }>) {
  const { tenantId, itemId } = c.req.param();
  const existing = await queryOne(c.env, 'SELECT id FROM menu_items WHERE id = ? AND tenant_id = ?', [itemId, tenantId]);
  if (!existing) return notFound('Menu item not found');
  await execute(c.env, 'DELETE FROM menu_items WHERE id = ?', [itemId]);
  return json({ deleted: true });
}
