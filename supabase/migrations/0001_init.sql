-- 0001_init.sql — Macbeth Sales prototype, first migration.
--
-- Spec §2: multi-tenant from the FIRST migration. organisation_id on every
-- table, row-level security enforced at the database. Retrofitting tenancy is
-- a rewrite, so it goes in before there is any data to migrate.
--
-- Spec §4.1: money is integer centavos (PHP). Never floating point.
-- Spec §7: Asia/Manila is the business timezone; timestamps are stored UTC.

-- ---------------------------------------------------------------- tenancy ---

create table organisation (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- The tenant of the current request, read from the JWT. Users are stamped with
-- organisation_id in app_metadata at sign-up; app_metadata is not user-writable.
create or replace function current_organisation_id()
returns uuid
language sql
stable
as $$
  select nullif(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'organisation_id',
    ''
  )::uuid;
$$;

-- ------------------------------------------------------------- org chart ---

create table region (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation(id) on delete cascade,
  name             text not null,
  unique (organisation_id, name)
);

create table area (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation(id) on delete cascade,
  region_id        uuid not null references region(id) on delete restrict,
  name             text not null,
  unique (organisation_id, name)
);

create table store (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation(id) on delete cascade,
  area_id          uuid not null references area(id) on delete restrict,
  store_code       text not null,          -- the chain's code, not the POS vendor's id
  name             text not null,
  source           text not null default 'pos_partner'
                     check (source in ('pos_partner', 'tablet_app', 'manual')),
  opened_on        date,
  closed_on        date,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (organisation_id, store_code)
);

-- --------------------------------------------------------------- sales ---

-- Provenance: every number traces back to the run that produced it (Spec §4.1).
create table ingestion_run (
  id               uuid primary key default gen_random_uuid(),
  organisation_id  uuid not null references organisation(id) on delete cascade,
  source           text not null check (source in ('pos_partner', 'tablet_app', 'manual')),
  status           text not null default 'running'
                     check (status in ('running', 'succeeded', 'failed', 'duplicate')),
  file_name        text,
  file_hash        text,                   -- idempotency: same file, same hash
  rows_loaded      integer not null default 0,
  rows_quarantined integer not null default 0,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz
);

-- The central record. Spec §3.2: unique on (store, business_date).
create table sales_day (
  id                 uuid primary key default gen_random_uuid(),
  organisation_id    uuid not null references organisation(id) on delete cascade,
  store_id           uuid not null references store(id) on delete restrict,
  business_date      date not null,        -- trading date, not upload date
  source             text not null check (source in ('pos_partner', 'tablet_app', 'manual')),
  version            integer not null default 1,

  gross_sales        bigint not null default 0,
  discount_regular   bigint not null default 0,
  discount_sc        bigint not null default 0,   -- statutory, VAT-exempt, kept separate
  discount_pwd       bigint not null default 0,   -- statutory, VAT-exempt, kept separate
  vatable_sales      bigint not null default 0,
  vat_exempt_sales   bigint not null default 0,
  vat_amount         bigint not null default 0,
  net_sales          bigint not null default 0,
  transaction_count  integer not null default 0,
  void_count         integer not null default 0,
  void_amount        bigint not null default 0,

  is_manually_adjusted boolean not null default false,
  adjustment_reason    text,
  ingestion_run_id     uuid references ingestion_run(id) on delete set null,
  submitted_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (store_id, business_date),
  -- Spec §4.3: the arithmetic must balance or the record is quarantined, not stored.
  constraint sales_day_balances
    check (gross_sales - (discount_regular + discount_sc + discount_pwd) = net_sales)
);

-- Spec §3.2: restatements never overwrite. A correction writes the old row here first.
create table sales_day_history (
  id              uuid primary key default gen_random_uuid(),
  sales_day_id    uuid not null references sales_day(id) on delete cascade,
  organisation_id uuid not null references organisation(id) on delete cascade,
  version         integer not null,
  snapshot        jsonb not null,          -- the row as it stood before the change
  changed_by      uuid,                    -- auth.users(id)
  change_reason   text,
  changed_at      timestamptz not null default now(),
  unique (sales_day_id, version)
);

-- Spec §7: any dashboard view under 2s at full volume. This is the index that does it.
create index sales_day_store_date_idx on sales_day (store_id, business_date desc);
create index sales_day_org_date_idx   on sales_day (organisation_id, business_date desc);
create index store_org_active_idx     on store (organisation_id) where is_active;

-- ------------------------------------------------------- row-level security ---
-- Deny by default. A table with RLS enabled and no policy returns nothing.

alter table organisation      enable row level security;
alter table region            enable row level security;
alter table area              enable row level security;
alter table store             enable row level security;
alter table ingestion_run     enable row level security;
alter table sales_day         enable row level security;
alter table sales_day_history enable row level security;

create policy tenant_read on organisation
  for select using (id = current_organisation_id());

create policy tenant_read on region
  for select using (organisation_id = current_organisation_id());

create policy tenant_read on area
  for select using (organisation_id = current_organisation_id());

create policy tenant_read on store
  for select using (organisation_id = current_organisation_id());

create policy tenant_read on ingestion_run
  for select using (organisation_id = current_organisation_id());

create policy tenant_read on sales_day
  for select using (organisation_id = current_organisation_id());

create policy tenant_read on sales_day_history
  for select using (organisation_id = current_organisation_id());

-- Writes are deliberately absent. Phase 1 is a read-only reporting layer
-- (Spec §1.1); ingestion runs server-side under the service role, which
-- bypasses RLS. Per-role write policies arrive with Spec §5, not before.

-- Scope-within-tenant (Area Manager sees their area only, Spec §5) is a second
-- layer that lands in the milestone that introduces roles. Tenancy first.
