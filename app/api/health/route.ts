import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Liveness + configuration check. Reports whether the app is up and whether
 * Supabase is reachable. Never returns key values - only whether they are set.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let database: 'not_configured' | 'reachable' | 'unreachable' = 'not_configured';

  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anon },
        cache: 'no-store',
      });
      database = res.ok ? 'reachable' : 'unreachable';
    } catch {
      database = 'unreachable';
    }
  }

  return NextResponse.json({
    status: 'ok',
    app: 'macbeth-inventory-and-sales-prototype',
    environment: process.env.VERCEL_ENV ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    supabase_url_set: Boolean(url),
    supabase_anon_key_set: Boolean(anon),
    service_role_key_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    database,
    checked_at: new Date().toISOString(),
  });
}
