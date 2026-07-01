/**
 * Validates required Supabase environment variables.
 * Throws at runtime if misconfigured (avoids silent failures).
 */

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to .env.local (see .env.example).`
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
