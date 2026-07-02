import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import {
  BOOTSTRAP_ADVISORY_LOCK_KEY,
  BOOTSTRAP_SCHEMA_VERSION,
  getDatabaseUrl,
} from "./config";

const SCHEMA_PATH = join(process.cwd(), "lib/bootstrap/pedsafe-schema.sql");

export type BootstrapStatus =
  | { state: "ready" }
  | { state: "completed"; completedAt: string; schemaVersion: string }
  | { state: "conflict"; message: string };

export function loadPedsafeSchemaSql(): string {
  return readFileSync(SCHEMA_PATH, "utf8");
}

export async function getBootstrapStatus(
  sql: postgres.Sql
): Promise<BootstrapStatus> {
  const [marker] = await sql<{ completed_at: Date; schema_version: string }[]>`
    select completed_at, schema_version
    from public._pedsafe_bootstrap
    where id = 1
  `;

  if (marker) {
    return {
      state: "completed",
      completedAt: marker.completed_at.toISOString(),
      schemaVersion: marker.schema_version,
    };
  }

  const [profilesTable] = await sql<{ exists: boolean }[]>`
    select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'profiles'
    ) as exists
  `;

  if (profilesTable?.exists) {
    const [pedsafeColumn] = await sql<{ exists: boolean }[]>`
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'profiles'
          and column_name = 'is_admin'
      ) as exists
    `;

    if (!pedsafeColumn?.exists) {
      return {
        state: "conflict",
        message:
          "A non-PEDSAFE profiles table already exists (likely SAFEPEDS migrations). Use a new empty Supabase project or apply migrations from the Dashboard.",
      };
    }
  }

  return { state: "ready" };
}

export type BootstrapRunResult =
  | { ok: true; completedAt: string; schemaVersion: string }
  | { ok: false; code: "already_completed" | "conflict" | "lock_busy"; message: string };

export async function runPedsafeBootstrap(): Promise<BootstrapRunResult> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "Missing SUPABASE_DB_URL (or DATABASE_URL). Add your Supabase Postgres connection string to Vercel env vars."
    );
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });

  try {
    const [locked] = await sql<{ locked: boolean }[]>`
      select pg_try_advisory_lock(${BOOTSTRAP_ADVISORY_LOCK_KEY}) as locked
    `;

    if (!locked?.locked) {
      return {
        ok: false,
        code: "lock_busy",
        message: "Bootstrap is already running. Wait a moment and refresh.",
      };
    }

    try {
      const status = await getBootstrapStatus(sql);

      if (status.state === "completed") {
        return {
          ok: false,
          code: "already_completed",
          message: `PEDSAFE schema was already applied on ${status.completedAt}.`,
        };
      }

      if (status.state === "conflict") {
        return { ok: false, code: "conflict", message: status.message };
      }

      const schemaSql = loadPedsafeSchemaSql();
      await sql.unsafe(schemaSql);

      const [marker] = await sql<{ completed_at: Date; schema_version: string }[]>`
        select completed_at, schema_version
        from public._pedsafe_bootstrap
        where id = 1
      `;

      return {
        ok: true,
        completedAt: marker?.completed_at.toISOString() ?? new Date().toISOString(),
        schemaVersion: marker?.schema_version ?? BOOTSTRAP_SCHEMA_VERSION,
      };
    } finally {
      await sql`select pg_advisory_unlock(${BOOTSTRAP_ADVISORY_LOCK_KEY})`;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}
