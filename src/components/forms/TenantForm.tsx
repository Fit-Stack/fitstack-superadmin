import { useState } from 'react';
import { Tenant, TenantStatus, FEATURE_FLAGS } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Save, Eye, ShieldCheck, RefreshCw, Eye as EyeIcon, EyeOff } from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Lato',
  'Raleway',
  'Ubuntu',
  'Work Sans',
  'Playfair Display',
];

export interface TenantFormValues {
  name: string;
  subdomain: string;
  contactEmail: string;
  contactPhone: string;
  status: TenantStatus;
  description: string;
  membershipEnabled: boolean;
  currency: string;
  // branding
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  primaryHover: string;
  fontFamily: string;
  tagline: string;
  trialEndsAt: string; // yyyy-mm-dd for the date input ('' = none)
  features: Record<string, boolean>;
  // first admin (create mode only)
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
}

function toValues(t?: Tenant | null): TenantFormValues {
  return {
    name: t?.name || '',
    subdomain: t?.subdomain || '',
    contactEmail: t?.contactEmail || '',
    contactPhone: t?.contactPhone || '',
    status: t?.status || 'active',
    description: t?.description || '',
    membershipEnabled: true,
    currency: 'INR',
    logoUrl: t?.logoUrl || null,
    faviconUrl: t?.faviconUrl || null,
    primaryColor: t?.primaryColor || '#f97316',
    primaryHover: t?.primaryHover || '#ea580c',
    fontFamily: t?.fontFamily || 'Inter',
    tagline: t?.tagline || '',
    trialEndsAt: t?.trialEndsAt ? t.trialEndsAt.slice(0, 10) : '',
    features: featuresFromTenant(t),
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
  };
}

// Read feature flags from settings.features; default any missing flag to ON.
function featuresFromTenant(t?: Tenant | null): Record<string, boolean> {
  const existing = (t?.settings?.features || {}) as Record<string, boolean>;
  const out: Record<string, boolean> = {};
  for (const f of FEATURE_FLAGS) out[f] = existing[f] !== false;
  return out;
}

const FEATURE_LABELS: Record<string, string> = {
  membership: 'Membership',
  marketplace: 'Marketplace',
  events: 'Events',
  announcements: 'Announcements',
  workouts: 'Workouts',
};

function generatePassword(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 14; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const SUBDOMAIN_RE = /^[a-z0-9-]+$/;

interface Props {
  mode: 'create' | 'edit';
  tenant?: Tenant | null;
  submitting: boolean;
  onSubmit: (values: TenantFormValues) => void;
}

export default function TenantForm({ mode, tenant, submitting, onSubmit }: Props) {
  const { error: showError } = useToast();
  const [v, setV] = useState<TenantFormValues>(toValues(tenant));
  const [showPw, setShowPw] = useState(false);

  const set = <K extends keyof TenantFormValues>(
    key: K,
    value: TenantFormValues[K],
  ) => setV((prev) => ({ ...prev, [key]: value }));

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'logoUrl' | 'faviconUrl',
    maxMb: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      showError('Error', `File must be smaller than ${maxMb}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => set(key, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!v.name.trim() || !v.contactEmail.trim()) {
      showError('Error', 'Name and contact email are required');
      return;
    }
    if (v.subdomain && !SUBDOMAIN_RE.test(v.subdomain)) {
      showError('Invalid subdomain', 'Use only lowercase letters, numbers, and hyphens.');
      return;
    }
    if (mode === 'create') {
      if (!v.adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.adminEmail)) {
        showError('Admin email required', 'Enter a valid email for the first gym admin.');
        return;
      }
      if (v.adminPassword.length < 8) {
        showError('Weak password', 'Admin password must be at least 8 characters.');
        return;
      }
    }
    onSubmit(v);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Gym Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Acme Gym"
                disabled={submitting}
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={v.subdomain}
                  onChange={(e) =>
                    set('subdomain', e.target.value.toLowerCase())
                  }
                  placeholder="acme"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500">
                  lowercase, letters/numbers/hyphens
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={v.status}
                  onChange={(e) =>
                    set('status', e.target.value as TenantStatus)
                  }
                  disabled={submitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {['active', 'trial', 'pending', 'suspended', 'inactive'].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={v.contactEmail}
                  onChange={(e) => set('contactEmail', e.target.value)}
                  placeholder="owner@acme.com"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={v.contactPhone}
                  onChange={(e) => set('contactPhone', e.target.value)}
                  placeholder="+91..."
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trialEndsAt">Trial ends</Label>
                <Input
                  id="trialEndsAt"
                  type="date"
                  value={v.trialEndsAt}
                  onChange={(e) => set('trialEndsAt', e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500">
                  Optional. Used for trial tracking / "ending soon".
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={v.description}
                onChange={(e) => set('description', e.target.value)}
                disabled={submitting}
                rows={2}
              />
            </div>

            {mode === 'create' && (
              <div className="flex items-center gap-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={v.membershipEnabled}
                    onChange={(e) => set('membershipEnabled', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm">
                    Enable membership (seeds default plans)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="currency" className="text-sm">
                    Currency
                  </Label>
                  <Input
                    id="currency"
                    value={v.currency}
                    onChange={(e) => set('currency', e.target.value)}
                    className="w-24"
                    disabled={submitting}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logo, colors, font for this gym</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={v.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Premium Fitness"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e, 'logoUrl', 2)}
                    disabled={submitting}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-600">Upload</span>
                  </div>
                </label>
                {v.logoUrl && (
                  <img
                    src={v.logoUrl}
                    alt="logo"
                    className="h-20 w-20 object-contain rounded-lg bg-gray-50"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">Max 2MB. PNG/SVG.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primaryColor"
                    type="color"
                    value={v.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    disabled={submitting}
                    className="h-10 w-12 rounded cursor-pointer"
                  />
                  <Input
                    value={v.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryHover">Hover Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primaryHover"
                    type="color"
                    value={v.primaryHover}
                    onChange={(e) => set('primaryHover', e.target.value)}
                    disabled={submitting}
                    className="h-10 w-12 rounded cursor-pointer"
                  />
                  <Input
                    value={v.primaryHover}
                    onChange={(e) => set('primaryHover', e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Font Family</Label>
              <select
                id="fontFamily"
                value={v.fontFamily}
                onChange={(e) => set('fontFamily', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Favicon (optional)</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center justify-center h-14 w-14 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e, 'faviconUrl', 1)}
                    disabled={submitting}
                    className="hidden"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </label>
                {v.faviconUrl && (
                  <img
                    src={v.faviconUrl}
                    alt="favicon"
                    className="h-14 w-14 object-contain rounded-lg bg-gray-50"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature flags */}
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Enable or disable modules for this gym.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURE_FLAGS.map((f) => (
              <label
                key={f}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {FEATURE_LABELS[f] || f}
                </span>
                <input
                  type="checkbox"
                  checked={v.features[f] !== false}
                  onChange={(e) =>
                    set('features', { ...v.features, [f]: e.target.checked })
                  }
                  disabled={submitting}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
              </label>
            ))}
          </CardContent>
        </Card>

        {mode === 'create' && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> First Gym Admin
              </CardTitle>
              <CardDescription>
                This login is created (auto-confirmed) so the gym can use their
                admin portal immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminFullName">Admin Name</Label>
                  <Input
                    id="adminFullName"
                    value={v.adminFullName}
                    onChange={(e) => set('adminFullName', e.target.value)}
                    placeholder="Jane Owner"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={v.adminEmail}
                    onChange={(e) => set('adminEmail', e.target.value)}
                    placeholder="owner@acme.com"
                    disabled={submitting}
                    required
                  />
                  {v.contactEmail && v.adminEmail !== v.contactEmail && (
                    <button
                      type="button"
                      onClick={() => set('adminEmail', v.contactEmail)}
                      className="text-xs text-primary hover:underline"
                    >
                      Use contact email ({v.contactEmail})
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin Password *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="adminPassword"
                      type={showPw ? 'text' : 'password'}
                      value={v.adminPassword}
                      onChange={(e) => set('adminPassword', e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={submitting}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      set('adminPassword', generatePassword());
                      setShowPw(true);
                    }}
                    disabled={submitting}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" /> Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Save these credentials — you'll hand them to the gym. They can
                  change the password after first login.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {submitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Tenant'
              : 'Save Changes'}
        </Button>
      </div>

      {/* Live preview */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: v.primaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {v.logoUrl ? (
                      <img
                        src={v.logoUrl}
                        alt="logo"
                        className="h-10 w-10 rounded bg-white/10"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center font-bold">
                        {v.name.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{v.name || 'Gym Name'}</p>
                      <p className="text-xs opacity-90">
                        {v.tagline || 'Tagline'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800">
                  <button
                    type="button"
                    className="w-full py-2 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: v.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <p
                    className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100"
                    style={{ fontFamily: `${v.fontFamily}, sans-serif` }}
                  >
                    {v.fontFamily}: The quick brown fox
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
