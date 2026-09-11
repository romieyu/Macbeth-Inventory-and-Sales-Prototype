import { pingSupabase, type DbState } from '@/lib/supabase/ping';

export const dynamic = 'force-dynamic';

type State = 'ok' | 'warn' | 'bad';

function Row({ label, value, state }: { label: string; value: string; state: State }) {
  return (
    <div className="row">
      <span>{label}</span>
      <span className={`pill ${state}`}>{value}</span>
    </div>
  );
}

const DB_LABEL: Record<DbState, string> = {
  reachable: 'reachable',
  not_configured: 'not configured',
  unreachable: 'unreachable',
};

const DB_STATE: Record<DbState, State> = {
  reachable: 'ok',
  not_configured: 'warn',
  unreachable: 'bad',
};

export default async function Home() {
  const urlSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonSet = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceSet = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const ping = await pingSupabase();

  const env = process.env.VERCEL_ENV ?? 'local';
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

  const dbValue =
    ping.state === 'unreachable' && ping.status
      ? `unreachable (HTTP ${ping.status})`
      : DB_LABEL[ping.state];

  return (
    <main>
      <h1>Macbeth Sales — Prototype</h1>
      <p>
        Milestone 1: deployed skeleton. No features yet, by design — the
        pipeline gets proven before anything is built on it.
      </p>

      <h2>Deployment</h2>
      <div className="card">
        <Row label="Application" value="running" state="ok" />
        <Row label="Environment" value={env} state="ok" />
        <Row label="Commit" value={commit ?? 'local build'} state="ok" />
      </div>

      <h2>Supabase</h2>
      <div className="card">
        <Row
          label="NEXT_PUBLIC_SUPABASE_URL"
          value={urlSet ? 'set' : 'missing'}
          state={urlSet ? 'ok' : 'warn'}
        />
        <Row
          label="NEXT_PUBLIC_SUPABASE_ANON_KEY"
          value={anonSet ? 'set' : 'missing'}
          state={anonSet ? 'ok' : 'warn'}
        />
        <Row
          label="SUPABASE_SERVICE_ROLE_KEY"
          value={serviceSet ? 'set' : 'not needed yet'}
          state={serviceSet ? 'ok' : 'warn'}
        />
        <Row label="Database" value={dbValue} state={DB_STATE[ping.state]} />
      </div>

      <h2>Gate for this milestone</h2>
      <ol>
        <li>Repository holds the app; Vercel imports it without error.</li>
        <li>Production and preview both deploy from the repository, not a laptop.</li>
        <li>Supabase project exists with automated backups on.</li>
        <li>
          Someone other than the builder deploys a trivial change, promotes it,
          and rolls it back using <code>docs/RUNBOOK.md</code> alone.
        </li>
      </ol>

      <h2>Checks</h2>
      <p>
        Machine-readable status at <code>/api/health</code>.
      </p>
    </main>
  );
}
