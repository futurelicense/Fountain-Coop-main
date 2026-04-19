import { apiFetch } from './client';
import type { LoginResponse } from './types';

export async function loginRequest(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}
