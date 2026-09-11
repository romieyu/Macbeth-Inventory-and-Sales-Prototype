# Macbeth Inventory and Sales — Prototype

Prototype for the retail sales monitoring system described in the build
specification. Built in personal accounts first; the production system will be
rebuilt in company-owned GitHub, Supabase and Vercel accounts.

**This is Milestone 1: a deployed skeleton.** Empty application, live URL,
managed database, automated deploys. No features. The pipeline is proven before
anything is built on top of it.

## Stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router) + TypeScript |
| Database | Supabase (managed PostgreSQL) |
| Hosting | Vercel |
| Secrets | Environment variables only — never in the repository |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in from Supabase → Settings → API
npm run dev
```

Open http://localhost:3000 — the page reports what is configured and whether
the database is reachable. `/api/health` returns the same as JSON.

The app builds and runs with no Supabase configured. That is deliberate: the
first deploy has to succeed before the database exists.

## Layout

```
app/                   routes; page.tsx is the status page
app/api/health/        machine-readable status check
lib/supabase/          client (browser, RLS) and server (session + service role)
supabase/migrations/   plain SQL, applied in filename order
docs/RUNBOOK.md        deploy, roll back, restore
```

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + local | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + local | Public; RLS constrains it |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + local | **Server only.** Bypasses RLS. Never `NEXT_PUBLIC_` |

## Not in the prototype

Ingestion, reporting views, roles, targets, the tablet app. Those are
Milestones 2 onward and are scoped in the specification.
