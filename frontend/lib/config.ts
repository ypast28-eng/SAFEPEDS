/**
 * Application configuration
 * Environment variables will be wired in later phases
 */

export const config = {
  app: {
    name: "PED Health AI",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  openai: {
    // Connected in a later phase
    apiKey: process.env.OPENAI_API_KEY ?? "",
  },
} as const;
