export type DbState = 'not_configured' | 'reachable' | 'unreachable';

export type PingResult = {
  state: DbState;
  /** HTTP status, or null when the request never completed. Diagnostic only. */
  status: number | null;
};

/**
 * Liveness check against the Supabase project.
 *
 * Uses the Auth service's health endpoint, which the publishable key is
 * allowed to call. Do NOT point this at `/rest/v1/` — that root endpoint
 * serves the API schema and accepts secret keys only, so a perfectly good
 * publishable key gets a 401 there and the project looks down when it isn't.
 *
 * Table reads are a poor liveness probe too: RLS and grants mean an
 * unauthenticated caller is *supposed* to be refused, so a refusal would
 * prove nothing either way.
 */
export async function pingSupabase(): Promise<PingResult> {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw || !key) return { state: 'not_configured', status: null };

  // Tolerate a trailing slash pasted in from the dashboard.
  const url = raw.replace(/\/+$/, '');

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: 'no-store',
    });
    return { state: res.ok ? 'reachable' : 'unreachable', status: res.status };
  } catch {
    return { state: 'unreachable', status: null };
  }
}
