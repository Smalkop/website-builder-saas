import { Context } from 'hono';
import { Env, Variables, Product } from '../../types';
import { query, queryOne, execute } from '../../utils/db';
import { json, error, notFound } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

function generateId(): string {
  return crypto.randomUUID();
}

const PRODUCT_SELECT = `
  SELECT p.*, c.name as category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export async function list(c: Ctx) {
  const tenantId = c.get('tenantId');
  const products = await query<Product>(
    c.env,
    `${PRODUCT_SELECT} WHERE p.tenant_id = ? ORDER BY p.created_at DESC`,
    [tenantId]
  );
  return json(products);
}

export async function get(c: Ctx) {
  const tenantId = c.get('tenantId');
  const { productId } = c.req.param();
  const product = await queryOne<Product>(
    c.env,
    `${PRODUCT_SELECT} WHERE p.id = ? AND p.tenant_id = ?`,
    [productId, tenantId]
  );
  if (!product) return notFound('Product not found');
  return json(product);
}

export async function create(c: Ctx) {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();
  const { name, description, price, images, category_id, offer_price, offer_active } = body;
  if (!name) return error('Product name is required');

  const tenant = await queryOne<{ max_products: number }>(c.env, 'SELECT max_products FROM tenants WHERE id = ?', [tenantId]);
  const count = await queryOne<{ cnt: number }>(c.env, 'SELECT COUNT(*) as cnt FROM products WHERE tenant_id = ?', [tenantId]);
  if (tenant && count && count.cnt >= tenant.max_products) {
    return error(`Product limit (${tenant.max_products}) reached`);
  }

  const id = generateId();
  await execute(c.env,
    'INSERT INTO products (id, tenant_id, name, description, price, images, category_id, offer_price, offer_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, tenantId, name, description || '', price || 0, JSON.stringify(images || []), category_id || null, offer_price || null, offer_active ? 1 : 0]
  );
  const product = await queryOne<Product>(c.env, `${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
  return json(product, 201);
}

export async function update(c: Ctx) {
  const tenantId = c.get('tenantId');
  const { productId } = c.req.param();
  const body = await c.req.json();
  const { name, description, price, images, category_id, active, offer_price, offer_active } = body;

  const existing = await queryOne<Product>(c.env, `${PRODUCT_SELECT} WHERE p.id = ? AND p.tenant_id = ?`, [productId, tenantId]);
  if (!existing) return notFound('Product not found');

  if (name !== undefined) await execute(c.env, 'UPDATE products SET name = ? WHERE id = ?', [name, productId]);
  if (description !== undefined) await execute(c.env, 'UPDATE products SET description = ? WHERE id = ?', [description, productId]);
  if (price !== undefined) await execute(c.env, 'UPDATE products SET price = ? WHERE id = ?', [price, productId]);
  if (images !== undefined) await execute(c.env, 'UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(images), productId]);
  if (category_id !== undefined) await execute(c.env, 'UPDATE products SET category_id = ? WHERE id = ?', [category_id || null, productId]);
  if (active !== undefined) await execute(c.env, 'UPDATE products SET active = ? WHERE id = ?', [active, productId]);
  if (offer_price !== undefined) await execute(c.env, 'UPDATE products SET offer_price = ? WHERE id = ?', [offer_price, productId]);
  if (offer_active !== undefined) await execute(c.env, 'UPDATE products SET offer_active = ? WHERE id = ?', [offer_active ? 1 : 0, productId]);

  const product = await queryOne<Product>(c.env, `${PRODUCT_SELECT} WHERE p.id = ?`, [productId]);
  return json(product);
}

export async function remove(c: Ctx) {
  const tenantId = c.get('tenantId');
  const { productId } = c.req.param();
  const existing = await queryOne<Product>(c.env, 'SELECT * FROM products WHERE id = ? AND tenant_id = ?', [productId, tenantId]);
  if (!existing) return notFound('Product not found');
  await execute(c.env, 'DELETE FROM products WHERE id = ?', [productId]);
  return json({ deleted: true });
}

export async function uploadImage(c: Ctx) {
  const tenantId = c.get('tenantId');
  const body = await c.req.parseBody();
  const file = body.file as File | null;
  if (!file) return error('No file provided');
  const ext = file.name.split('.').pop() || 'png';
  const key = `${tenantId}/${crypto.randomUUID()}.${ext}`;
  await c.env.ASSETS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const publicUrl = `${new URL(c.req.url).origin}/assets/${key}`;
  return json({ url: publicUrl, key }, 201);
}
