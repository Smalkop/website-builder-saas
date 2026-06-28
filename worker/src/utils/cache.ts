import { Env } from '../types';

const TENANT_CACHE_TTL = 300;
const DOMAIN_CACHE_TTL = 300;

export async function getCachedTenant(env: Env, slug: string) {
  const key = `tenant:slug:${slug}`;
  const cached = await env.CACHE.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

export async function setCachedTenant(env: Env, slug: string, data: unknown) {
  const key = `tenant:slug:${slug}`;
  await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: TENANT_CACHE_TTL });
}

export async function getCachedDomain(env: Env, domain: string) {
  const key = `domain:${domain}`;
  const cached = await env.CACHE.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

export async function setCachedDomain(env: Env, domain: string, data: unknown) {
  const key = `domain:${domain}`;
  await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: DOMAIN_CACHE_TTL });
}

export async function invalidateTenantCache(env: Env, slug: string) {
  await env.CACHE.delete(`tenant:slug:${slug}`);
}

export async function invalidateDomainCache(env: Env, domain: string) {
  await env.CACHE.delete(`domain:${domain}`);
}
