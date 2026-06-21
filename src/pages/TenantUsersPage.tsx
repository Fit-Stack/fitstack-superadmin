import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  userService,
  TenantUser,
  ASSIGNABLE_ROLES,
} from '@/services/user.service';
import { tenantService } from '@/services/tenant.service';
import { useToast } from '@/contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, UserPlus, Trash2, Users } from 'lucide-react';

export default function TenantUsersPage() {
  const { id } = useParams();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // assign form
  const [assignUserId, setAssignUserId] = useState('');
  const [assignRole, setAssignRole] = useState('member');
  const [assigning, setAssigning] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const [res, tenant] = await Promise.all([
        userService.listByTenant(id),
        tenantService.getById(id),
      ]);
      setUsers(res.users || []);
      setTenantName(tenant.name);
    } catch (err: any) {
      showError('Failed to load users', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const changeRole = async (userId: string, role: string) => {
    if (!id) return;
    setBusyId(userId);
    try {
      await userService.changeRole(userId, id, role);
      success('Role updated', `Role set to ${role}.`);
      await load();
    } catch (err: any) {
      showError('Failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (userId: string) => {
    if (!id) return;
    setBusyId(userId);
    try {
      await userService.removeFromTenant(userId, id);
      success('Removed', 'User removed from this tenant.');
      await load();
    } catch (err: any) {
      showError('Failed', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !assignUserId.trim()) return;
    setAssigning(true);
    try {
      await userService.assign(assignUserId.trim(), id, assignRole);
      success('Assigned', 'User assigned to tenant.');
      setAssignUserId('');
      await load();
    } catch (err: any) {
      showError('Failed', err.response?.data?.message || err.message);
    } finally {
      setAssigning(false);
    }
  };

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
            {tenantName} — Users
          </h1>
          <p className="text-xs text-gray-500">{users.length} user(s)</p>
        </div>
      </div>

      {/* Assign existing user */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Assign existing user
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={assign} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Supabase user ID (UUID)"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="flex-1"
              disabled={assigning}
            />
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              disabled={assigning}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={assigning || !assignUserId.trim()}>
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            The user must already exist in Supabase Auth. This grants them access
            to this tenant with the chosen role.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No users in this tenant yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {u.fullName || u.email}
                    </p>
                    {u.isActive === false && (
                      <Badge variant="secondary">Unconfirmed</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  <p className="text-[10px] text-gray-400 truncate">{u.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={u.role || 'member'}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    disabled={busyId === u.id}
                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-sm"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeUser(u.id)}
                    disabled={busyId === u.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
