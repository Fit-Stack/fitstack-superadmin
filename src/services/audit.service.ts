import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export interface AuditEntry {
  id: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

class AuditService {
  async getAll(params: {
    page?: number;
    action?: string;
    targetId?: string;
  }): Promise<AuditResponse> {
    const sp = new URLSearchParams();
    if (params.page) sp.set('page', String(params.page));
    if (params.action) sp.set('action', params.action);
    if (params.targetId) sp.set('targetId', params.targetId);
    const { data } = await api.get<AuditResponse>(
      `${API_ENDPOINTS.AUDIT}?${sp.toString()}`,
    );
    return data;
  }
}

export const auditService = new AuditService();
