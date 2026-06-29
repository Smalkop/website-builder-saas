import { Context } from 'hono';
import { Env, Variables, TenantSettings } from '../../types';
import { queryOne, execute } from '../../utils/db';
import { json, notFound } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

export async function get(c: Ctx) {
  const tenantId = c.get('tenantId');
  const settings = await queryOne<TenantSettings>(
    c.env,
    'SELECT * FROM tenant_settings WHERE tenant_id = ?',
    [tenantId]
  );
  if (!settings) return notFound('Settings not found');
  return json(settings);
}

export async function update(c: Ctx) {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const existing = await queryOne(c.env, 'SELECT tenant_id FROM tenant_settings WHERE tenant_id = ?', [tenantId]);
  if (!existing) return notFound('Tenant settings not found');

  const allowed = [
    'business_name', 'business_description', 'primary_color', 'secondary_color',
    'font_family', 'animations_enabled', 'layout_type', 'whatsapp_number',
    'facebook_url', 'instagram_url', 'logo_url', 'banner_url', 'footer_credit_enabled',
  ];

  for (const field of allowed) {
    if (body[field] !== undefined) {
      await execute(c.env, `UPDATE tenant_settings SET ${field} = ? WHERE tenant_id = ?`, [body[field], tenantId]);
    }
  }

  const settings = await queryOne<TenantSettings>(
    c.env,
    'SELECT * FROM tenant_settings WHERE tenant_id = ?',
    [tenantId]
  );
  return json(settings);
}

export async function uploadImage(c: Ctx) {
  const tenantId = c.get('tenantId');
  const body = await c.req.parseBody();
  const file = body.file as File | null;
  if (!file) return json({ error: 'No file provided' }, 400);
  const ext = file.name.split('.').pop() || 'png';
  const key = `${tenantId}/${crypto.randomUUID()}.${ext}`;
  await c.env.ASSETS.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  const publicUrl = `${new URL(c.req.url).origin}/assets/${key}`;
  return json({ url: publicUrl, key });
}
