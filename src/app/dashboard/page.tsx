'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DatabaseIcon,
  SparklesIcon,
  GlobeIcon,
  EyeIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ArchiveIcon,
} from 'lucide-react';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
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

/* ─── Helpers ─── */

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getUniqueCountries(artifacts: Artifact[]): number {
  const countries = new Set<string>();
  artifacts.forEach((a) => {
    const c = a.location?.country || a.country;
    if (c) countries.add(c);
  });
  return countries.size;
}

/* ─── WelcomeHeader ─── */

function WelcomeHeader({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const initial = (user.display_name || user.email)[0].toUpperCase();

  return (
    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-secondary/40">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-[#8B6914] flex items-center justify-center shadow-warm-md text-white font-display font-bold text-2xl">
        {initial}
      </div>

      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {user.display_name ? `${user.display_name}'s Collection` : 'My Collection'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Member since {formatDate(user.created_at)}
        </p>
      </div>
    </div>
  );
}

/* ─── StatsRow ─── */

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatsRow({ artifacts }: { artifacts: Artifact[] }) {
  const totalArtifacts = artifacts.length;
  const analyzed = artifacts.filter((a) => a.ai_analysis).length;
  const uniqueCountries = getUniqueCountries(artifacts);
  const totalViews = artifacts.reduce((sum, a) => sum + (a.view_count || 0), 0);

  const stats: StatItem[] = [
    { label: 'Total Artifacts', value: totalArtifacts, icon: DatabaseIcon, color: 'bg-primary/10 text-primary' },
    { label: 'With AI Analysis', value: analyzed, icon: SparklesIcon, color: 'bg-primary/10 text-primary' },
    { label: 'Countries', value: uniqueCountries, icon: GlobeIcon, color: 'bg-primary/10 text-primary' },
    { label: 'Total Views', value: totalViews, icon: EyeIcon, color: 'bg-primary/10 text-primary' },
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
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── UserArtifactGrid ─── */

function UserArtifactGrid({
  artifacts,
  onEdit,
  onDelete,
}: {
  artifacts: Artifact[];
  onEdit: (a: Artifact) => void;
  onDelete: (a: Artifact) => void;
}) {
  if (artifacts.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ArchiveIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-1">
          Your collection awaits
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          You haven't submitted any artifacts yet. Every great collection
          starts with a single find.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all shadow-warm-sm"
        >
          Submit Your First Artifact
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {artifacts.map((artifact) => (
        <div key={artifact.id} className="group relative">
          <ArtifactCard artifact={artifact} />

          {/* Edit/Delete overlay — visible on group-hover */}
          <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(artifact)}
              className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-warm-sm text-foreground hover:bg-white transition-all duration-150 hover:shadow-warm-md"
              aria-label="Edit artifact"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <button
                    className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-warm-sm text-destructive hover:bg-destructive/10 transition-all duration-150"
                    aria-label="Delete artifact"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    Delete &ldquo;{artifact.title}&rdquo;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this artifact from the database.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(artifact)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Artifact
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── ProfileSettings ─── */

function ProfileSettings({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [showNamePublicly, setShowNamePublicly] = useState(
    user.settings?.show_name_publicly ?? true
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        display_name: displayName,
        settings: { show_name_publicly: showNamePublicly },
      });
      const updatedProfile = await authApi.getProfile();
      useAuthStore.getState().setUser(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-xs overflow-hidden sticky top-20">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/20 border-b border-secondary/30">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Profile Settings
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Display Name
          </Label>
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-9 text-sm"
              placeholder="Your name"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleSave}
              disabled={displayName === user.display_name || saving}
              className="h-9 shrink-0"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Show name publicly toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Public name</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Show your name on submitted artifacts
            </p>
          </div>
          <Switch
            checked={showNamePublicly}
            onCheckedChange={setShowNamePublicly}
            className="data-[state=checked]:bg-primary shrink-0 mt-0.5"
          />
        </div>

        <div className="pt-2 border-t border-secondary/30">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Email: </span>
            {user.email}
          </p>
        </div>
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
  });

  const handleDelete = (artifact: Artifact) => {
    deleteMutation.mutate(artifact.id);
  };

  const handleEdit = (artifact: Artifact) => {
    setEditingArtifact(artifact);
    setIsSubmitFormOpen(true);
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <WelcomeHeader user={user} />

        {/* Stats row */}
        <StatsRow artifacts={myArtifacts} />

        {/* Main content — 2 columns on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 mt-8">
          {/* Left: User's artifacts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">
                My Artifacts
              </h2>
              <Link
                href="/submit"
                className="inline-flex items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/5 h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all"
              >
                <PlusIcon className="h-4 w-4" />
                Add Artifact
              </Link>
            </div>

            {isLoadingArtifacts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
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
              <UserArtifactGrid
                artifacts={myArtifacts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </section>

          {/* Right: Profile settings */}
          <aside>
            <ProfileSettings user={user} />
          </aside>
        </div>
      </main>

      {/* Edit Artifact Form (reuses the submit form via Sheet) */}
      {editingArtifact && <ArtifactSubmitForm />}
    </AuthGuard>
  );
}
