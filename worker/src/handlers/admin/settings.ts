import { Context } from 'hono';
import { Env, TenantSettings } from '../../types';
import { queryOne, execute } from '../../utils/db';
import { json, notFound } from '../../utils/response';

export async function get(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const settings = await queryOne<TenantSettings>(
    c.env,
    'SELECT * FROM tenant_settings WHERE tenant_id = ?',
    [tenantId]
  );
  if (!settings) return notFound('Settings not found');
  return json(settings);
}

export async function update(c: Context<{ Bindings: Env }>) {
  const { tenantId } = c.req.param();
  const body = await c.req.json();

  const existing = await queryOne(c.env, 'SELECT tenant_id FROM tenant_settings WHERE tenant_id = ?', [tenantId]);
  if (!existing) return notFound('Tenant settings not found');

  const fields = [
    'logo_url', 'banner_url', 'primary_color', 'secondary_color',
    'font_family', 'animations_enabled', 'layout_type', 'whatsapp_number',
    'business_name', 'business_description', 'facebook_url', 'instagram_url'
  ];

  for (const field of fields) {
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
