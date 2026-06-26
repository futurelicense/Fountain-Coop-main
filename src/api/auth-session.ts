import { clearToken, getToken, setToken } from './session';

export type SupabaseSessionTokens = {
  access_token: string;
  refresh_token: string;
};

/** Persist Supabase session in browser storage + sessionStorage token for API calls. */
export async function persistSupabaseSession(
  session: SupabaseSessionTokens
): Promise<void> {
  setToken(session.access_token);
  if (typeof window === 'undefined') return;
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const client = getSupabaseBrowserClient();
  if (!client) return;
  await client.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}

/**
 * Returns a valid access token for API requests.
 * Refreshes via Supabase when the stored JWT is expired or missing.
 */
export async function resolveAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return getToken();

  const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const client = getSupabaseBrowserClient();

  if (client) {
    const { data: sessionData } = await client.auth.getSession();
    const session = sessionData.session;
    if (session?.access_token) {
      setToken(session.access_token);
      return session.access_token;
    }

    const { data: refreshed, error } = await client.auth.refreshSession();
    if (!error && refreshed.session?.access_token) {
      setToken(refreshed.session.access_token);
      return refreshed.session.access_token;
    }
  }

  return getToken();
}

/** Force refresh; returns new token or null. */
export async function refreshAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client.auth.refreshSession();
  if (error || !data.session?.access_token) return null;
  setToken(data.session.access_token);
  return data.session.access_token;
}

export function isAuthError(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  const err = (body as { error?: string } | null)?.error;
  return (
    err === 'missing_token' ||
    err === 'invalid_credentials' ||
    err === 'invalid JWT' ||
    err === 'jwt expired' ||
    !err
  );
}

export async function clearAuthSession(): Promise<void> {
  clearToken();
  if (typeof window === 'undefined') return;
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
}
