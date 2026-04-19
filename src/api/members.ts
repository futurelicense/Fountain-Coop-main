import { apiFetch } from './client';
import type { MembersListResponse } from './types';

export function fetchMembers(): Promise<MembersListResponse> {
  return apiFetch<MembersListResponse>('/api/members');
}
