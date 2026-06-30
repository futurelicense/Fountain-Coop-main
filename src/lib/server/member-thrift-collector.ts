import type { SupabaseClient } from '@supabase/supabase-js';
import { pickStr } from '@/lib/pickData';

export type MemberThriftCollector = {
  name: string;
  route: string;
  branch: string;
  phone: string;
  collectorCode: string;
  memberCode: string;
  assigned: boolean;
};

const BRANCH_COLLECTOR_FALLBACK: Record<
  string,
  Omit<MemberThriftCollector, 'memberCode' | 'assigned'>
> = {
  'Lagos Main': {
    name: 'Tolu Adegoke',
    route: 'Lagos Main Route A',
    branch: 'Lagos Main',
    phone: '+2348011234567',
    collectorCode: 'COL-LM-01',
  },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (raw.trim().startsWith('+')) return raw.trim();
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  return `+${digits}`;
}

export async function resolveMemberThriftCollector(
  supabase: SupabaseClient,
  profile: {
    member_code?: string | null;
    full_name?: string | null;
    branch?: string | null;
  }
): Promise<MemberThriftCollector & { initials: string }> {
  const memberCode = profile.member_code?.trim() || '';
  const memberName = profile.full_name?.trim() || '';
  const branch = profile.branch?.trim() || '';

  const { data: participants } = await supabase
    .from('operational_items')
    .select('data')
    .eq('module', 'thrift')
    .eq('subtype', 'thriftParticipant');

  const participant = (participants ?? []).find((row) => {
    const data = (row.data as Record<string, unknown> | null) ?? {};
    const idMatch =
      memberCode &&
      pickStr(data, 'memberId').toLowerCase() === memberCode.toLowerCase();
    const nameMatch =
      memberName &&
      pickStr(data, 'memberName').toLowerCase() === memberName.toLowerCase();
    const branchMatch =
      !branch || !pickStr(data, 'branch') || pickStr(data, 'branch') === branch;
    return (idMatch || nameMatch) && branchMatch;
  });

  const collectorName = participant
    ? pickStr((participant.data as Record<string, unknown>) ?? {}, 'collector')
    : '';

  let collectorData: Record<string, unknown> | null = null;
  if (collectorName && collectorName !== 'Unassigned') {
    const { data: collectors } = await supabase
      .from('operational_items')
      .select('data')
      .eq('module', 'thrift')
      .eq('subtype', 'collector');
    collectorData =
      (collectors ?? []).find(
        (row) =>
          pickStr((row.data as Record<string, unknown>) ?? {}, 'name').toLowerCase() ===
          collectorName.toLowerCase()
      )?.data ?? null;
  }

  const fallback =
    (branch && BRANCH_COLLECTOR_FALLBACK[branch]) ||
    BRANCH_COLLECTOR_FALLBACK['Lagos Main'];

  const resolved: MemberThriftCollector = {
    name: collectorData
      ? pickStr(collectorData, 'name', fallback.name)
      : collectorName && collectorName !== 'Unassigned'
        ? collectorName
        : fallback.name,
    route: collectorData
      ? pickStr(collectorData, 'route', fallback.route)
      : fallback.route,
    branch: branch || fallback.branch,
    phone: normalizePhone(
      collectorData ? pickStr(collectorData, 'phone', fallback.phone) : fallback.phone
    ),
    collectorCode: collectorData
      ? pickStr(collectorData, 'collectorCode', pickStr(collectorData, 'code', fallback.collectorCode))
      : fallback.collectorCode,
    memberCode: memberCode || '—',
    assigned: Boolean(
      participant &&
        collectorName &&
        collectorName !== 'Unassigned'
    ),
  };

  return { ...resolved, initials: initials(resolved.name) };
}
