import { Skeleton } from '@/components/ui/WarmSkeleton'

export function ArtifactCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-secondary/20 bg-card shadow-warm-xs">
      {/* Image zone */}
      <div className="aspect-[4/3]">
        <Skeleton className="w-full h-full" rounded="sm" />
      </div>
      {/* Metadata zone */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  )
}
