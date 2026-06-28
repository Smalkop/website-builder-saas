import { Context } from 'hono';
import { Env, Variables } from '../../types';
import { json, error } from '../../utils/response';

type Ctx = Context<{ Bindings: Env; Variables: Variables }>;

export async function uploadImage(c: Ctx) {
  const { tenantId } = c.req.param();
  const contentType = c.req.header('Content-Type') || '';

  if (!contentType.includes('multipart/form-data') && !contentType.includes('image/')) {
    return error('Invalid content type');
  }

  const body = await c.req.parseBody();
  const file = body.file as File | null;

  if (!file) return error('No file provided');

  const ext = file.name.split('.').pop() || 'png';
  const key = `${tenantId}/${crypto.randomUUID()}.${ext}`;

  await c.env.ASSETS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const publicUrl = `${new URL(c.req.url).origin}/assets/${key}`;

  return json({ url: publicUrl, key }, 201);
}

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

export async function serveAsset(c: Ctx) {
  const key = c.req.param('key') || '';

  const object = await c.env.ASSETS.get(key);
  if (!object) return error('Asset not found', 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', mimeType(key));
  headers.set('Cache-Control', 'public, max-age=31536000');

  return new Response(object.body, { headers });
}
