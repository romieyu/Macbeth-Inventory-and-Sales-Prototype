import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server-side Supabase client bound to the request's cookies, so the
 * caller's session (and therefore their RLS scope) is respected.
 * Returns null when the project is not configured yet.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component - middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Server-only client that bypasses RLS. Use for ingestion jobs, never for user requests. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createServerClient(url, key, {
    cookies: {
      getAll(): CookieToSet[] {
        return [];
      },
      setAll(_cookiesToSet: CookieToSet[]) {
        // No session to persist - this client never acts on behalf of a user.
      },
    },
  });
}
