# First-time setup

How this project gets stood up from nothing. Written for the prototype, but the
same sequence runs again when the production system is created in the company's
own accounts — at which point every account below is created **in the company's
name, billed to the company** (Spec §2).

## 1. GitHub

1. New repository, private, **no** README / .gitignore / licence — an empty repo.
   (Vercel refuses to import a repo with no files, so the first push comes from
   the working copy, not from GitHub's own initialiser.)
2. From the project folder:

   ```bash
   npm install
   npm run build                 # never push a build you have not run
   git remote add origin <repo url>
   git push -u origin main
   ```

## 2. Supabase

1. supabase.com/dashboard → **New project**.
2. Name it, generate a strong database password, **store it in the password
   manager immediately** — it is shown once.
3. Region: **Southeast Asia (Singapore)**. Nearest to Manila; every millisecond
   here is paid by 200 stores on every request.
4. Wait for provisioning, then **SQL Editor → New query** → paste
   `supabase/migrations/0001_init.sql` → Run.
5. **Table Editor** should now show `organisation`, `region`, `area`, `store`,
   `ingestion_run`, `sales_day`, `sales_day_history`, each marked RLS enabled.
6. **Settings → API** — copy three values:

   | Supabase label | Environment variable |
   |---|---|
   | Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
   | `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` |

   The service role key bypasses row-level security. It never goes in the
   browser, never gets a `NEXT_PUBLIC_` prefix, never enters the repository.

7. **Database → Backups.** Point-in-time recovery is a paid plan feature. For
   the prototype it can wait. For production it is not optional — Spec §7
   requires automated daily backups, PITR, and a restore actually tested into a
   scratch environment before go-live.

Note: free-tier projects pause after a period of inactivity, which makes the
health check report the database unreachable. That is the plan, not a fault.

## 3. Vercel

1. **Add New → Project → Import** the GitHub repository.
2. Framework is detected as Next.js; leave build and output settings alone.
3. **Environment Variables** — add all three from step 2.6, ticked for
   Production, Preview and Development.
4. Deploy.
5. Open the deployment URL, then `/api/health`. Expect:

   ```json
   { "status": "ok", "database": "reachable" }
   ```

If the variables were added after the first deploy, redeploy — Vercel bakes
them in at build time.

## 4. Close the loop

- Record every account, owner and credential in the password manager, and fill
  in the table at the bottom of `docs/RUNBOOK.md`.
- Have someone other than the builder deploy a trivial change, promote it, and
  roll it back using the runbook alone. That is the Milestone 1 gate, and it is
  the only evidence that the system does not depend on one person.
