export default function ArtifactDetailLoading() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48 mb-6" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column — image skeleton */}
          <div>
            <div className="aspect-[4/3] bg-gray-200 rounded-lg" />
            {/* Map skeleton */}
            <div className="mt-4 h-40 bg-gray-200 rounded-lg" />
          </div>

          {/* Right column — metadata skeleton */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="pt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
