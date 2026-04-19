import { apiFetch } from './client';
import type { DashboardResponse } from './types';

export function fetchDashboard(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/api/dashboard');
}
