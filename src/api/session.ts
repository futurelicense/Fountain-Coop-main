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
  const { clearAuthSession } = await import('./auth-session');
  await clearAuthSession();
}
