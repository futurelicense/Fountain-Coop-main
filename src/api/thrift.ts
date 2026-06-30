import { apiFetch } from './client';

export type MemberThriftCollector = {
  name: string;
  route: string;
  branch: string;
  phone: string;
  collectorCode: string;
  memberCode: string;
  assigned: boolean;
  initials: string;
};

export async function fetchMemberThriftCollector(): Promise<MemberThriftCollector> {
  return apiFetch<MemberThriftCollector>('/api/member/thrift/collector');
}
