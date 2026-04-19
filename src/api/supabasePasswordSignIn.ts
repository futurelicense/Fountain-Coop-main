import { ApiError } from './client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export type SupabasePasswordSignInResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number | undefined;
  user: { id: string; email?: string | null };
};

export async function supabasePasswordSignIn(
  email: string,
  password: string
): Promise<SupabasePasswordSignInResponse> {
  const res = await fetch(`${baseUrl}/api/auth/sign-in-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'same-origin',
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as SupabasePasswordSignInResponse;
}
