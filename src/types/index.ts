export interface SuperAdminUser {
  id: string;
  email: string;
  fullName?: string;
  role: string; // 'super_admin'
  aal?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  expires_at: number;
  user: SuperAdminUser;
  message?: string;
}

export type TenantStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'trial'
  | 'pending';

export interface Tenant {
  id: string; // UUID
  tenantId: string; // slug
  name: string;
  subdomain?: string;
  status: TenantStatus;
  isActive: boolean;
  contactEmail: string;
  contactPhone?: string;
  description?: string;
  settings?: Record<string, any>;
  // Branding
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  primaryHover?: string;
  fontFamily?: string;
  tagline?: string;
  trialEndsAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const FEATURE_FLAGS = [
  'membership',
  'marketplace',
  'events',
  'announcements',
  'workouts',
] as const;
export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export interface CreateTenantDto {
  name: string;
  subdomain?: string;
  contactEmail: string;
  contactPhone?: string;
  status?: TenantStatus;
  trialEndsAt?: string;
  settings?: Record<string, any>;
  membership?: {
    enabled?: boolean;
    currency?: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  primaryHover?: string;
  fontFamily?: string;
  tagline?: string;
}

export type UpdateTenantDto = Partial<
  Omit<CreateTenantDto, 'membership'> & { isActive: boolean }
>;

export interface Overview {
  generatedAt: string;
  tenants: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
    trial: number;
    pending: number;
  };
  totalMembers: number;
  revenueThisMonth: number;
  recentTenants: Array<{
    id: string;
    tenantId: string;
    name: string;
    subdomain?: string;
    status: TenantStatus;
    createdAt: string;
  }>;
  perTenant: Array<{
    tenantId: string;
    name: string;
    status: TenantStatus;
    members: number;
    revenueThisMonth: number;
  }>;
}
