import { NextResponse } from 'next/server';
import { pingSupabase } from '@/lib/supabase/ping';

export const dynamic = 'force-dynamic';

/**
 * Liveness + configuration check. Reports whether the app is up and whether
 * Supabase is reachable. Never returns key values - only whether they are set.
 */
export async function GET() {
  const ping = await pingSupabase();

  return NextResponse.json({
    status: 'ok',
    app: 'macbeth-inventory-and-sales-prototype',
    environment: process.env.VERCEL_ENV ?? 'local',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    supabase_url_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_anon_key_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    service_role_key_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    database: ping.state,
    database_http_status: ping.status,
    checked_at: new Date().toISOString(),
  });
}
