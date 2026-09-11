# Database

Migrations are plain SQL, applied in filename order. Nothing here depends on a
local Supabase stack — you can paste a file into the Supabase SQL editor and it
runs.

Applying `0001_init.sql`:

1. Supabase dashboard → SQL Editor → New query.
2. Paste the file, run it.
3. Table Editor should show `organisation`, `region`, `area`, `store`,
   `ingestion_run`, `sales_day`, `sales_day_history`, each with RLS on.

Rule: never edit an applied migration. Corrections are new files.
