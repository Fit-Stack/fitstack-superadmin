import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';

export interface MigrationStatus {
  tenantId: string;
  totalMigrations: number;
  completedMigrations: number;
  failedMigrations: number;
  pendingMigrations: number;
  pendingMigrationNames: string[];
  lastExecuted: string | null;
  isUpToDate: boolean;
}

export interface MigrationSyncResult {
  success: boolean;
  message: string;
  tenantId: string;
  migrationsExecuted: number;
  migrationsFailed: number;
  executedMigrations: string[];
  failedMigrationNames: string[];
  executionTimeMs: number;
  status: MigrationStatus;
}

class MigrationService {
  async getStatus(tenantId: string): Promise<MigrationStatus> {
    const { data } = await api.get<MigrationStatus>(
      API_ENDPOINTS.MIGRATIONS_STATUS(tenantId),
    );
    return data;
  }

  async sync(tenantId: string, force = false): Promise<MigrationSyncResult> {
    const { data } = await api.post<MigrationSyncResult>(
      API_ENDPOINTS.MIGRATIONS_SYNC(tenantId),
      { force },
    );
    return data;
  }
}

export const migrationService = new MigrationService();
