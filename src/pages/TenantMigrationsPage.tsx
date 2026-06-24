import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  migrationService,
  MigrationStatus,
} from '@/services/migration.service';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function TenantMigrationsPage() {
  const { id } = useParams();
  const { success, error: showError } = useToast();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [st, tenant] = await Promise.all([
        migrationService.getStatus(id),
        tenantService.getById(id),
      ]);
      setStatus(st);
      setTenantName(tenant.name);
    } catch (err: any) {
      showError('Failed to load status', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // The sync now runs in the background on the server (returns 202 instantly),
  // so we poll the status endpoint for live progress instead of waiting on one
  // long request that would time out.
  const pollUntilDone = async (tenantId: string) => {
    const maxAttempts = 240; // ~10 min at 2.5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2500);
      let st: MigrationStatus;
      try {
        st = await migrationService.getStatus(tenantId);
      } catch {
        continue; // transient error — keep polling
      }
      setStatus(st);

      // Job has stopped running (or there's no job record) → we're finished.
      if (!st.sync || st.sync.running === false) {
        if (st.sync?.error) {
          showError('Sync finished with an error', st.sync.error);
        } else if (st.failedMigrations > 0) {
          showError(
            'Sync finished with failures',
            `${st.failedMigrations} migration(s) failed — check server logs.`,
          );
        } else if (st.isUpToDate) {
          success('Migrations synced', 'All migrations are up to date.');
        } else {
          success(
            'Sync finished',
            `${st.pendingMigrations} still pending — run Sync again to continue.`,
          );
        }
        return;
      }
    }
    showError(
      'Still running',
      'Sync is taking a while. It continues on the server — refresh status shortly.',
    );
  };

  const runSync = async () => {
    if (!id) return;
    setSyncing(true);
    try {
      const res = await migrationService.sync(id, false);
      success(
        res.status === 'running' ? 'Sync already running' : 'Sync started',
        'Running migrations in the background — this can take a few minutes.',
      );
      await pollUntilDone(id);
    } catch (err: any) {
      showError(
        'Sync failed to start',
        err.response?.data?.message || err.message,
      );
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!status) return null;

  const stats = [
    { label: 'Total', value: status.totalMigrations },
    { label: 'Completed', value: status.completedMigrations },
    { label: 'Pending', value: status.pendingMigrations },
    { label: 'Failed', value: status.failedMigrations },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/tenants/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tenantName} — Migrations
            </h1>
            <div className="mt-1">
              {status.isUpToDate ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Up to date
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Clock className="h-3 w-3 mr-1" /> {status.pendingMigrations}{' '}
                  pending
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={runSync} disabled={syncing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Syncing...' : 'Sync Migrations'}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending Migrations</CardTitle>
        </CardHeader>
        <CardContent>
          {status.pendingMigrationNames?.length ? (
            <ul className="space-y-2">
              {status.pendingMigrationNames.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <Clock className="h-4 w-4 text-amber-500" />
                  {name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> No pending
              migrations.
            </p>
          )}
          {status.failedMigrations > 0 && (
            <p className="text-sm text-red-600 mt-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {status.failedMigrations}{' '}
              failed migration(s) — check server logs.
            </p>
          )}
          {status.lastExecuted && (
            <p className="text-xs text-gray-400 mt-4">
              Last executed: {new Date(status.lastExecuted).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
