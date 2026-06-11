'use client';

import { useState, useMemo } from 'react';
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
import type { UserProfile } from '@/types/user';

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
          className="rounded-xl border border-secondary/40 bg-white p-4 shadow-warm-xs"
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
}: {
  users: UserProfile[];
  onRoleChange: (uid: string, role: 'user' | 'admin') => void;
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

  return (
    <div className="rounded-xl border border-secondary/40 overflow-hidden shadow-warm-xs bg-white">
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

      {/* Table */}
      <div className="overflow-x-auto">
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
            {filteredUsers.map((user, idx) => (
              <tr
                key={user.uid}
                className={cn(
                  'border-b border-secondary/20 transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-muted/10',
                  'hover:bg-muted/20',
                )}
              >
                {/* User column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {(user.display_name || user.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.display_name || 'No name set'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role column */}
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={(role) =>
                      onRoleChange(user.uid, role as 'user' | 'admin')
                    }
                    disabled={user.uid === currentUser?.uid}
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
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {search ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Users Tab ─── */

function UsersTab() {
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
      toast.success('User role updated successfully');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    },
  });

  const users = data?.users ?? [];

  const handleRoleChange = (uid: string, role: 'user' | 'admin') => {
    updateRoleMutation.mutate({ uid, role });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return <UsersTable users={users} onRoleChange={handleRoleChange} />;
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
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">No artifacts found.</p>
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
      toast.success('Artifact deleted by admin');
    },
    onError: (err) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete artifact';
      toast.error(message);
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
              className="rounded-xl overflow-hidden bg-white border border-secondary/40"
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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

/* ─── Admin Page ─── */

export default function AdminPage() {
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className="data-[state=active]:bg-white data-[state=active]:shadow-warm-xs rounded-md text-sm"
            >
              Users{' '}
              <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none">
                {userCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="artifacts"
              className="data-[state=active]:bg-white data-[state=active]:shadow-warm-xs rounded-md text-sm"
            >
              Artifacts{' '}
              <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none">
                {artifactCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="artifacts">
            <AllArtifactsTab />
          </TabsContent>
        </Tabs>
      </main>
    </AuthGuard>
  );
}
