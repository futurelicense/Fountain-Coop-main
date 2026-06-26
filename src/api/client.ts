import {
  isAuthError,
  refreshAuthToken,
  resolveAuthToken,
} from './auth-session';
import { getToken } from './session';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API ${status}`);
    this.name = 'ApiError';
  }
}

async function attachAuth(headers: Headers): Promise<string | null> {
  const token =
    typeof window !== 'undefined' ? await resolveAuthToken() : getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return token;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (
    init?.body &&
    typeof init.body === 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  await attachAuth(headers);

  const doFetch = () =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'same-origin',
    });

  let res = await doFetch();

  if (
    !res.ok &&
    res.status === 401 &&
    typeof window !== 'undefined' &&
    !headers.get('x-auth-retry')
  ) {
    let body: unknown = null;
    try {
      body = await res.clone().json();
    } catch {
      body = null;
    }
    if (isAuthError(401, body)) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        headers.set('Authorization', `Bearer ${refreshed}`);
        headers.set('x-auth-retry', '1');
        res = await doFetch();
      }
    }
  }

  if (!res.ok) {
    let body: unknown;
    const text = await res.text();
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
