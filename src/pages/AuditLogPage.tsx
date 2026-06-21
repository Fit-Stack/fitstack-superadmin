import { useEffect, useState } from 'react';
import { auditService, AuditEntry } from '@/services/audit.service';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollText, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const ACTIONS = [
  'all',
  'tenant.create',
  'tenant.update',
  'tenant.activate',
  'tenant.deactivate',
  'tenant.suspend',
  'tenant.delete.soft',
  'tenant.delete.permanent',
  'admin.provision',
  'user.assign',
  'user.role.update',
  'user.remove',
];

function actionVariant(action: string): 'default' | 'destructive' | 'warning' | 'secondary' | 'success' {
  if (action.includes('permanent')) return 'destructive';
  if (action.includes('delete') || action.includes('suspend')) return 'warning';
  if (action.includes('create') || action.includes('provision') || action.includes('activate'))
    return 'success';
  return 'secondary';
}

export default function AuditLogPage() {
  const { error: showError } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const limit = 25;

  const load = async () => {
    setLoading(true);
    try {
      const res = await auditService.getAll({
        page,
        action: action === 'all' ? undefined : action,
      });
      setEntries(res.items);
      setTotal(res.total);
    } catch (err: any) {
      showError('Failed to load audit log', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Audit Log
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {total} recorded action{total === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={action}
            onChange={(e) => {
              setPage(1);
              setAction(e.target.value);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No audit entries.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-700">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-4 p-4 flex-wrap"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={actionVariant(e.action)}>{e.action}</Badge>
                    {e.targetName && (
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {e.targetName}
                      </span>
                    )}
                    {e.targetType && (
                      <span className="text-xs text-gray-400">
                        ({e.targetType})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    by {e.actorEmail || e.actorId || 'unknown'}
                    {e.metadata && Object.keys(e.metadata).length > 0 && (
                      <span className="text-gray-400">
                        {' · '}
                        {JSON.stringify(e.metadata)}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
