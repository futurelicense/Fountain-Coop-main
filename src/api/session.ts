const KEY = 'fountain_coop_token';

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(KEY);
}

/** Clears demo token and signs out Supabase browser session if configured. */
export async function signOutSession(): Promise<void> {
  clearToken();
  if (typeof window === 'undefined') return;
  const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
}
