import { TenantStatus } from '@/types';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

export function statusBadgeVariant(status: TenantStatus): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'trial':
      return 'default';
    case 'pending':
      return 'warning';
    case 'suspended':
      return 'destructive';
    case 'inactive':
    default:
      return 'secondary';
  }
}

export function statusLabel(status: TenantStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
