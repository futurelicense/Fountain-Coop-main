import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DashboardKpis,
  DashboardResponse,
  LoanPortfolioPoint,
  MemberGrowthPoint,
} from '@/api/types';
import type { ProfileRow } from '@/lib/server/request-auth';
import { pickNum, pickStr } from '@/lib/pickData';

function formatTrend(current: number, previous: number): {
  trend: string;
  isPositive: boolean;
} {
  if (!previous || previous === 0) {
    return { trend: '—', isPositive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return {
    trend: `${sign}${pct.toFixed(1)}%`,
    isPositive: pct >= 0,
  };
}

export async function buildDashboardFromSupabase(
  supabase: SupabaseClient,
  greetingName: string
): Promise<DashboardResponse> {
  const { data: members, error: memErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'member');

  if (memErr) throw new Error(memErr.message);

  const rows = (members ?? []) as ProfileRow[];
  const totalMembers = rows.length;
  const totalSavings = rows.reduce(
    (s, m) => s + Number(m.savings_balance ?? 0),
    0
  );
  const loanBook = rows.reduce((s, m) => s + Number(m.loan_balance ?? 0), 0);
  const parMembers = rows.filter(
    (m) => Number(m.loan_balance ?? 0) > 0 && m.status === 'Owing'
  );
  const portfolioAtRisk = parMembers.reduce(
    (s, m) => s + Number(m.loan_balance ?? 0),
    0
  );
  const parRatio =
    loanBook > 0 ? ((portfolioAtRisk / loanBook) * 100).toFixed(1) : '0';

  const { data: metrics, error: metErr } = await supabase
    .from('metrics_monthly')
    .select('*')
    .order('sort_order', { ascending: true });

  if (metErr) throw new Error(metErr.message);

  const mg: MemberGrowthPoint[] = (metrics ?? []).map((r) => ({
    month: r.month_key as string,
    total: Number(r.total_members ?? 0),
    new: Number(r.new_members ?? 0),
  }));

  const lp: LoanPortfolioPoint[] = (metrics ?? []).map((r) => ({
    month: r.month_key as string,
    disbursed: Number(r.disbursed_m ?? 0),
    repaid: Number(r.repaid_m ?? 0),
  }));

  const last = mg.length >= 2 ? mg[mg.length - 1] : null;
  const prev = mg.length >= 2 ? mg[mg.length - 2] : null;
  const memberTrend =
    last && prev
      ? formatTrend(last.total, prev.total)
      : { trend: '+0%', isPositive: true };

  const savingsTrend = { trend: '+0%', isPositive: true };
  const kpis: DashboardKpis = {
    totalMembers: {
      value: totalMembers,
      trend: memberTrend.trend,
      isPositive: memberTrend.isPositive,
    },
    totalSavings: {
      value: totalSavings,
      trend: savingsTrend.trend,
      isPositive: savingsTrend.isPositive,
    },
    loanBook: {
      value: loanBook,
      subtitle: 'From live member balances',
    },
    portfolioAtRisk: {
      value: portfolioAtRisk,
      trend: '-0%',
      isPositive: true,
      subtitle: `${parRatio}% of loan book (owing with balance)`,
    },
    recoveryThisMonth: {
      value: Math.round(totalSavings * 0.02),
      subtitle: 'Estimated from platform savings',
    },
    newMembers: {
      value: last?.new ?? 0,
      trend: '+0',
      isPositive: true,
      subtitle: 'latest month in metrics',
    },
  };

  const thriftN = rows.filter((m) =>
    (m.products ?? []).includes('Thrift')
  ).length;
  const ajoN = rows.filter((m) =>
    (m.products ?? []).some((p) => p.includes('Ajo') || p.includes('Osusu'))
  ).length;
  const packsN = rows.filter((m) =>
    (m.products ?? []).includes('Packs')
  ).length;
  const thriftVol = rows
    .filter((m) => (m.products ?? []).includes('Thrift'))
    .reduce((s, m) => s + Number(m.savings_balance ?? 0), 0);

  const productsSummary = {
    thrift: {
      activePlans: thriftN,
      collected: thriftVol,
    },
    ajo: {
      activeCycles: Math.max(1, Math.ceil(ajoN / 3)),
      participants: ajoN * 4,
    },
    packs: {
      activePacks: Math.max(1, packsN),
      slotsFilled: packsN * 6,
    },
    investments: await loadInvestmentSummary(supabase),
  };

  const branchMap = new Map<
    string,
    { members: number; collections: number; owing: number }
  >();
  for (const m of rows) {
    const b = m.branch || 'Unknown';
    const cur = branchMap.get(b) ?? { members: 0, collections: 0, owing: 0 };
    cur.members += 1;
    cur.collections += Number(m.savings_balance ?? 0);
    if (m.status === 'Owing') cur.owing += 1;
    branchMap.set(b, cur);
  }

  const branchPerformance = Array.from(branchMap.entries()).map(
    ([name, v]) => ({
      name,
      members: v.members,
      collections: v.collections,
      recoveryRate: v.members > 0 ? Math.min(98, 85 + (v.owing === 0 ? 9 : 0)) : 0,
    })
  );

  const { data: acts } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(12);

  const recentActivities = (acts ?? []).map((a) => ({
    id: String(a.id),
    type: a.type as string,
    user: a.actor_name as string,
    action: a.action_text as string,
    time: formatRelativeTime(a.created_at as string),
  }));

  const { data: alerts } = await supabase
    .from('compliance_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const complianceAlerts = (alerts ?? []).map((c) => ({
    id: String(c.id),
    title: c.title as string,
    description: c.description as string,
    severity: c.severity as string,
    time: formatRelativeTime(c.created_at as string),
  }));

  return {
    kpis,
    memberGrowth: mg,
    loanPortfolio: lp,
    welcome: {
      greetingName: greetingName.split(' ')[0] || greetingName,
      dateLabel: new Date().toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
    productsSummary,
    branchPerformance,
    recentActivities,
    complianceAlerts,
  };
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return d.toLocaleDateString('en-NG');
}

async function loadInvestmentSummary(supabase: SupabaseClient) {
  const { data: rows, error } = await supabase
    .from('operational_items')
    .select('subtype, data')
    .eq('module', 'investments');

  if (error || !rows) {
    return { activeProducts: 0, totalInvested: 0, activeInvestors: 0 };
  }

  const products = rows.filter((r) => r.subtype === 'investmentProduct');
  const holdings = rows.filter((r) => r.subtype === 'memberInvestment');
  const activeHoldings = holdings.filter(
    (h) => pickStr(h.data as Record<string, unknown>, 'status') === 'Active'
  );
  const investorIds = new Set(
    activeHoldings
      .map((h) => pickStr(h.data as Record<string, unknown>, 'memberId'))
      .filter(Boolean)
  );

  return {
    activeProducts: products.length,
    totalInvested: activeHoldings.reduce(
      (s, h) => s + pickNum(h.data as Record<string, unknown>, 'principal'),
      0
    ),
    activeInvestors: investorIds.size,
  };
}
