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
│   ├── app/           # App Router pages & layouts
│   ├── components/    # UI, layout, marketing components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Constants, config
│   ├── services/      # API & auth service placeholders
│   ├── styles/        # Design tokens
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Utility functions
└── backend/           # FastAPI application (scaffold)
```

## Phase 1 — Complete

- [x] Project scaffolding & folder structure
- [x] Dark theme with premium bodybuilding + healthcare aesthetic
- [x] Landing page (Hero, Features, Pricing, FAQ, Footer)
- [x] Responsive navigation bar
- [x] Placeholder app pages (Dashboard, Cycle Builder, Bloodwork, Knowledge Base, Settings)
- [x] Responsive sidebar for authenticated users
- [x] Reusable UI components (Button, Card, Input, Table, Modal, Badge, Charts)

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (placeholder)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000).

## Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` when ready:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## License

Proprietary — All rights reserved.
