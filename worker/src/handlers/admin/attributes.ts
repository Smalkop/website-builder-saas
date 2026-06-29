import { Context } from 'hono';
import { Env, Variables, ProductAttribute, AttributeValue } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

function generateId(): string {
  return crypto.randomUUID();
}

function getTenantId(c: Ctx): string {
  return c.get('tenantId') || c.req.param('tenantId') || '';
}

export async function list(c: Ctx) {
  const tenantId = getTenantId(c);
  if (!tenantId) return notFound('Tenant not resolved');
  const attributes = await query<ProductAttribute>(
    c.env,
    'SELECT * FROM product_attributes WHERE tenant_id = ? ORDER BY sort_order ASC, created_at ASC',
    [tenantId]
  );
  const values = await query<AttributeValue>(
    c.env,
    `SELECT av.* FROM attribute_values av
     JOIN product_attributes pa ON pa.id = av.attribute_id
     WHERE pa.tenant_id = ? ORDER BY av.sort_order ASC, av.created_at ASC`,
    [tenantId]
  );
  const grouped = attributes.map(attr => ({
    ...attr,
    values: values.filter(v => v.attribute_id === attr.id),
  }));
  return json(grouped);
}

export async function create(c: Ctx) {
  const tenantId = c.req.param('tenantId');
  if (!tenantId) return error('Tenant ID required');
  const body = await c.req.json();
  const { name, required, active } = body;
  if (!name) return error('Attribute name is required');
  const id = generateId();
  const maxSort = await queryOne<{ max: number }>(
    c.env,
    'SELECT COALESCE(MAX(sort_order), -1) as max FROM product_attributes WHERE tenant_id = ?',
    [tenantId]
  );
  const sortOrder = (maxSort?.max ?? -1) + 1;
  await execute(c.env,
    'INSERT INTO product_attributes (id, tenant_id, name, sort_order, required, active) VALUES (?, ?, ?, ?, ?, ?)',
    [id, tenantId, name, sortOrder, required ? 1 : 0, active !== undefined ? (active ? 1 : 0) : 1]
  );
  const attr = await queryOne<ProductAttribute>(c.env, 'SELECT * FROM product_attributes WHERE id = ?', [id]);
  return json({ ...attr, values: [] }, 201);
}

export async function update(c: Ctx) {
  const { tenantId, attributeId } = c.req.param();
  const body = await c.req.json();
  const existing = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!existing) return notFound('Attribute not found');
  const { name, required, active } = body;
  if (name !== undefined) await execute(c.env, 'UPDATE product_attributes SET name = ? WHERE id = ?', [name, attributeId]);
  if (required !== undefined) await execute(c.env, 'UPDATE product_attributes SET required = ? WHERE id = ?', [required ? 1 : 0, attributeId]);
  if (active !== undefined) await execute(c.env, 'UPDATE product_attributes SET active = ? WHERE id = ?', [active ? 1 : 0, attributeId]);
  const attr = await queryOne<ProductAttribute>(c.env, 'SELECT * FROM product_attributes WHERE id = ?', [attributeId]);
  const attrValues = await query<AttributeValue>(c.env, 'SELECT * FROM attribute_values WHERE attribute_id = ? ORDER BY sort_order ASC', [attributeId]);
  return json({ ...attr, values: attrValues });
}

export async function remove(c: Ctx) {
  const { tenantId, attributeId } = c.req.param();
  const existing = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!existing) return notFound('Attribute not found');
  await execute(c.env, 'DELETE FROM attribute_values WHERE attribute_id = ?', [attributeId]);
  await execute(c.env, 'DELETE FROM product_attributes WHERE id = ?', [attributeId]);
  return json({ deleted: true });
}

export async function reorder(c: Ctx) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { order } = body;
  if (!Array.isArray(order)) return error('order must be an array of attribute IDs');
  for (let i = 0; i < order.length; i++) {
    await execute(c.env,
      'UPDATE product_attributes SET sort_order = ? WHERE id = ? AND tenant_id = ?',
      [i, order[i], tenantId]
    );
  }
  return json({ success: true });
}

export async function createValue(c: Ctx) {
  const tenantId = getTenantId(c);
  const attributeId = c.req.param('attributeId');
  if (!tenantId || !attributeId) return error('Tenant and attribute required');
  const attr = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!attr) return notFound('Attribute not found');
  const body = await c.req.json();
  const { value } = body;
  if (!value) return error('Value is required');
  const id = generateId();
  const maxSort = await queryOne<{ max: number }>(
    c.env,
    'SELECT COALESCE(MAX(sort_order), -1) as max FROM attribute_values WHERE attribute_id = ?',
    [attributeId]
  );
  const sortOrder = (maxSort?.max ?? -1) + 1;
  await execute(c.env,
    'INSERT INTO attribute_values (id, attribute_id, value, sort_order) VALUES (?, ?, ?, ?)',
    [id, attributeId, value, sortOrder]
  );
  const created = await queryOne<AttributeValue>(c.env, 'SELECT * FROM attribute_values WHERE id = ?', [id]);
  return json(created, 201);
}

export async function updateValue(c: Ctx) {
  const { tenantId, attributeId, valueId } = c.req.param();
  const attr = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!attr) return notFound('Attribute not found');
  const existing = await queryOne(
    c.env, 'SELECT id FROM attribute_values WHERE id = ? AND attribute_id = ?',
    [valueId, attributeId]
  );
  if (!existing) return notFound('Value not found');
  const body = await c.req.json();
  const { value } = body;
  if (value !== undefined) await execute(c.env, 'UPDATE attribute_values SET value = ? WHERE id = ?', [value, valueId]);
  const updated = await queryOne<AttributeValue>(c.env, 'SELECT * FROM attribute_values WHERE id = ?', [valueId]);
  return json(updated);
}

export async function removeValue(c: Ctx) {
  const { tenantId, attributeId, valueId } = c.req.param();
  const attr = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!attr) return notFound('Attribute not found');
  const existing = await queryOne(
    c.env, 'SELECT id FROM attribute_values WHERE id = ? AND attribute_id = ?',
    [valueId, attributeId]
  );
  if (!existing) return notFound('Value not found');
  await execute(c.env, 'DELETE FROM attribute_values WHERE id = ?', [valueId]);
  return json({ deleted: true });
}

export async function reorderValues(c: Ctx) {
  const { tenantId, attributeId } = c.req.param();
  const attr = await queryOne(
    c.env, 'SELECT id FROM product_attributes WHERE id = ? AND tenant_id = ?',
    [attributeId, tenantId]
  );
  if (!attr) return notFound('Attribute not found');
  const body = await c.req.json();
  const { order } = body;
  if (!Array.isArray(order)) return error('order must be an array of value IDs');
  for (let i = 0; i < order.length; i++) {
    await execute(c.env,
      'UPDATE attribute_values SET sort_order = ? WHERE id = ? AND attribute_id = ?',
      [i, order[i], attributeId]
    );
  }
  return json({ success: true });
}
