#!/usr/bin/env node
/**
 * Splits supabase/safepeds_app_complete_schema.sql into mobile-friendly SQL files:
 *   supabase/mobile/1_create_tables.sql
 *   supabase/mobile/2_rls_policies.sql
 *   supabase/mobile/3_seed_compounds.sql  (all reference seeds; compounds run first)
 *
 * Run: node scripts/split-safepeds-schema.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourcePath = join(root, "supabase/safepeds_app_complete_schema.sql");
const outDir = join(root, "supabase/mobile");

const source = readFileSync(sourcePath, "utf8");

const MIGRATION_MARKER = /^-- ─── (\d{14}_[\w.]+\.sql) ───$/m;
const RLS_HEADER = /^-- ─── Row Level Security/;
const SEED_MIGRATION = /_seed_/;

function firstSqlLine(sql) {
  for (const line of sql.split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("--")) return t;
  }
  return sql.trimStart();
}

function isRlsStatement(sql) {
  const t = firstSqlLine(sql);
  return (
    (/^alter table\b/i.test(t) && /\benable row level security\b/i.test(t)) ||
    /^create policy\b/i.test(t)
  );
}

function isStorageBucketStatement(sql) {
  return /^insert into storage\.buckets\b/i.test(sql.trimStart());
}

/** Split SQL text into statements, respecting $tag$ ... $tag$ blocks. */
function splitStatements(text) {
  const statements = [];
  let buf = [];
  let inDollar = false;
  let dollarTag = null;
  const dollarRe = new RegExp("\\$([a-zA-Z_]*)\\$", "g");

  for (const line of text.split("\n")) {
    let match;
    dollarRe.lastIndex = 0;
    while ((match = dollarRe.exec(line)) !== null) {
      const tag = match[1];
      if (!inDollar) {
        inDollar = true;
        dollarTag = tag;
      } else if (tag === dollarTag) {
        inDollar = false;
        dollarTag = null;
      }
    }

    buf.push(line);

    if (!inDollar && line.trimEnd().endsWith(";")) {
      const sql = buf.join("\n").trim();
      if (sql) statements.push(sql);
      buf = [];
    }
  }

  const tail = buf.join("\n").trim();
  if (tail) statements.push(tail);
  return statements;
}

function splitMigrationBlock(blockText, migrationName) {
  if (SEED_MIGRATION.test(migrationName)) {
    return { ddl: "", rls: "", seed: blockText.trim() };
  }

  const statements = splitStatements(blockText);
  const ddl = [];
  const rls = [];

  for (const stmt of statements) {
    if (isRlsStatement(stmt)) {
      rls.push(stmt);
    } else {
      ddl.push(stmt);
    }
  }

  return {
    ddl: ddl.join("\n\n"),
    rls: rls.join("\n\n"),
    seed: "",
  };
}

// Parse migration blocks
const blocks = [];
const parts = source.split(MIGRATION_MARKER);
// parts[0] is header before first migration
for (let i = 1; i < parts.length; i += 2) {
  const name = parts[i];
  const body = parts[i + 1] ?? "";
  blocks.push({ name, body: `-- ─── ${name} ───${body}` });
}

const ddlParts = [];
const rlsParts = [];
const seedParts = [];

for (const block of blocks) {
  const { ddl, rls, seed } = splitMigrationBlock(block.body, block.name);
  if (ddl.trim()) ddlParts.push(ddl.trim());
  if (rls.trim()) rlsParts.push(rls.trim());
  if (seed.trim()) seedParts.push(seed.trim());
}

const header = (title, step, note) => `-- =============================================================================
-- SAFEPEDS / PED Health AI — ${title}
-- Step ${step} of 3 for Supabase SQL Editor (mobile-friendly)
-- ${note}
-- Generated from safepeds_app_complete_schema.sql — do not edit by hand.
-- Regenerate: node scripts/split-safepeds-schema.mjs
-- =============================================================================

`;

mkdirSync(outDir, { recursive: true });

const file1 = [header("Create tables, types, functions, triggers", "1", "Run first on an empty Supabase project."), ...ddlParts].join(
  "\n\n"
);
const file2 = [header("Row Level Security policies", "2", "Run after 1_create_tables.sql."), ...rlsParts].join("\n\n");
const file3 = [
  header(
    "Seed reference data (compounds + supporting catalogs)",
    "3",
    "Run after 2_rls_policies.sql. Compound library is seeded first."
  ),
  ...seedParts,
].join("\n\n");

writeFileSync(join(outDir, "1_create_tables.sql"), file1 + "\n");
writeFileSync(join(outDir, "2_rls_policies.sql"), file2 + "\n");
writeFileSync(join(outDir, "3_seed_compounds.sql"), file3 + "\n");

const count = (sql, re) => (sql.match(re) || []).length;
console.log(`Wrote ${outDir}/`);
console.log(`  1_create_tables.sql  (${count(file1, /^create table/gim)} tables, ${file1.split("\n").length} lines)`);
console.log(`  2_rls_policies.sql   (${count(file2, /^create policy/gim)} policies, ${file2.split("\n").length} lines)`);
console.log(`  3_seed_compounds.sql (${count(file3, /^INSERT INTO/gim)} INSERT blocks, ${file3.split("\n").length} lines)`);
