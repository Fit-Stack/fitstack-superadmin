import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analyticsService, Dashboard } from '@/services/analytics.service';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function TenantAnalyticsPage() {
  const { id } = useParams();
  const { error: showError } = useToast();
  const [data, setData] = useState<Dashboard | null>(null);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const [dash, tenant] = await Promise.all([
          analyticsService.getDashboard(id),
          tenantService.getById(id),
        ]);
        setData(dash);
        setTenantName(tenant.name);
      } catch (err: any) {
        showError(
          'Failed to load analytics',
          err.response?.data?.message || err.message,
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!data) return null;

  const c = data.cards;
  const cur = data.currency || 'INR';
  const cards = [
    { label: 'Total Members', value: c.totalMembers.value },
    { label: 'Active Sessions', value: c.activeSessions.value },
    {
      label: 'Monthly Revenue',
      value: `${cur} ${c.monthlyRevenue.value.toLocaleString()}`,
    },
    { label: 'Avg Attendance', value: `${c.avgAttendance.value}%` },
    { label: 'Active Trainers', value: c.activeTrainers.value },
    { label: 'Avg Session Time', value: `${c.avgSessionTime.value} min` },
    { label: 'Member Retention', value: `${c.memberRetention.value}%` },
    { label: 'Daily Active Users', value: c.dailyActiveUsers.value },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/tenants/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tenantName} — Analytics
          </h1>
          <p className="text-xs text-gray-500">
            Generated {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.charts.revenue?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.charts.revenue}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 py-12 text-center">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {data.charts.memberGrowth?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.charts.memberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 py-12 text-center">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.charts.categoryDistribution?.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={data.charts.categoryDistribution}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    width={90}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 py-12 text-center">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Trainers</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trainers?.length ? (
              <div className="space-y-2">
                {data.trainers.slice(0, 6).map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {t.name}
                    </span>
                    <span className="text-gray-500">
                      {t.sessions} sessions · ⭐ {t.rating}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-12 text-center">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
