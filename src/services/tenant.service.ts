import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { Tenant, CreateTenantDto, UpdateTenantDto, Overview } from '@/types';

class TenantService {
  async getAll(): Promise<Tenant[]> {
    const { data } = await api.get<Tenant[]>(API_ENDPOINTS.TENANTS);
    return data;
  }

  async getById(id: string): Promise<Tenant> {
    const { data } = await api.get<Tenant>(API_ENDPOINTS.TENANT_DETAIL(id));
    return data;
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    // Creating a tenant provisions a schema + runs all migrations, which is
    // slow on Render — extend the timeout well beyond the 30s default.
    const { data } = await api.post<Tenant>(API_ENDPOINTS.TENANTS, dto, {
      timeout: 120000,
    });
    return data;
  }

  /** Provision the first (auto-confirmed) admin for a tenant. */
  async createAdmin(
    tenantUuid: string,
    admin: { email: string; password: string; fullName?: string },
  ): Promise<void> {
    await api.post(API_ENDPOINTS.TENANT_ADMINS(tenantUuid), admin, {
      timeout: 60000,
    });
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const { data } = await api.patch<Tenant>(
      API_ENDPOINTS.TENANT_DETAIL(id),
      dto,
    );
    return data;
  }

  async activate(id: string): Promise<Tenant> {
    const { data } = await api.post<Tenant>(API_ENDPOINTS.TENANT_ACTIVATE(id));
    return data;
  }

  async deactivate(id: string, reason?: string): Promise<Tenant> {
    const { data } = await api.post<Tenant>(
      API_ENDPOINTS.TENANT_DEACTIVATE(id),
      { reason },
    );
    return data;
  }

  async suspend(id: string, reason: string): Promise<Tenant> {
    const { data } = await api.post<Tenant>(API_ENDPOINTS.TENANT_SUSPEND(id), {
      reason,
    });
    return data;
  }

  async softDelete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TENANT_DETAIL(id));
  }

  async permanentDelete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TENANT_PERMANENT(id));
  }

  async getOverview(): Promise<Overview> {
    const { data } = await api.get<Overview>(API_ENDPOINTS.OVERVIEW);
    return data;
  }
}

export const tenantService = new TenantService();
