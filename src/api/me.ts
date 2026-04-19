import { apiFetch } from './client';
import type { MeResponse } from './types';

export function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/me');
}
