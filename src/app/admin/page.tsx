'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldIcon,
  UsersIcon,
  ArchiveIcon,
  FlagIcon,
  ActivityIcon,
  SearchIcon,
  ExternalLinkIcon,
  SettingsIcon,
  UserCheckIcon,
  UploadIcon,
  CrownIcon,
  PackageOpenIcon,
  InboxIcon,
} from 'lucide-react';
import Link from 'next/link';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { adminApi, artifactsApi } from '@/lib/api';
import { artifactKeys } from '@/hooks/useArtifacts';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Artifact } from '@/types/artifact';
import type { UserProfile, AdminSettings } from '@/types/user';

/* ─── Quick Stats ─── */

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function QuickStats({
  userCount,
  artifactCount,
}: {
  userCount: number;
  artifactCount: number;
}) {
  const stats: StatItem[] = [
    {
      label: 'Total Users',
      value: userCount,
      icon: UsersIcon,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total Artifacts',
      value: artifactCount,
      icon: ArchiveIcon,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Reported',
      value: 0,
      icon: FlagIcon,
      color: 'bg-destructive/10 text-destructive',
    },
    {
      label: "Today's Activity",
      value: 0,
      icon: ActivityIcon,
      color: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="rounded-xl border border-secondary/40 bg-card p-4 shadow-warm-xs"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                color,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Users Table ─── */

function UsersTable({
  users,
  onRoleChange,
  currentUserRole,
}: {
  users: UserProfile[];
  onRoleChange: (uid: string, role: 'user' | 'admin') => void;
  currentUserRole?: string;
}) {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)),
    );
  }, [users, search]);

  const isOwner = currentUserRole === 'owner';

  return (
    <div className="rounded-xl border border-secondary/40 overflow-hidden shadow-warm-xs bg-card">
      {/* Table search */}
      <div className="p-4 border-b border-secondary/30 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table — hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-secondary/30 bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Joined
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
                      <UsersIcon className="h-7 w-7" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                      {search ? 'No users match your search' : 'No users yet'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-6">
                      {search
                        ? 'Try adjusting your search terms to find what you\'re looking for.'
                        : 'Users who sign up for the platform will appear here.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr
                  key={user.uid}
                  className={cn(
                    'border-b border-secondary/20 transition-colors',
                    idx % 2 === 0 ? 'bg-card' : 'bg-muted/10',
                    'hover:bg-muted/20',
                  )}
                >
                  {/* User column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0',
                          user.role === 'owner'
                            ? 'bg-amber-100 text-amber-700'
                            : user.role === 'admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {(user.display_name || user.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                          {user.display_name || 'No name set'}
                          {user.role === 'owner' && (
                            <CrownIcon className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role column */}
                  <td className="px-4 py-3">
                    {user.role === 'owner' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <CrownIcon className="h-3 w-3" />
                        Owner
                      </span>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          onRoleChange(user.uid, role as 'user' | 'admin')
                        }
                        disabled={!isOwner || user.uid === currentUser?.uid}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-7 text-xs w-24 rounded-full border',
                            user.role === 'admin'
                              ? 'border-primary/40 bg-primary/5 text-primary'
                              : 'border-secondary text-muted-foreground',
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>

                  {/* Joined column */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>

                  {/* Actions column */}
                  <td className="px-4 py-3 text-right">
                    {user.uid !== currentUser?.uid && (
                      <Link
                        href={`/artifacts?uploader=${user.uid}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View artifacts
                        <ExternalLinkIcon className="h-3 w-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list — shown only on small screens */}
      <div className="md:hidden space-y-3 p-4">
        {filteredUsers.map((user) => (
          <div
            key={user.uid}
            className="rounded-xl border border-secondary/40 bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  {(user.email || user.display_name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.display_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              {user.role === 'owner' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <CrownIcon className="h-3 w-3" />
                  Owner
                </span>
              ) : (
                <Select
                  value={user.role}
                  onValueChange={(r) => onRoleChange(user.uid, r as 'user' | 'admin')}
                  disabled={!isOwner || user.uid === currentUser?.uid}
                >
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Joined {formatDate(user.created_at)}
            </p>
            {user.uid !== currentUser?.uid && (
              <Link
                href={`/artifacts?uploader=${user.uid}`}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLinkIcon className="h-3 w-3" /> View artifacts
              </Link>
            )}
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {search ? 'No users match your search.' : 'No users found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Users Tab ─── */

function UsersTab() {
  const currentUser = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
    staleTime: 30000,
  });

  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: 'user' | 'admin' }) =>
      adminApi.updateRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message, { duration: 5000 });
    },
  });

  const users = data?.users ?? [];

  const handleRoleChange = (uid: string, role: 'user' | 'admin') => {
    updateRoleMutation.mutate({ uid, role });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-secondary/40 overflow-hidden shadow-warm-xs bg-card">
        <div className="p-4 border-b border-secondary/30">
          <div className="h-8 w-48 bg-muted rounded">
            <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
          </div>
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`user-skeleton-${i}`}
              className="flex items-center gap-4 p-3 border-b border-secondary/20"
            >
              <div className="h-10 w-10 rounded-full bg-muted">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-[200px] bg-muted rounded">
                  <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
                </div>
                <div className="h-3 w-[150px] bg-muted rounded">
                  <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
                </div>
              </div>
              <div className="h-8 w-[100px] bg-muted rounded-full">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="h-8 w-[80px] bg-muted rounded">
                <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <UsersTable
      users={users}
      onRoleChange={handleRoleChange}
      currentUserRole={currentUser?.role}
    />
  );
}

/* ─── Admin Artifacts Grid ─── */

function AdminArtifactsGrid({
  artifacts,
  onDelete,
}: {
  artifacts: Artifact[];
  onDelete: (artifact: Artifact) => void;
}) {
  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
          <PackageOpenIcon className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          No artifacts in the database
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Artifacts submitted by users will appear here for review and management.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          adminMode
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

/* ─── All Artifacts Tab ─── */

function AllArtifactsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: artifactKeys.list({ limit: '500' }),
    queryFn: () => artifactsApi.list({ limit: '500' }),
    staleTime: 30000,
  });

  const [deleteTarget, setDeleteTarget] = useState<Artifact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteArtifact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      toast.success('Artifact removed from the database', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete artifact';
      toast.error(message, { duration: 5000 });
    },
    onSettled: () => {
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
    },
  });

  const artifacts = data?.artifacts ?? [];
  const count = data?.count ?? artifacts.length;

  const handleDeleteClick = (artifact: Artifact) => {
    setDeleteTarget(artifact);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-xl overflow-hidden bg-card border border-secondary/40"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
              </div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4">
                  <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
                </div>
                <div className="h-3 bg-muted rounded w-1/2">
                  <div className="h-full w-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <AdminArtifactsGrid
          artifacts={artifacts}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete &ldquo;{deleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this artifact uploaded by{' '}
              {deleteTarget?.uploader_name || deleteTarget?.uploader_email}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep artifact</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Artifact'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Admin Requests Tab ─── */

function AdminRequestsTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'requests'],
    queryFn: () => adminApi.listAdminRequests(),
    staleTime: 15000,
  });

  const approveMutation = useMutation({
    mutationFn: (uid: string) => adminApi.approveAdmin(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Admin request approved', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to approve request';
      toast.error(message, { duration: 5000 });
    },
  });

  const denyMutation = useMutation({
    mutationFn: (uid: string) => adminApi.denyAdmin(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'requests'] });
      toast.success('Admin request denied', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to deny request';
      toast.error(message, { duration: 5000 });
    },
  });

  const requests = data?.requests ?? [];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-secondary/40 bg-card p-12 text-center shadow-warm-xs">
        <UserCheckIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h3 className="font-display font-semibold text-foreground mb-1">
          No pending requests
        </h3>
        <p className="text-sm text-muted-foreground">
          Users who request admin privileges will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((user) => (
        <div
          key={user.uid}
          className="rounded-xl border border-secondary/40 bg-card p-4 shadow-warm-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm shrink-0">
              {(user.display_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {user.display_name || 'No name set'}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => denyMutation.mutate(user.uid)}
              disabled={denyMutation.isPending}
            >
              Deny
            </Button>
            <Button
              size="sm"
              onClick={() => approveMutation.mutate(user.uid)}
              disabled={approveMutation.isPending}
            >
              Approve
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Settings Tab ─── */

function SettingsTab() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
    staleTime: 30000,
  });

  const [siteName, setSiteName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when settings load
  const settingsLoaded = useRef(false);
  if (settings && !settingsLoaded.current) {
    setSiteName(settings.site_name || '');
    settingsLoaded.current = true;
  }

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: { site_name: string }) =>
      adminApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Settings updated', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update settings';
      toast.error(message, { duration: 5000 });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadLogo(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setLogoPreview(null);
      toast.success('Logo uploaded successfully', { duration: 3000 });
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to upload logo';
      toast.error(message, { duration: 5000 });
    },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview locally
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload immediately
    uploadLogoMutation.mutate(file);
  };

  const handleSaveSettings = () => {
    if (!siteName.trim()) {
      toast.error('Site name cannot be empty', { duration: 5000 });
      return;
    }
    updateSettingsMutation.mutate({ site_name: siteName.trim() });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  const currentLogo = logoPreview || settings?.logo_url;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Logo Section */}
      <div className="rounded-xl border border-secondary/40 bg-card p-6 shadow-warm-xs">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Site Logo
        </h3>

        <div className="flex items-start gap-6">
          {/* Logo preview */}
          <div className="w-24 h-24 rounded-xl bg-primary/5 border border-secondary/30 flex items-center justify-center overflow-hidden shrink-0">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Site logo preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <ShieldIcon className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">
              Upload a logo image (PNG, JPEG, WebP, or SVG). Max 2MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogoMutation.isPending}
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </div>
        </div>
      </div>

      {/* Site Name Section */}
      <div className="rounded-xl border border-secondary/40 bg-card p-6 shadow-warm-xs">
        <h3 className="font-display font-semibold text-foreground mb-4">
          Site Name
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1.5">
              Display name shown in the header logo
            </label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Global Archaeological Database"
            />
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Admin Page ─── */

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isOwner = currentUser?.role === 'owner';

  // Fetch users count for stats
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.listUsers(),
    staleTime: 30000,
  });

  // Fetch artifacts count for stats
  const { data: artifactsData } = useQuery({
    queryKey: artifactKeys.list({ limit: '1' }),
    queryFn: () => artifactsApi.list({ limit: '1' }),
    staleTime: 30000,
  });

  const userCount = usersData?.users?.length ?? 0;
  const artifactCount = artifactsData?.count ?? 0;

  return (
    <AuthGuard requireAdmin>
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin page header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-secondary/40">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Database Administration
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage users, artifacts, and database integrity
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats userCount={userCount} artifactCount={artifactCount} />

        <Tabs defaultValue="users">
          <TabsList className="bg-muted rounded-lg p-1 mb-6">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-card data-[state=active]:shadow-warm-xs rounded-md text-sm"
            >
              Users{' '}
              <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none">
                {userCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="artifacts"
              className="data-[state=active]:bg-card data-[state=active]:shadow-warm-xs rounded-md text-sm"
            >
              Artifacts{' '}
              <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none">
                {artifactCount}
              </Badge>
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-card data-[state=active]:shadow-warm-xs rounded-md text-sm"
              >
                <UserCheckIcon className="h-4 w-4 mr-1.5" />
                Requests
              </TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-card data-[state=active]:shadow-warm-xs rounded-md text-sm"
              >
                <SettingsIcon className="h-4 w-4 mr-1.5" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="artifacts">
            <AllArtifactsTab />
          </TabsContent>

          {isOwner && (
            <TabsContent value="requests">
              <AdminRequestsTab />
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </AuthGuard>
  );
}
