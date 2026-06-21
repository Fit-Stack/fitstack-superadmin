import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tenantService } from '@/services/tenant.service';
import { Tenant, CreateTenantDto, UpdateTenantDto } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import TenantForm, { TenantFormValues } from '@/components/forms/TenantForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { statusBadgeVariant, statusLabel } from '@/lib/status';
import {
  ArrowLeft,
  Power,
  PauseCircle,
  PlayCircle,
  Trash2,
  AlertTriangle,
  BarChart3,
  Users2,
  Database,
  CheckCircle2,
  Copy,
} from 'lucide-react';

type ConfirmAction =
  | 'deactivate'
  | 'suspend'
  | 'softDelete'
  | 'permanentDelete'
  | null;

interface CreateResult {
  tenant: Tenant;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
  adminError: string | null;
}

export default function TenantDetailsPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [createStatus, setCreateStatus] = useState<
    'idle' | 'creating' | 'provisioning'
  >('idle');
  const [result, setResult] = useState<CreateResult | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      setTenant(await tenantService.getById(id));
    } catch (err: any) {
      showError('Failed to load tenant', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (v: TenantFormValues) => {
    setSubmitting(true);
    try {
      if (isNew) {
        const dto: CreateTenantDto = {
          name: v.name,
          contactEmail: v.contactEmail,
          status: v.status,
          ...(v.subdomain && { subdomain: v.subdomain }),
          ...(v.contactPhone && { contactPhone: v.contactPhone }),
          membership: { enabled: v.membershipEnabled, currency: v.currency },
          ...(v.tagline && { tagline: v.tagline }),
          primaryColor: v.primaryColor,
          primaryHover: v.primaryHover,
          fontFamily: v.fontFamily,
          ...(v.logoUrl && { logoUrl: v.logoUrl }),
          ...(v.faviconUrl && { faviconUrl: v.faviconUrl }),
          ...(v.trialEndsAt && {
            trialEndsAt: new Date(v.trialEndsAt).toISOString(),
          }),
          settings: { features: v.features },
        };

        // Step 1: create the tenant (heavy: schema + migrations).
        setCreateStatus('creating');
        const created = await tenantService.create(dto);

        // Step 2: provision the first admin. A failure here must NOT lose the
        // created tenant — surface it on the result screen with a retry.
        setCreateStatus('provisioning');
        let adminError: string | null = null;
        try {
          await tenantService.createAdmin(created.id, {
            email: v.adminEmail,
            password: v.adminPassword,
            fullName: v.adminFullName || undefined,
          });
        } catch (e: any) {
          adminError = e.response?.data?.message || e.message || 'Unknown error';
        }

        setResult({
          tenant: created,
          adminEmail: v.adminEmail,
          adminPassword: v.adminPassword,
          adminFullName: v.adminFullName,
          adminError,
        });
        if (!adminError) success('Tenant created', `${created.name} is ready.`);
      } else {
        const dto: UpdateTenantDto = {
          name: v.name,
          contactEmail: v.contactEmail,
          status: v.status,
          subdomain: v.subdomain || undefined,
          contactPhone: v.contactPhone || undefined,
          tagline: v.tagline,
          primaryColor: v.primaryColor,
          primaryHover: v.primaryHover,
          fontFamily: v.fontFamily,
          ...(v.logoUrl && v.logoUrl.startsWith('data:') && { logoUrl: v.logoUrl }),
          ...(v.faviconUrl &&
            v.faviconUrl.startsWith('data:') && { faviconUrl: v.faviconUrl }),
          ...(v.trialEndsAt && {
            trialEndsAt: new Date(v.trialEndsAt).toISOString(),
          }),
          // Merge feature flags into existing settings (preserve membership etc.)
          settings: { ...(tenant?.settings || {}), features: v.features },
        };
        const updated = await tenantService.update(id!, dto);
        setTenant(updated);
        success('Saved', 'Tenant updated.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      showError(
        err.response?.status === 409 ? 'Subdomain taken' : 'Create failed',
        msg,
      );
    } finally {
      setSubmitting(false);
      setCreateStatus('idle');
    }
  };

  const retryAdmin = async () => {
    if (!result) return;
    setSubmitting(true);
    try {
      await tenantService.createAdmin(result.tenant.id, {
        email: result.adminEmail,
        password: result.adminPassword,
        fullName: result.adminFullName || undefined,
      });
      setResult({ ...result, adminError: null });
      success('Admin provisioned', 'The gym admin can now log in.');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      setResult({ ...result, adminError: msg });
      showError('Still failing', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const runLifecycle = async () => {
    if (!id || !tenant) return;
    setSubmitting(true);
    try {
      if (confirm === 'deactivate') {
        await tenantService.deactivate(id, reason);
        success('Deactivated', `${tenant.name} deactivated.`);
      } else if (confirm === 'suspend') {
        if (!reason.trim()) {
          showError('Reason required', 'Please provide a suspension reason.');
          setSubmitting(false);
          return;
        }
        await tenantService.suspend(id, reason);
        success('Suspended', `${tenant.name} suspended.`);
      } else if (confirm === 'softDelete') {
        await tenantService.softDelete(id);
        success('Deleted', `${tenant.name} soft-deleted.`);
        navigate('/tenants');
        return;
      } else if (confirm === 'permanentDelete') {
        if (confirmText !== tenant.name) {
          showError('Confirmation failed', 'Type the gym name exactly to confirm.');
          setSubmitting(false);
          return;
        }
        await tenantService.permanentDelete(id);
        success('Permanently deleted', `${tenant.name} and its data are gone.`);
        navigate('/tenants');
        return;
      }
      closeConfirm();
      await load();
    } catch (err: any) {
      showError('Action failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activate = async () => {
    if (!id || !tenant) return;
    setSubmitting(true);
    try {
      await tenantService.activate(id);
      success('Activated', `${tenant.name} is active.`);
      await load();
    } catch (err: any) {
      showError('Action failed', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeConfirm = () => {
    setConfirm(null);
    setReason('');
    setConfirmText('');
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    success('Copied', '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Post-create success screen
  if (result) {
    const t = result.tenant;
    const sub = t.subdomain || t.tenantId;
    const prodUrl = `https://${sub}.fitstack.com`;
    const devUrl = `http://localhost:5173/login?tenant=${sub}`;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-8 space-y-6">
            <div className="text-center">
              <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t.name} created
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tenant ID: {t.tenantId}
              </p>
            </div>

            {/* Admin credentials */}
            {result.adminError ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 dark:text-red-300">
                      Tenant created, but admin provisioning failed
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {result.adminError}
                    </p>
                  </div>
                </div>
                <Button onClick={retryAdmin} disabled={submitting} size="sm">
                  {submitting ? 'Retrying...' : 'Retry admin provisioning'}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  First admin login (hand these to the gym)
                </p>
                <CredRow label="Email" value={result.adminEmail} onCopy={copy} />
                <CredRow
                  label="Password"
                  value={result.adminPassword}
                  onCopy={copy}
                />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ This password is shown once. Copy it now.
                </p>
              </div>
            )}

            {/* Tenant URLs */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Admin portal URL
              </p>
              <CredRow label="Production" value={prodUrl} onCopy={copy} />
              <CredRow label="Local dev" value={devUrl} onCopy={copy} />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/tenants')}
              >
                Done
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/tenants/${t.id}`)}
              >
                Open tenant
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isNew ? 'New Tenant' : tenant?.name}
            </h1>
            {!isNew && tenant && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusBadgeVariant(tenant.status)}>
                  {statusLabel(tenant.status)}
                </Badge>
                <span className="text-xs text-gray-500">{tenant.tenantId}</span>
              </div>
            )}
          </div>
        </div>

        {!isNew && tenant && (
          <div className="flex items-center gap-2 flex-wrap">
            {tenant.status === 'active' ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm('suspend')}
                >
                  <PauseCircle className="h-4 w-4 mr-1" /> Suspend
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirm('deactivate')}
                >
                  <Power className="h-4 w-4 mr-1" /> Deactivate
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={activate} disabled={submitting}>
                <PlayCircle className="h-4 w-4 mr-1" /> Activate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm('softDelete')}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirm('permanentDelete')}
            >
              <AlertTriangle className="h-4 w-4 mr-1" /> Permanent
            </Button>
          </div>
        )}
      </div>

      {!isNew && tenant && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/tenants/${id}/analytics`}>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" /> Analytics
            </Button>
          </Link>
          <Link to={`/tenants/${id}/users`}>
            <Button variant="outline" size="sm">
              <Users2 className="h-4 w-4 mr-1" /> Users
            </Button>
          </Link>
          <Link to={`/tenants/${id}/migrations`}>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-1" /> Migrations
            </Button>
          </Link>
        </div>
      )}

      {createStatus !== 'idle' && (
        <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {createStatus === 'creating'
              ? 'Creating tenant & running migrations… this can take up to a minute.'
              : 'Provisioning the first admin…'}
          </p>
        </div>
      )}

      <TenantForm
        mode={isNew ? 'create' : 'edit'}
        tenant={tenant}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      {/* Confirm modal */}
      {confirm && tenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`h-5 w-5 ${
                    confirm === 'permanentDelete'
                      ? 'text-red-600'
                      : 'text-amber-500'
                  }`}
                />
                <h3 className="font-semibold text-lg capitalize">
                  {confirm === 'softDelete'
                    ? 'Delete tenant'
                    : confirm === 'permanentDelete'
                      ? 'Permanently delete'
                      : confirm}{' '}
                  {confirm !== 'softDelete' && confirm !== 'permanentDelete'
                    ? 'tenant'
                    : ''}
                </h3>
              </div>

              {confirm === 'permanentDelete' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This <strong>drops the tenant's schema and all data</strong>{' '}
                    — irreversible. Type the gym name{' '}
                    <strong>{tenant.name}</strong> to confirm.
                  </p>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={tenant.name}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                  />
                </>
              ) : confirm === 'suspend' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Suspending blocks access. Provide a reason:
                  </p>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for suspension"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                  />
                </>
              ) : confirm === 'deactivate' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Deactivate this tenant? Reason (optional):
                  </p>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                  />
                </>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Soft-delete <strong>{tenant.name}</strong>? It will be marked
                  inactive but data is preserved.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeConfirm} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  variant={
                    confirm === 'permanentDelete' ? 'destructive' : 'default'
                  }
                  onClick={runLifecycle}
                  disabled={submitting}
                >
                  {submitting ? 'Working...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function CredRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-gray-500 w-20 flex-shrink-0">{label}</span>
      <code className="flex-1 truncate text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
        {value}
      </code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="text-gray-400 hover:text-primary flex-shrink-0"
        title="Copy"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}
