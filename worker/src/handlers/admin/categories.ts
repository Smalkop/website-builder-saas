import { Context } from 'hono';
import { Env, Category } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

function generateId(): string {
  return crypto.randomUUID();
}

export async function list(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const categories = await query<Category>(
    c.env,
    'SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC',
    [tenantId]
  );
  return json(categories);
}

export async function create(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { name } = body;
  if (!name) return error('Category name is required');
  const id = generateId();
  await execute(c.env, 'INSERT INTO categories (id, tenant_id, name) VALUES (?, ?, ?)', [id, tenantId, name]);
  const cat = await queryOne<Category>(c.env, 'SELECT * FROM categories WHERE id = ?', [id]);
  return json(cat, 201);
}

export async function update(c: Context<{ Bindings: Env }>) {
  const { tenantId, categoryId } = c.req.param();
  const body = await c.req.json();
  const { name } = body;
  const existing = await queryOne(c.env, 'SELECT id FROM categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
  if (!existing) return notFound('Category not found');
  await execute(c.env, 'UPDATE categories SET name = ? WHERE id = ?', [name, categoryId]);
  const cat = await queryOne<Category>(c.env, 'SELECT * FROM categories WHERE id = ?', [categoryId]);
  return json(cat);
}

export async function remove(c: Context<{ Bindings: Env }>) {
  const { tenantId, categoryId } = c.req.param();
  const existing = await queryOne(c.env, 'SELECT id FROM categories WHERE id = ? AND tenant_id = ?', [categoryId, tenantId]);
  if (!existing) return notFound('Category not found');
  await execute(c.env, 'UPDATE products SET category_id = NULL WHERE category_id = ?', [categoryId]);
  await execute(c.env, 'DELETE FROM categories WHERE id = ?', [categoryId]);
  return json({ deleted: true });
}
