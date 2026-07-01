# Supabase

## Apply migrations

### Option A — SQL Editor

1. Open your Supabase project → **SQL Editor**
2. Paste and run `migrations/20250701000000_create_profiles.sql`

### Option B — Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Profiles table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | FK to `auth.users` |
| `email` | text | User email |
| `age` | integer | Age (13–120) |
| `sex` | text | `male`, `female`, `other`, `prefer_not_to_say` |
| `height` | numeric | Centimeters |
| `weight` | numeric | Kilograms |
| `body_fat` | numeric | Body fat % |
| `training_experience` | text | `beginner`, `intermediate`, `advanced`, `elite` |

A trigger automatically creates a profile row when a user signs up.

## Auth redirect URLs

Configure in **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (or your production domain)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/reset-password`
