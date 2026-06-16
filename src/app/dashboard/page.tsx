'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DatabaseIcon,
  SparklesIcon,
  GlobeIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  ArchiveIcon,
  PlusIcon,
  LogOutIcon,
  ArrowUpDownIcon,
  EyeOffIcon,
  SparkleIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

import AuthGuard from '@/components/auth/AuthGuard';
import ArtifactCard from '@/components/artifacts/ArtifactCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { artifactsApi, authApi } from '@/lib/api';
import { artifactKeys } from '@/hooks/useArtifacts';
import { formatDateStr } from '@/lib/utils';
import type { Artifact } from '@/types/artifact';

/* ─── Helpers ─── */

function getUniqueCountries(artifacts: Artifact[]): number {
  const countries = new Set<string>();
  artifacts.forEach((a) => {
    const c = a.location?.country || a.country;
    if (c) countries.add(c);
  });
  return countries.size;
}

/* ─── Sort options ─── */

type SortOption = 'newest' | 'oldest' | 'most-viewed' | 'has-analysis' | 'alphabetical';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'most-viewed', label: 'Most viewed' },
  { value: 'has-analysis', label: 'Has AI analysis' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

function sortArtifacts(artifacts: Artifact[], sort: SortOption): Artifact[] {
  const sorted = [...artifacts];
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    case 'oldest':
      return sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    case 'most-viewed':
      return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    case 'has-analysis':
      return sorted.sort((a, b) => {
        if (a.ai_analysis && !b.ai_analysis) return -1;
        if (!a.ai_analysis && b.ai_analysis) return 1;
        return 0;
      });
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
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
          Member since {formatDateStr(user.created_at)}
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

function StatsRow({ artifacts, isLoading }: { artifacts: Artifact[]; isLoading?: boolean }) {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`stat-skeleton-${i}`}
            className="rounded-xl border border-secondary/40 bg-card p-4 shadow-warm-xs"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-12" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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

          {/* View count badge */}
          {(artifact.view_count ?? 0) > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-background/80 backdrop-blur-sm text-[11px] text-muted-foreground shadow-warm-xs z-10">
              <EyeIcon className="h-3 w-3" />
              <span>{artifact.view_count}</span>
            </div>
          )}

          {/* AI analysis sparkle badge */}
          {artifact.ai_analysis && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50/90 dark:bg-amber-950/80 backdrop-blur-sm text-[11px] text-amber-700 dark:text-amber-300 shadow-warm-xs z-10">
              <SparkleIcon className="h-3 w-3" />
              <span>AI Analysis</span>
            </div>
          )}

          {/* Edit/Delete overlay — visible on group-hover */}
          <div className="absolute top-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => onEdit(artifact)}
              className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-warm-sm text-foreground hover:bg-background transition-all duration-150 hover:shadow-warm-md"
              aria-label="Edit artifact"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>

            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <button
                    className="p-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-warm-sm text-destructive hover:bg-destructive/10 transition-all duration-150"
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
                  <AlertDialogCancel>Keep artifact</AlertDialogCancel>
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

/* ─── ProfileCard ─── */

function ProfileCard({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const [displayName, setDisplayName] = useState(user.display_name ?? '');
  const [showNamePublicly, setShowNamePublicly] = useState(
    user.settings?.show_name_publicly ?? true
  );
  const [saving, setSaving] = useState(false);
  const initial = (user.display_name || user.email)[0].toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        display_name: displayName,
        settings: { show_name_publicly: showNamePublicly },
      });
      const updatedProfile = await authApi.getProfile();
      useAuthStore.getState().setUser(updatedProfile);
      toast.success('Profile updated', { duration: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(message, { duration: 5000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-secondary/40 bg-card shadow-warm-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted/20 border-b border-secondary/30">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Profile
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar + Email */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-[#8B6914] flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.display_name || 'Anonymous'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Joined {formatDateStr(user.created_at)}
            </p>
          </div>
        </div>

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
              disabled={displayName === (user.display_name ?? '') || saving}
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
            onCheckedChange={(checked) => {
              setShowNamePublicly(checked);
              // Auto-save on toggle
              authApi.updateProfile({
                settings: { show_name_publicly: checked },
              }).then((_data) => {
                useAuthStore.getState().setUser({
                  ...user,
                  settings: { ...user.settings, show_name_publicly: checked },
                });
                toast.success('Visibility updated', { duration: 3000 });
              }).catch(() => {
                setShowNamePublicly(!checked);
                toast.error('Failed to update visibility', { duration: 5000 });
              });
            }}
            className="data-[state=checked]:bg-primary shrink-0 mt-0.5"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── AppearanceCard ─── */

function AppearanceCard() {
  return (
    <div className="rounded-xl border border-secondary/40 bg-card shadow-warm-xs overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 border-b border-secondary/30">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Appearance
        </h2>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Switch between light, dark, and system theme
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/* ─── AccountCard ─── */

function AccountCard({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(auth);
      useAuthStore.getState().setUser(null);
      toast.success('Signed out successfully', { duration: 3000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      toast.error(message, { duration: 5000 });
      setSigningOut(false);
    }
  };

  return (
    <div className="rounded-xl border border-secondary/40 bg-card shadow-warm-xs overflow-hidden">
      <div className="px-4 py-3 bg-muted/20 border-b border-secondary/30">
        <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Role */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Role</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your account type
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-secondary/50 bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
            {user.role || 'user'}
          </span>
        </div>

        {/* Sign out */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOutIcon className="h-4 w-4" />
          {signingOut ? 'Signing out...' : 'Sign out'}
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

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Fetch user's artifacts
  const myArtifactsQuery = useQuery({
    queryKey: artifactKeys.list({ uploader_id: user?.uid ?? '' }),
    queryFn: () => artifactsApi.list({ uploader_id: user?.uid ?? '', limit: '500' }),
    enabled: !!user?.uid,
    staleTime: 30000,
  });

  const myArtifacts = myArtifactsQuery.data?.artifacts ?? [];
  const isLoadingArtifacts = myArtifactsQuery.isLoading;

  // Sort artifacts
  const sortedArtifacts = sortArtifacts(myArtifacts, sortBy);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => artifactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: artifactKeys.lists() });
      toast.success('Artifact removed from the database', { duration: 3000 });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to delete artifact';
      toast.error(message, { duration: 5000 });
    },
  });

  const handleDelete = (artifact: Artifact) => {
    deleteMutation.mutate(artifact.id);
  };

  const handleEdit = (artifact: Artifact) => {
    // Navigate to submit page with edit context
    router.push(`/submit?edit=${artifact.id}`);
  };

  if (!user) return null;

  return (
    <AuthGuard>
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <WelcomeHeader user={user} />

        {/* Stats row */}
        <StatsRow artifacts={myArtifacts} isLoading={isLoadingArtifacts} />

        {/* Main content — 2 columns on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 mt-8">
          {/* Left: User's artifacts */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold">
                My Artifacts
              </h2>
              <div className="flex items-center gap-2">
                {/* Sort dropdown */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-8 gap-1.5 px-2.5 text-sm w-[140px]">
                    <ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/5 h-8 gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap transition-all"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Artifact
                </Link>
              </div>
            </div>

            {isLoadingArtifacts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
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
              <UserArtifactGrid
                artifacts={sortedArtifacts}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </section>

          {/* Right sidebar: Profile, Appearance, Account cards */}
          <aside className="space-y-4">
            <ProfileCard user={user} />
            <AppearanceCard />
            <AccountCard user={user} />
          </aside>
        </div>
      </main>
    </AuthGuard>
  );
}
