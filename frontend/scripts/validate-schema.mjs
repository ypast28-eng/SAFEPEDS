/**
 * Validate safepeds_app_complete_schema.sql against PGlite (PostgreSQL WASM).
 * Mocks Supabase auth + storage schemas required by the script.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const sqlPath = join(process.cwd(), "..", "supabase", "safepeds_app_complete_schema.sql");

const MOCK_PREFIX = `
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text
);
`;

async function main() {
  const db = new PGlite();
  const fullSql = MOCK_PREFIX + readFileSync(sqlPath, "utf8");

  // Split on semicolons outside dollar-quoted blocks and strings (simple state machine)
  const statements = [];
  let buf = "";
  let inSingle = false;
  let dollarTag = null;
  let i = 0;
  const s = fullSql;

  while (i < s.length) {
    if (dollarTag) {
      const end = s.indexOf(dollarTag, i);
      if (end === -1) {
        buf += s.slice(i);
        break;
      }
      buf += s.slice(i, end + dollarTag.length);
      i = end + dollarTag.length;
      dollarTag = null;
      continue;
    }
    if (inSingle) {
      if (s[i] === "'") {
        buf += "'";
        if (s[i + 1] === "'") {
          buf += "'";
          i += 2;
          continue;
        }
        inSingle = false;
        i++;
        continue;
      }
      buf += s[i++];
      continue;
    }
    if (s[i] === "-" && s[i + 1] === "-") {
      const nl = s.indexOf("\n", i);
      buf += nl === -1 ? s.slice(i) : s.slice(i, nl + 1);
      i = nl === -1 ? s.length : nl + 1;
      continue;
    }
    if (s[i] === "$") {
      const m = s.slice(i).match(/^\$[a-zA-Z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
        buf += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (s[i] === "'") {
      inSingle = true;
      buf += "'";
      i++;
      continue;
    }
    if (s[i] === ";") {
      const stmt = buf.trim();
      if (stmt) statements.push(stmt);
      buf = "";
      i++;
      continue;
    }
    buf += s[i++];
  }
  const tail = buf.trim();
  if (tail) statements.push(tail);

  console.log(`Executing ${statements.length} statements...`);
  let n = 0;
  for (const stmt of statements) {
    n++;
    if (/create\s+extension/i.test(stmt)) {
      continue;
    }
    try {
      await db.exec(stmt);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const preview = stmt.slice(0, 120).replace(/\s+/g, " ");
      console.error(`\nFAILED at statement #${n}:\n${message}\nPreview: ${preview}...`);
      process.exit(1);
    }
  }
  console.log("All statements executed successfully.");
  await db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
