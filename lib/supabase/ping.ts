export type DbState = 'not_configured' | 'reachable' | 'unreachable';

export type PingResult = {
  state: DbState;
  /** HTTP status, or null when the request never completed. Diagnostic only. */
  status: number | null;
};

/**
 * Checks that the Supabase REST endpoint answers.
 *
 * PostgREST behind Supabase wants BOTH headers: `apikey` identifies the project,
 * `Authorization` carries the caller's role. Sending only `apikey` gets a 401,
 * which looks like an outage but is just a malformed request.
 */
export async function pingSupabase(): Promise<PingResult> {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw || !key) return { state: 'not_configured', status: null };

  // Tolerate a trailing slash pasted in from the dashboard.
  const url = raw.replace(/\/+$/, '');

  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });
    return { state: res.ok ? 'reachable' : 'unreachable', status: res.status };
  } catch {
    return { state: 'unreachable', status: null };
  }
}
