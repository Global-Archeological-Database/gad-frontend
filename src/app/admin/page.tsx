'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactGrid from '@/components/artifacts/ArtifactGrid';
import { Button } from '@/components/ui/button';
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
import type { Artifact } from '@/types/artifact';
import type { UserProfile } from '@/types/user';

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
      toast.success('User role updated successfully');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    },
  });

  const users = data?.users ?? [];

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: '#8B7355' }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ color: '#1A1208' }}>
        <thead>
          <tr className="border-b" style={{ borderColor: '#D4C5A9' }}>
            <th className="text-left py-3 px-4 font-medium">Email</th>
            <th className="text-left py-3 px-4 font-medium">Display Name</th>
            <th className="text-left py-3 px-4 font-medium">Role</th>
            <th className="text-left py-3 px-4 font-medium">Created</th>
            <th className="text-left py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: UserProfile) => {
            const isSelf = u.uid === currentUser?.uid;
            return (
              <tr
                key={u.uid}
                className="border-b transition-colors hover:bg-[#F5F0E8]"
                style={{ borderColor: '#D4C5A9' }}
              >
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4">{u.display_name || '—'}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs" style={{ color: '#8B7355' }}>
                  {formatDate(u.created_at)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={u.role}
                      onValueChange={(val) => {
                        if (!isSelf && (val === 'user' || val === 'admin')) {
                          updateRoleMutation.mutate({ uid: u.uid, role: val });
                        }
                      }}
                      disabled={isSelf}
                    >
                      <SelectTrigger
                        className="w-28"
                        data-disabled={isSelf || undefined}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">user</SelectItem>
                        <SelectItem value="admin">admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {isSelf && (
                      <span className="text-xs italic" style={{ color: '#8B7355' }}>
                        (you)
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: '#8B7355' }}>No users found.</p>
        </div>
      )}
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
      const message = err instanceof Error ? err.message : 'Failed to delete artifact';
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
      <p className="text-sm mb-4" style={{ color: '#8B7355' }}>
        Total artifacts: <strong style={{ color: '#1A1208' }}>{count}</strong>
      </p>

      {isLoading ? (
        <ArtifactGrid artifacts={[]} isLoading={true} />
      ) : artifacts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: '#8B7355' }}>No artifacts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {artifacts.map((artifact: Artifact) => (
            <div key={artifact.id} className="relative group">
              {/* Reuse the card look but without Link wrapper */}
              <div
                className="block rounded-lg overflow-hidden transition-shadow duration-300 group-hover:shadow-lg"
                style={{ backgroundColor: '#FDFAF5', border: '1px solid #D4C5A9' }}
              >
                {/* Image area */}
                <div className="relative aspect-square overflow-hidden bg-gray-200">
                  {artifact.image_url ? (
                    <img
                      src={artifact.image_url}
                      alt={artifact.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        <path d="M10 9H8" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content area */}
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold text-sm truncate" style={{ color: '#1A1208' }}>
                    {artifact.title}
                  </h3>
                  <p className="text-xs" style={{ color: '#8B7355' }}>
                    {artifact.age}
                    {artifact.cultural_origin ? ` · ${artifact.cultural_origin}` : ''}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#8B7355' }}>
                    by {artifact.uploader_name || artifact.uploader_email}
                  </p>
                </div>
              </div>

              {/* Delete button overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="bg-red-500/90 hover:bg-red-600 shadow-sm text-white"
                  onClick={() => handleDeleteClick(artifact)}
                  aria-label="Delete artifact"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo; uploaded by{' '}
              {deleteTarget?.uploader_name || deleteTarget?.uploader_email}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Admin Page ─── */
export default function AdminPage() {
  return (
    <AuthGuard requireAdmin>
      <main className="min-h-screen pt-16" style={{ backgroundColor: '#FDFAF5' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6" style={{ color: '#1A1208' }}>
            Admin Panel
          </h1>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="artifacts">All Artifacts</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div
                className="rounded-lg border overflow-hidden"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D4C5A9' }}
              >
                <UsersTab />
              </div>
            </TabsContent>

            <TabsContent value="artifacts">
              <AllArtifactsTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AuthGuard>
  );
}
