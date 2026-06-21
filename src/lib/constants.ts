export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth
  SUPER_ADMIN_LOGIN: '/auth/super-admin/login',
  LOGOUT: '/auth/logout',

  // Super admin
  OVERVIEW: '/admin/overview',
  AUDIT: '/admin/audit',

  // Tenants
  TENANTS: '/tenants',
  TENANT_DETAIL: (id: string) => `/tenants/${id}`,
  TENANT_ACTIVATE: (id: string) => `/tenants/${id}/activate`,
  TENANT_DEACTIVATE: (id: string) => `/tenants/${id}/deactivate`,
  TENANT_SUSPEND: (id: string) => `/tenants/${id}/suspend`,
  TENANT_PERMANENT: (id: string) => `/tenants/${id}/permanent`,

  // Per-tenant analytics
  ANALYTICS_DASHBOARD: (id: string) => `/tenants/${id}/analytics/dashboard`,

  // Migrations
  MIGRATIONS_STATUS: (id: string) => `/tenants/${id}/migrations/status`,
  MIGRATIONS_SYNC: (id: string) => `/tenants/${id}/migrations/sync`,

  // Provision a gym admin for a tenant
  TENANT_ADMINS: (id: string) => `/auth/tenants/${id}/admins`,

  // Cross-tenant user management
  TENANT_USERS: (id: string) => `/auth/tenants/${id}/users`,
  USER_ASSIGN_TENANT: (userId: string) =>
    `/auth/users/${userId}/assign-tenant`,
  USER_REMOVE_TENANT: (userId: string) =>
    `/auth/users/${userId}/remove-tenant`,
  USER_ROLE: (userId: string) => `/auth/users/${userId}/role`,
};
