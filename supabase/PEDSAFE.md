# PEDSAFE — Supabase migrations

Greenfield schema for PEDSAFE (`profiles`, `compounds`, `cycles`, `bloodwork`, `lab_results`, `notes`).

> **Not the same tables as SAFEPEDS Phases 2–8** (`user_cycles`, `bloodwork_reports`, …).  
> On a **new empty project**, deploy **either** SAFEPEDS migrations `1–13` **or** PEDSAFE migrations below — not both.

## Migration files (run in order)

| # | File |
|---|------|
| 1 | `migrations/20250708100000_pedsafe_foundation.sql` |
| 2 | `migrations/20250708100001_pedsafe_profiles.sql` |
| 3 | `migrations/20250708100002_pedsafe_compounds.sql` |
| 4 | `migrations/20250708100003_pedsafe_cycles.sql` |
| 5 | `migrations/20250708100004_pedsafe_bloodwork.sql` |
| 6 | `migrations/20250708100005_pedsafe_notes.sql` |
| 7 | `migrations/20250708100006_pedsafe_seed_compounds.sql` |

Reference copy (all SQL concatenated): `pedsafe_complete_schema.sql`

---

## Deploy from Supabase Dashboard + GitHub (no CLI, no copy/paste)

### One-time setup

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.

2. **Project Settings** (gear icon) → **Integrations** → **GitHub**.

3. Click **Authorize GitHub** and install the Supabase GitHub App on your account.

4. Select repository **`ypast28-eng/SAFEPEDS`** (or your fork).

5. Configure the integration:
   - **Relative path to Supabase folder:** `supabase`
   - **Production branch:** `main` (or the branch that contains these migrations)

6. Save / enable the integration.

### Deploy migrations

1. In the left sidebar: **Database** → **Migrations**.

2. After GitHub syncs, pending migrations from `supabase/migrations/` appear in the list.

3. For a **PEDSAFE-only greenfield database**, deploy only the seven files listed above (`20250708100000` through `20250708100006`).  
   - Use **Deploy** on each pending PEDSAFE migration in order, **or**  
   - **Deploy all** if this is a fresh project with no prior migrations.

4. Wait until each migration shows **Applied** / success.

5. Verify in **Table Editor**: `profiles`, `compounds`, `cycles`, `cycle_compounds`, `bloodwork`, `lab_results`, `notes`.

### Re-sync after a git push

1. Push migration changes to the connected branch on GitHub (`main`).

2. Supabase Dashboard → **Database** → **Migrations**.

3. Click **Refresh** or **Pull from GitHub** (wording may vary) if new migrations do not appear automatically.

4. Deploy any new pending migrations from the dashboard.

### Grant admin (optional)

After your first user signs up:

```sql
update public.profiles set is_admin = true where email = 'your-admin@email.com';
```

Run that once in **SQL Editor** (admin setup only).

---

## What the Dashboard does *not* do

- There is **no** “upload a `.sql` file” importer in the Dashboard.
- **GitHub integration** or **CLI** (`supabase db push`) applies files from `supabase/migrations/` automatically.
- Without GitHub or CLI, the only option is **SQL Editor** copy/paste (manual).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Migrations tab empty | Confirm GitHub integration is enabled and `supabase/migrations/` exists on `main` |
| `profiles` already exists | SAFEPEDS migration `20250701000000` may already be applied — use SAFEPEDS schema or a new project |
| `compounds` conflict | Same — do not mix PEDSAFE + SAFEPEDS compound tables on one DB |
| Deploy button disabled | Check project permissions; ensure you are project Owner |
