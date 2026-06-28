import { Env } from '../types';

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  content: string;
}

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

async function cfApi(env: Env, path: string, method: string = 'GET', body?: unknown): Promise<any> {
  const res = await fetch(`${CLOUDFLARE_API}/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function createDnsRecord(env: Env, slug: string): Promise<void> {
  const name = `${slug}.${env.PLATFORM_DOMAIN}`;
  const result = await cfApi(env, '', 'POST', {
    type: 'A',
    name,
    content: '192.0.2.1',
    proxied: true,
    ttl: 1,
  });
  if (!result.success) {
    console.error('DNS create failed:', result.errors);
  }
}

export async function deleteDnsRecord(env: Env, slug: string): Promise<void> {
  const name = `${slug}.${env.PLATFORM_DOMAIN}`;
  const listResult = await cfApi(env, `?name=${name}&type=A`);
  if (!listResult.success) {
    console.error('DNS list failed:', listResult.errors);
    return;
  }
  const records: DnsRecord[] = listResult.result || [];
  for (const record of records) {
    const delResult = await cfApi(env, `/${record.id}`, 'DELETE');
    if (!delResult.success) {
      console.error('DNS delete failed:', delResult.errors);
    }
  }
}
