import { apiFetch } from './client';
import type {
  MembershipApplicationDetail,
  MembershipApplicationsListResponse,
} from './types';

export function fetchMembershipApplications(): Promise<MembershipApplicationsListResponse> {
  return apiFetch<MembershipApplicationsListResponse>('/api/membership-applications');
}

export function fetchMembershipApplicationDetail(
  id: string
): Promise<MembershipApplicationDetail> {
  return apiFetch<MembershipApplicationDetail>(
    `/api/membership-applications/${encodeURIComponent(id)}`
  );
}
