'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactGrid from '@/components/artifacts/ArtifactGrid';
import ArtifactSubmitForm from '@/components/artifacts/ArtifactSubmitForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { artifactsApi, authApi } from '@/lib/api';
import { artifactKeys } from '@/hooks/useArtifacts';
import type { Artifact } from '@/types/artifact';

/* ─── Dashboard Artifact Card (with Edit/Delete overlays) ─── */
function DashboardArtifactCard({
  artifact,
  onEdit,
  onDelete,
}: {
  artifact: Artifact;
  onEdit: (a: Artifact) => void;
  onDelete: (a: Artifact) => void;
}) {
  return (
    <div className="relative group">
      {/* The card itself is wrapped in a div so overlays can be positioned */}
      <div className="block rounded-lg overflow-hidden transition-shadow duration-300 group-hover:shadow-lg"
        style={{ backgroundColor: "#FDFAF5", border: "1px solid #D4C5A9" }}
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
          <h3 className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
            {artifact.title}
          </h3>
          <p className="text-xs" style={{ color: "#8B7355" }}>
            {artifact.age}
            {artifact.cultural_origin ? ` · ${artifact.cultural_origin}` : ''}
          </p>
        </div>
      </div>

      {/* Overlay action buttons — visible on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="secondary"
          size="icon-sm"
          className="bg-white/90 hover:bg-white shadow-sm"
          onClick={() => onEdit(artifact)}
          aria-label="Edit artifact"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          className="bg-red-500/90 hover:bg-red-600 shadow-sm text-white"
          onClick={() => onDelete(artifact)}
          aria-label="Delete artifact"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setIsSubmitFormOpen = useUiStore((s) => s.setIsSubmitFormOpen);

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.display_name ?? '');
  const [showNamePublicly, setShowNamePublicly] = useState(
    user?.settings?.show_name_publicly ?? true
  );
  const [profileSaving, setProfileSaving] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Artifact | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Edit state — which artifact is being edited
  const [editingArtifact, setEditingArtifact] = useState<Artifact | null>(null);

  // Fetch user's artifacts
  const myArtifactsQuery = useQuery({
    queryKey: artifactKeys.list({ uploader_id: user?.uid ?? '' }),
    queryFn: () => artifactsApi.list({ uploader_id: user?.uid ?? '', limit: '500' }),
    enabled: !!user?.uid,
    staleTime: 30000,
  });

  const myArtifacts = myArtifactsQuery.data?.artifacts ?? [];
  const isLoadingArtifacts = myArtifactsQuery.isLoading;

  // Stats
  const totalArtifacts = myArtifacts.length;
  const withAnalysis = myArtifacts.filter((a) => a.ai_analysis).length;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => artifactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      toast.success('Artifact deleted successfully');
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

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleDeleteClick = (artifact: Artifact) => {
    setDeleteTarget(artifact);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (artifact: Artifact) => {
    setEditingArtifact(artifact);
    setIsSubmitFormOpen(true);
  };

  // Profile save
  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await authApi.updateProfile({
        display_name: displayName,
        settings: {
          show_name_publicly: showNamePublicly,
        },
      });
      // Refresh user profile in auth store
      const updatedProfile = await authApi.getProfile();
      useAuthStore.getState().setUser(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen pt-16" style={{ backgroundColor: '#FDFAF5' }}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
          {/* ── Welcome Heading ── */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1A1208' }}>
              Welcome, {user?.display_name || user?.email || 'Explorer'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#8B7355' }}>
              Manage your artifacts and profile settings.
            </p>
          </div>

          {/* ── Account Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D4C5A9' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8B7355' }}>
                Total Artifacts
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1A1208' }}>
                {totalArtifacts}
              </p>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D4C5A9' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8B7355' }}>
                With AI Analysis
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1A1208' }}>
                {withAnalysis}
              </p>
            </div>
            <div
              className="rounded-lg border p-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D4C5A9' }}
            >
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: '#8B7355' }}>
                Pending Analysis
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1A1208' }}>
                {totalArtifacts - withAnalysis}
              </p>
            </div>
          </div>

          {/* ── My Artifacts ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#1A1208' }}>
                My Artifacts
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="text-[#B8860B] border-[#D4C5A9]"
                onClick={() => router.push('/submit')}
              >
                + New Artifact
              </Button>
            </div>

            {isLoadingArtifacts ? (
              <ArtifactGrid artifacts={[]} isLoading={true} />
            ) : myArtifacts.length === 0 ? (
              <div className="text-center py-16">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-4"
                  style={{ color: '#D4C5A9' }}
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
                <h3 className="text-lg font-semibold" style={{ color: '#1A1208' }}>
                  No artifacts yet
                </h3>
                <p className="text-sm mt-1" style={{ color: '#8B7355' }}>
                  Start by submitting your first artifact.
                </p>
                <Button
                  className="mt-4"
                  style={{ backgroundColor: '#B8860B' }}
                  onClick={() => router.push('/submit')}
                >
                  Submit Artifact
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myArtifacts.map((artifact) => (
                  <DashboardArtifactCard
                    key={artifact.id}
                    artifact={artifact}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Profile Settings ── */}
          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1A1208' }}>
              Profile Settings
            </h2>
            <div
              className="rounded-lg border p-6 max-w-md space-y-4"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#D4C5A9' }}
            >
              {/* Display Name */}
              <div className="space-y-1">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              {/* Show Name Publicly toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-name-publicly">Show name publicly</Label>
                  <p className="text-xs text-muted-foreground">
                    Display your name on artifact cards you upload.
                  </p>
                </div>
                <Switch
                  id="show-name-publicly"
                  checked={showNamePublicly}
                  onCheckedChange={(checked) => setShowNamePublicly(checked)}
                />
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={profileSaving}
                style={{ backgroundColor: '#B8860B' }}
                className="text-white"
              >
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* Edit Artifact Form (reuses the submit form via Sheet) */}
      {editingArtifact && <ArtifactSubmitForm />}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;. This action cannot be undone.
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
    </AuthGuard>
  );
}
