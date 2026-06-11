import { Skeleton } from "@/components/ui/skeleton";

export default function ArtifactDetailLoading() {
  return (
    <main className="min-h-screen bg-background">
      {/* HERO SKELETON — matches h-[55vh] max-h-[500px] min-h-[300px] */}
      <div className="relative h-[55vh] max-h-[500px] min-h-[300px] overflow-hidden bg-muted animate-pulse">
        {/* Age color accent bar skeleton */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted-foreground/10" />
      </div>

      {/* TWO-COLUMN LAYOUT SKELETON */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
          
          {/* LEFT COLUMN — narrative content */}
          <div className="space-y-8">
            {/* Description skeleton */}
            <section>
              <Skeleton className="h-7 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </section>

            {/* Tags skeleton */}
            <section>
              <Skeleton className="h-7 w-16 mb-4" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
            </section>

            {/* AI Analysis placeholder skeleton */}
            <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm p-6 min-h-[120px]">
              <Skeleton className="h-5 w-28 mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
          </div>

          {/* RIGHT COLUMN — structured data */}
          <aside className="space-y-6">
            {/* Metadata card skeleton */}
            <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm overflow-hidden">
              <div className="p-4 bg-muted/30 border-b border-secondary/30">
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="p-4 space-y-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 rounded mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location card skeleton */}
            <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm overflow-hidden">
              <div className="p-4 bg-muted/30 border-b border-secondary/30">
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-3">
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            {/* Similar artifacts skeleton */}
            <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm p-6 min-h-[100px]">
              <Skeleton className="h-5 w-28 mb-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
