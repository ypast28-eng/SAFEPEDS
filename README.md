# PED Health AI

Educational health-monitoring SaaS platform for performance athletes. Track bloodwork, understand compound risks, and receive AI-powered educational insights.

> **Not medical advice.** This platform does not diagnose diseases or provide medical treatment recommendations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| AI | OpenAI API (Phase 3+) |

## Project Structure

```
/
├── frontend/          # Next.js 15 application
├── backend/           # FastAPI application (scaffold)
└── supabase/          # SQL migrations & Supabase config
    └── migrations/
```

## Phase 1 — Complete

- [x] Project scaffolding, dark theme, landing page, UI component library
- [x] Placeholder app pages with responsive sidebar

## Phase 2 — Complete

- [x] Supabase Auth (login, signup, forgot password, email verification)
- [x] Protected routes via Next.js middleware
- [x] `profiles` table with RLS and auto-create on signup
- [x] Reusable hooks: `useAuth`, `useUser`, `useProfile`

## Getting Started

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/20250701000000_create_profiles.sql` via the **SQL Editor** or Supabase CLI
3. Under **Authentication → URL Configuration**, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/reset-password`
4. Enable **Email confirmations** under Authentication → Providers → Email (recommended)

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Backend (optional)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Environment Variables

`frontend/.env.local`:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Never commit real keys.** Use `.env.local` locally and CI/CD secrets in production.

## Auth Routes

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password (from email link) |
| `/verify-email` | Post-signup verification instructions |
| `/auth/callback` | Email/OAuth session exchange |

Protected routes (`/dashboard`, `/cycle-builder`, `/bloodwork`, `/knowledge-base`, `/settings`) redirect unauthenticated users to `/login`.

## License

Proprietary — All rights reserved.
