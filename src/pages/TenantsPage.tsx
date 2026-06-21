import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tenantService } from '@/services/tenant.service';
import { Tenant, TenantStatus } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusBadgeVariant, statusLabel } from '@/lib/status';
import { Plus, Search, Building2, ExternalLink, Clock } from 'lucide-react';

const STATUS_FILTERS: Array<TenantStatus | 'all'> = [
  'all',
  'active',
  'trial',
  'suspended',
  'inactive',
  'pending',
];

/** Days until the trial ends (negative = expired). null if no trial date. */
function trialDaysLeft(trialEndsAt?: string): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function TenantsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenantStatus | 'all'>('all');

  useEffect(() => {
    (async () => {
      try {
        setTenants(await tenantService.getAll());
      } catch (err: any) {
        showError(
          'Failed to load tenants',
          err.response?.data?.message || err.message,
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      const matchesStatus =
        statusFilter === 'all' || t.status === statusFilter;
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        (t.subdomain || '').toLowerCase().includes(q) ||
        t.tenantId.toLowerCase().includes(q) ||
        t.contactEmail.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [tenants, query, statusFilter]);

  const endingSoon = useMemo(
    () =>
      tenants.filter((t) => {
        const d = trialDaysLeft(t.trialEndsAt);
        return d !== null && d >= 0 && d <= 7;
      }),
    [tenants],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tenants
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tenants.length} gym{tenants.length === 1 ? '' : 's'} on the platform.
          </p>
        </div>
        <Button onClick={() => navigate('/tenants/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Tenant
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, subdomain, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {!loading && endingSoon.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-300">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{endingSoon.length}</strong> trial
            {endingSoon.length === 1 ? '' : 's'} ending within 7 days:{' '}
            {endingSoon.map((t) => t.name).join(', ')}
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No tenants match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Link key={t.id} to={`/tenants/${t.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.logoUrl ? (
                        <img
                          src={t.logoUrl}
                          alt={t.name}
                          className="h-10 w-10 rounded-lg object-contain bg-gray-50"
                        />
                      ) : (
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{
                            backgroundColor: t.primaryColor || '#f97316',
                          }}
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {t.subdomain || t.tenantId}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={statusBadgeVariant(t.status)}>
                        {statusLabel(t.status)}
                      </Badge>
                      {(() => {
                        const d = trialDaysLeft(t.trialEndsAt);
                        if (d === null) return null;
                        return (
                          <Badge variant={d < 0 ? 'destructive' : d <= 7 ? 'warning' : 'secondary'}>
                            {d < 0 ? 'Trial expired' : `Trial: ${d}d`}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                    <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    {t.contactEmail}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
