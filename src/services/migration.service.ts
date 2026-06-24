import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export interface MigrationSyncJob {
  running: boolean;
  startedAt: string;
  finishedAt?: string | null;
  executed: number;
  failed: number;
  error?: string | null;
}

export interface MigrationStatus {
  tenantId: string;
  totalMigrations: number;
  completedMigrations: number;
  failedMigrations: number;
  pendingMigrations: number;
  pendingMigrationNames: string[];
  lastExecuted: string | null;
  isUpToDate: boolean;
  sync?: MigrationSyncJob | null;
}

// The sync endpoint now returns immediately (202) and runs in the background.
export interface MigrationSyncStart {
  success: boolean;
  status: 'started' | 'running';
  message: string;
  tenantId: string;
  startedAt: string;
}

class MigrationService {
  async getStatus(tenantId: string): Promise<MigrationStatus> {
    const { data } = await api.get<MigrationStatus>(
      API_ENDPOINTS.MIGRATIONS_STATUS(tenantId),
    );
    return data;
  }

  async sync(tenantId: string, force = false): Promise<MigrationSyncStart> {
    const { data } = await api.post<MigrationSyncStart>(
      API_ENDPOINTS.MIGRATIONS_SYNC(tenantId),
      { force },
    );
    return data;
  }
}

export const migrationService = new MigrationService();
