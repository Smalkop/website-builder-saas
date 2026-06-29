import { Hono } from 'hono';
import { Env, Variables } from './types';
import { cors } from './middleware/cors';
import { resolveTenant } from './middleware/tenant';
import { adminAuth } from './middleware/auth';
import { clientAuth } from './middleware/client-auth';
import { json } from './utils/response';

import * as authHandler from './handlers/admin/auth';
import * as tenantsHandler from './handlers/admin/tenants';
import * as productsHandler from './handlers/admin/products';
import * as domainsHandler from './handlers/admin/domains';
import * as settingsHandler from './handlers/admin/settings';
import * as storageHandler from './handlers/admin/storage';
import * as categoriesHandler from './handlers/admin/categories';
import * as menusHandler from './handlers/admin/menus';
import * as clientUsersHandler from './handlers/admin/client-users';
import * as siteHandler from './handlers/public/site';
import * as clientAuthHandler from './handlers/client/auth';
import * as clientProductsHandler from './handlers/client/products';
import * as clientCategoriesHandler from './handlers/client/categories';
import * as clientMenusHandler from './handlers/client/menus';
import * as clientSettingsHandler from './handlers/client/settings';

type Bindings = { Bindings: Env; Variables: Variables };
const app = new Hono<Bindings>();

app.use('*', cors);
app.use('*', resolveTenant);

app.get('/api/health', (c) => json({ status: 'ok', timestamp: new Date().toISOString() }));

// Admin login (no auth)
const authLogin = new Hono<Bindings>();
authLogin.post('/auth/login', authHandler.login);

// Client login (no auth)
const clientLogin = new Hono<Bindings>();
clientLogin.post('/auth/login', clientAuthHandler.login);

// Admin API (requires admin auth)
const adminApi = new Hono<Bindings>();
adminApi.use('*', adminAuth);

adminApi.get('/auth/me', authHandler.me);

adminApi.get('/tenants', tenantsHandler.list);
adminApi.post('/tenants', tenantsHandler.create);
adminApi.get('/tenants/:id', tenantsHandler.get);
adminApi.put('/tenants/:id', tenantsHandler.update);
adminApi.patch('/tenants/:id/status', tenantsHandler.toggleStatus);
adminApi.delete('/tenants/:id', tenantsHandler.remove);

adminApi.get('/tenants/:tenantId/settings', settingsHandler.get);
adminApi.put('/tenants/:tenantId/settings', settingsHandler.update);

adminApi.get('/tenants/:tenantId/products', productsHandler.list);
adminApi.post('/tenants/:tenantId/products', productsHandler.create);
adminApi.get('/tenants/:tenantId/products/:productId', productsHandler.get);
adminApi.put('/tenants/:tenantId/products/:productId', productsHandler.update);
adminApi.delete('/tenants/:tenantId/products/:productId', productsHandler.remove);

adminApi.get('/tenants/:tenantId/domains', domainsHandler.list);
adminApi.post('/tenants/:tenantId/domains', domainsHandler.create);
adminApi.post('/tenants/:tenantId/domains/:domainId/verify', domainsHandler.verify);
adminApi.delete('/tenants/:tenantId/domains/:domainId', domainsHandler.remove);

adminApi.post('/tenants/:tenantId/upload', storageHandler.uploadImage);

adminApi.get('/tenants/:tenantId/categories', categoriesHandler.list);
adminApi.post('/tenants/:tenantId/categories', categoriesHandler.create);
adminApi.put('/tenants/:tenantId/categories/:categoryId', categoriesHandler.update);
adminApi.delete('/tenants/:tenantId/categories/:categoryId', categoriesHandler.remove);

adminApi.get('/tenants/:tenantId/menus', menusHandler.list);
adminApi.post('/tenants/:tenantId/menus', menusHandler.create);
adminApi.put('/tenants/:tenantId/menus/:itemId', menusHandler.update);
adminApi.delete('/tenants/:tenantId/menus/:itemId', menusHandler.remove);

adminApi.get('/tenants/:tenantId/client-user', clientUsersHandler.get);
adminApi.put('/tenants/:tenantId/client-user', clientUsersHandler.createOrUpdate);

app.route('/api/admin', authLogin);
app.route('/api/admin', adminApi);

// Client API (requires client auth)
const clientApi = new Hono<Bindings>();
clientApi.use('*', clientAuth);
clientApi.get('/products', clientProductsHandler.list);
clientApi.get('/products/:productId', clientProductsHandler.get);
clientApi.post('/products', clientProductsHandler.create);
clientApi.put('/products/:productId', clientProductsHandler.update);
clientApi.delete('/products/:productId', clientProductsHandler.remove);
clientApi.post('/upload', clientProductsHandler.uploadImage);

clientApi.get('/categories', clientCategoriesHandler.list);
clientApi.post('/categories', clientCategoriesHandler.create);
clientApi.put('/categories/:categoryId', clientCategoriesHandler.update);
clientApi.delete('/categories/:categoryId', clientCategoriesHandler.remove);

clientApi.get('/menus', clientMenusHandler.list);
clientApi.post('/menus', clientMenusHandler.create);
clientApi.put('/menus/:itemId', clientMenusHandler.update);
clientApi.delete('/menus/:itemId', clientMenusHandler.remove);

clientApi.get('/settings', clientSettingsHandler.get);
clientApi.put('/settings', clientSettingsHandler.update);
clientApi.post('/settings/upload', clientSettingsHandler.uploadImage);

app.route('/api/client', clientLogin);
app.route('/api/client', clientApi);

// Public site API
const publicApi = new Hono<Bindings>();
publicApi.get('/config', siteHandler.getConfig);
publicApi.get('/products', siteHandler.getProducts);
publicApi.get('/products/:productId', siteHandler.getProduct);
publicApi.get('/menu', siteHandler.getMenu);
publicApi.get('/categories', siteHandler.getCategories);

app.route('/api/site', publicApi);

app.get('/assets/:key', (c) => {
  const key = c.req.param('key');
  if (!key) return json({ error: 'Invalid asset path' }, 400);
  return storageHandler.serveAsset(c);
});

function mimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const types: Record<string, string> = {
    js: 'application/javascript',
    css: 'text/css',
    html: 'text/html',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    json: 'application/json',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
  };
  return types[ext] || 'application/octet-stream';
}

async function serveAsset(obj: any, path: string): Promise<Response> {
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Content-Type', mimeType(path));
  headers.set('Cache-Control', 'public, max-age=31536000');
  return new Response(obj.body, { headers });
}

async function serveHtml(c: any, key: string): Promise<Response> {
  const obj = await c.env.ASSETS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-cache');
  return new Response(obj.body, { headers });
}

const ADMIN_HTML_KEY = 'admin/index.html';
const CLIENT_ADMIN_HTML_KEY = 'client-admin/index.html';
const CLIENT_SITE_HTML_KEY = 'site/index.html';

app.get('/admin*', async (c) => {
  const url = new URL(c.req.url);
  if (url.pathname === '/admin/' || url.pathname === '/admin') {
    return serveHtml(c, ADMIN_HTML_KEY);
  }
  if (url.pathname.startsWith('/admin/assets/')) {
    const key = url.pathname.slice(1);
    const obj = await c.env.ASSETS.get(key);
    if (!obj) return new Response('Not found', { status: 404 });
    return serveAsset(obj, key);
  }
  return serveHtml(c, ADMIN_HTML_KEY);
});

app.get('*', async (c) => {
  const host = c.req.header('host') || '';
  const url = new URL(c.req.url);

  if (host === c.env.ADMIN_DOMAIN && url.pathname === '/') {
    return Response.redirect(`${url.origin}/admin/`, 302);
  }

  const tenantId = c.get('tenantId');
  if (tenantId) {
    if (url.pathname.startsWith('/site/assets/')) {
      const key = url.pathname.slice(1);
      const obj = await c.env.ASSETS.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      return serveAsset(obj, key);
    }
    if (url.pathname === '/' || url.pathname.startsWith('/site/')) {
      return serveHtml(c, CLIENT_SITE_HTML_KEY);
    }
    if (url.pathname.startsWith('/admin/')) {
      return serveHtml(c, CLIENT_ADMIN_HTML_KEY);
    }
    return serveHtml(c, CLIENT_SITE_HTML_KEY);
  }

  return new Response('Website Builder SaaS — brahian.dev', {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
});

export default app;