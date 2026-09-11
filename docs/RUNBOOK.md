# Runbook

Written for someone who did not build this. If a step here is not enough to act
on, that is a defect in this file — fix the file.

## Deploy a change

1. Commit to a branch, push, open a pull request.
2. Vercel builds a preview and comments the URL on the pull request.
3. Check the preview URL, including `/api/health`.
4. Merge to `main`. Vercel deploys production automatically.

Nothing is ever deployed from a laptop.

## Roll back production

Vercel → the project → **Deployments** → find the last known-good deployment →
`…` → **Promote to Production**. Takes effect in seconds; no rebuild.

Then fix forward in the repository. A rollback is a pause, not a resolution —
production and `main` are out of step until you do.

## Check the system is healthy

Open `/api/health` on the production URL. Expected:

```json
{ "status": "ok", "database": "reachable" }
```

- `"database": "not_configured"` → environment variables missing in Vercel.
- `"database": "unreachable"` → Supabase project paused, keys rotated, or an outage.
  Check the Supabase dashboard first.

## Apply a database migration

1. Supabase dashboard → SQL Editor → New query.
2. Paste the new file from `supabase/migrations/`, run it.
3. Confirm in the Table Editor.

Never edit a migration that has already been applied. Corrections are new files.

## Restore the database

Supabase → Database → Backups → point-in-time recovery. Pick a timestamp,
restore **into a new project first**, confirm the data, and only then decide
about production.

An untested restore is not a backup. Test one before go-live and write the date
here: _______________

## Rotate keys

Supabase → Settings → API → rotate. Update the values in Vercel (all
environments), then redeploy. `/api/health` confirms the app picked them up.

## Credentials

Every account lives in a shared password manager, not in anyone's head or
browser. Accounts for the production system are in the company's name, billed to
the company.

| Service | Account holder | Where the credentials live |
|---|---|---|
| GitHub | | |
| Supabase | | |
| Vercel | | |
