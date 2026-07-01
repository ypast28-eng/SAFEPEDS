/** One-time PEDSAFE schema bootstrap (server-only env). */

export const BOOTSTRAP_SCHEMA_VERSION = "20250708100006";

export const BOOTSTRAP_ADVISORY_LOCK_KEY = 837291024;

export function getBootstrapSecret(): string | null {
  return process.env.PEDSAFE_BOOTSTRAP_SECRET?.trim() || null;
}

export function isBootstrapEnabled(): boolean {
  return Boolean(getBootstrapSecret());
}

/**
 * Direct Postgres connection string (Session pooler recommended for DDL).
 * Supabase Dashboard → Project Settings → Database → Connection string → URI
 */
export function getDatabaseUrl(): string | null {
  const url =
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    null;
  return url;
}
