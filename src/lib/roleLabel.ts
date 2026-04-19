import type { UserRole } from '../api/types';

export function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'tenant_admin':
      return 'Tenant Admin';
    case 'group_admin':
      return 'Group Admin';
    case 'member':
      return 'Member';
    default:
      return role;
  }
}
