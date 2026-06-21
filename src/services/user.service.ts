import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export interface TenantUser {
  id: string; // supabase user id
  email: string;
  role?: string;
  fullName?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface TenantUsersResponse {
  tenantId: string;
  users: TenantUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Roles a super admin can assign within a tenant.
export const ASSIGNABLE_ROLES = [
  'member',
  'moderator',
  'admin',
  'super_admin',
] as const;

class UserService {
  /** List users belonging to a tenant. `tenantUuid` is the tenant.id (UUID). */
  async listByTenant(tenantUuid: string): Promise<TenantUsersResponse> {
    const { data } = await api.get<TenantUsersResponse>(
      API_ENDPOINTS.TENANT_USERS(tenantUuid),
    );
    return data;
  }

  async assign(
    userId: string,
    tenantUuid: string,
    role: string,
  ): Promise<void> {
    await api.post(API_ENDPOINTS.USER_ASSIGN_TENANT(userId), {
      tenantId: tenantUuid,
      role,
    });
  }

  async changeRole(
    userId: string,
    tenantUuid: string,
    role: string,
  ): Promise<void> {
    await api.patch(API_ENDPOINTS.USER_ROLE(userId), {
      tenantId: tenantUuid,
      role,
    });
  }

  async removeFromTenant(userId: string, tenantUuid: string): Promise<void> {
    await api.delete(API_ENDPOINTS.USER_REMOVE_TENANT(userId), {
      data: { tenantId: tenantUuid },
    });
  }
}

export const userService = new UserService();
