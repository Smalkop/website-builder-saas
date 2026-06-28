import { Env } from '../types';

export function getDb(env: Env): D1Database {
  return env.DB;
}

export async function query<T>(env: Env, sql: string, params?: unknown[]): Promise<T[]> {
  const db = getDb(env);
  const stmt = db.prepare(sql);
  const { results } = params ? await stmt.bind(...params).all<T>() : await stmt.all<T>();
  return results;
}

export async function queryOne<T>(env: Env, sql: string, params?: unknown[]): Promise<T | null> {
  const db = getDb(env);
  const stmt = db.prepare(sql);
  const result = params ? await stmt.bind(...params).first<T>() : await stmt.first<T>();
  return result || null;
}

export async function execute(env: Env, sql: string, params?: unknown[]): Promise<D1Result> {
  const db = getDb(env);
  const stmt = db.prepare(sql);
  return params ? await stmt.bind(...params).run() : await stmt.run();
}
