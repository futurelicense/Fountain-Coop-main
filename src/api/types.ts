export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'group_admin'
  | 'member';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  memberId: string | null;
}

/** Financial / KYC fields returned with `/api/me` when using Supabase. */
export interface MeProfile {
  savings_balance: number;
  loan_balance: number;
  branch: string | null;
  full_name: string | null;
  phone: string | null;
  member_code: string | null;
  status: string | null;
  products: string[];
  /** ISO timestamp from Supabase `profiles.created_at`. */
  member_since?: string | null;
}

export interface MeResponse {
  user: AuthUser;
  profile?: MeProfile | null;
}

export interface OperationalItem {
  id: string;
  module: string;
  subtype: string;
  is_catalog: boolean;
  owner_id: string | null;
  data: Record<string, unknown>;
  branch: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MemberRow {
  id: string;
  name: string;
  phone: string;
  branch: string;
  status: string;
  products: string[];
  savingsBalance: number;
  loanBalance: number;
}

export interface MembersSummary {
  total: number;
  active: number;
  owing: number;
  inactive: number;
}

export interface MembersListResponse {
  members: MemberRow[];
  /** Total members in the cooperative (platform). */
  total: number;
  /** Members returned in this response (page / scope). */
  pageTotal: number;
  summary: MembersSummary;
}

export interface DashboardKpis {
  totalMembers: {
    value: number;
    trend: string;
    isPositive: boolean;
  };
  totalSavings: {
    value: number;
    trend: string;
    isPositive: boolean;
  };
  loanBook: { value: number; subtitle: string };
  portfolioAtRisk: {
    value: number;
    trend: string;
    isPositive: boolean;
    subtitle: string;
  };
  recoveryThisMonth: { value: number; subtitle: string };
  newMembers: {
    value: number;
    trend: string;
    isPositive: boolean;
    subtitle: string;
  };
}

export interface MemberGrowthPoint {
  month: string;
  total: number;
  new: number;
}

export interface LoanPortfolioPoint {
  month: string;
  disbursed: number;
  repaid: number;
}

export interface DashboardProductsSummary {
  thrift: { activePlans: number; collected: number };
  ajo: { activeCycles: number; participants: number };
  packs: { activePacks: number; slotsFilled: number };
  investments: {
    activeProducts: number;
    totalInvested: number;
    activeInvestors: number;
  };
}

export interface DashboardBranchRow {
  name: string;
  members: number;
  collections: number;
  recoveryRate: number;
}

export interface DashboardActivityItem {
  id: string | number;
  type: string;
  user: string;
  action: string;
  time: string;
}

export interface DashboardComplianceItem {
  id: string | number;
  title: string;
  description: string;
  severity: string;
  time: string;
}

export interface DashboardResponse {
  kpis: DashboardKpis;
  memberGrowth: MemberGrowthPoint[];
  loanPortfolio: LoanPortfolioPoint[];
  welcome: {
    greetingName: string;
    dateLabel: string;
  };
  /** Present when loaded from Supabase (or legacy dashboard route). */
  productsSummary?: DashboardProductsSummary;
  branchPerformance?: DashboardBranchRow[];
  recentActivities?: DashboardActivityItem[];
  complianceAlerts?: DashboardComplianceItem[];
}
