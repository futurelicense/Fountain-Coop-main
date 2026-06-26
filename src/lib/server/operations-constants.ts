/** URL segment + DB `module` column (lowercase snake). */
export const OPERATIONS_MODULES = [
  'cooperative',
  'thrift',
  'ajo',
  'packs',
  'investments',
  'loans',
  'recovery',
  'branches',
  'transactions',
  'reports',
  'compliance',
  'notifications',
  'support',
  'member',
] as const;

export type OperationsModule = (typeof OPERATIONS_MODULES)[number];

export function isAllowedOperationsModule(
  raw: string
): raw is OperationsModule {
  return (OPERATIONS_MODULES as readonly string[]).includes(raw);
}

export function isStaffRole(role: string | null | undefined): boolean {
  return (
    role === 'super_admin' ||
    role === 'tenant_admin' ||
    role === 'group_admin'
  );
}
