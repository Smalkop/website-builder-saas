import { Context } from 'hono';
import { Env, Product } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

function generateId(): string {
  return crypto.randomUUID();
}

export async function list(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const products = await query<Product>(
    c.env,
    'SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC',
    [tenantId]
  );
  return json(products);
}

export async function get(c: Context<{ Bindings: Env }>) {
  const { tenantId, productId } = c.req.param();
  const product = await queryOne<Product>(
    c.env,
    'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
    [productId, tenantId]
  );
  if (!product) return notFound('Product not found');
  return json(product);
}

export async function create(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();
  const { name, description, price, images, category } = body;

  if (!name) return error('Product name is required');

  const id = generateId();
  await execute(c.env,
    'INSERT INTO products (id, tenant_id, name, description, price, images, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, tenantId, name, description || '', price || 0, JSON.stringify(images || []), category || '']
  );

  const product = await queryOne<Product>(c.env, 'SELECT * FROM products WHERE id = ?', [id]);
  return json(product, 201);
}

export async function update(c: Context<{ Bindings: Env }>) {
  const { tenantId, productId } = c.req.param();
  const body = await c.req.json();
  const { name, description, price, images, category, active } = body;

  const existing = await queryOne<Product>(
    c.env,
    'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
    [productId, tenantId]
  );
  if (!existing) return notFound('Product not found');

  if (name !== undefined) await execute(c.env, 'UPDATE products SET name = ? WHERE id = ?', [name, productId]);
  if (description !== undefined) await execute(c.env, 'UPDATE products SET description = ? WHERE id = ?', [description, productId]);
  if (price !== undefined) await execute(c.env, 'UPDATE products SET price = ? WHERE id = ?', [price, productId]);
  if (images !== undefined) await execute(c.env, 'UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(images), productId]);
  if (category !== undefined) await execute(c.env, 'UPDATE products SET category = ? WHERE id = ?', [category, productId]);
  if (active !== undefined) await execute(c.env, 'UPDATE products SET active = ? WHERE id = ?', [active, productId]);

  const product = await queryOne<Product>(c.env, 'SELECT * FROM products WHERE id = ?', [productId]);
  return json(product);
}

export async function remove(c: Context<{ Bindings: Env }>) {
  const { tenantId, productId } = c.req.param();
  const existing = await queryOne<Product>(
    c.env,
    'SELECT * FROM products WHERE id = ? AND tenant_id = ?',
    [productId, tenantId]
  );
  if (!existing) return notFound('Product not found');

  await execute(c.env, 'DELETE FROM products WHERE id = ?', [productId]);
  return json({ deleted: true });
}
