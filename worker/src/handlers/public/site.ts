import { Context } from 'hono';
import { Env, Variables, TenantSettings, Product } from '../../types';
import { queryOne, query } from '../../utils/db';
import { json, notFound } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

export async function getConfig(c: Ctx) {
  const tenantId = c.get('tenantId');
  if (!tenantId) return notFound('Tenant not resolved');

  const settings = await queryOne<TenantSettings>(
    c.env,
    'SELECT * FROM tenant_settings WHERE tenant_id = ?',
    [tenantId]
  );
  if (!settings) return notFound('Settings not found');

  return json({
    business_name: settings.business_name,
    business_description: settings.business_description,
    logo_url: settings.logo_url,
    banner_url: settings.banner_url,
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    font_family: settings.font_family,
    animations_enabled: settings.animations_enabled,
    layout_type: settings.layout_type,
    whatsapp_number: settings.whatsapp_number,
    facebook_url: settings.facebook_url,
    instagram_url: settings.instagram_url,
    footer_credit_enabled: settings.footer_credit_enabled,
  });
}

const PRODUCT_SELECT = `
  SELECT p.*, c.name as category_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

export async function getProducts(c: Ctx) {
  const tenantId = c.get('tenantId');
  if (!tenantId) return notFound('Tenant not resolved');

  const products = await query<Product>(
    c.env,
    `${PRODUCT_SELECT} WHERE p.tenant_id = ? AND p.active = 1 ORDER BY p.created_at DESC`,
    [tenantId]
  );

  const parsed = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
  }));

  return json(parsed);
}

export async function getProduct(c: Ctx) {
  const tenantId = c.get('tenantId');
  if (!tenantId) return notFound('Tenant not resolved');

  const { productId } = c.req.param();
  const product = await queryOne<Product>(
    c.env,
    `${PRODUCT_SELECT} WHERE p.id = ? AND p.tenant_id = ? AND p.active = 1`,
    [productId, tenantId]
  );
  if (!product) return notFound('Product not found');

  return json({ ...product, images: JSON.parse(product.images || '[]') });
}

export async function getMenu(c: Ctx) {
  const tenantId = c.get('tenantId');
  if (!tenantId) return notFound('Tenant not resolved');
  const items = await query(
    c.env,
    'SELECT * FROM menu_items WHERE tenant_id = ? ORDER BY sort_order ASC, created_at ASC',
    [tenantId]
  );
  const topLevel = items.filter((i: any) => !i.parent_id);
  const children = items.filter((i: any) => i.parent_id);
  const tree = topLevel.map((item: any) => ({
    ...item,
    children: children.filter((c: any) => c.parent_id === item.id),
  }));
  return json(tree);
}

export async function getCategories(c: Ctx) {
  const tenantId = c.get('tenantId');
  if (!tenantId) return notFound('Tenant not resolved');
  const categories = await query(
    c.env,
    'SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC',
    [tenantId]
  );
  return json(categories);
}
