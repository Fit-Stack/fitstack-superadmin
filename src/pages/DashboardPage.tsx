import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tenantService } from '@/services/tenant.service';
import { Overview } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { statusBadgeVariant, statusLabel } from '@/lib/status';
import {
  Building2,
  CheckCircle2,
  PauseCircle,
  Users,
  IndianRupee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const { error: showError } = useToast();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setOverview(await tenantService.getOverview());
      } catch (err: any) {
        showError(
          'Failed to load overview',
          err.response?.data?.message || err.message,
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!overview) return null;

  const cards = [
    {
      label: 'Total Tenants',
      value: overview.tenants.total,
      icon: Building2,
    },
    {
      label: 'Active',
      value: overview.tenants.active,
      icon: CheckCircle2,
    },
    {
      label: 'Suspended',
      value: overview.tenants.suspended,
      icon: PauseCircle,
    },
    {
      label: 'Total Members',
      value: overview.totalMembers.toLocaleString(),
      icon: Users,
    },
    {
      label: 'Revenue (This Month)',
      value: `₹${overview.revenueThisMonth.toLocaleString()}`,
      icon: IndianRupee,
    },
  ];

  const chartData = overview.perTenant
    .filter((t) => t.members > 0 || t.revenueThisMonth > 0)
    .map((t) => ({ name: t.name, members: t.members }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          System-wide metrics across all gyms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {c.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {c.value}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members per Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-gray-500 py-12 text-center">
                No member data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar
                    dataKey="members"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tenants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentTenants.map((t) => (
              <Link
                key={t.id}
                to={`/tenants/${t.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t.subdomain || t.tenantId}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(t.status)}>
                  {statusLabel(t.status)}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
