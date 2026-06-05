import ArtifactCard from "./ArtifactCard";
import type { Artifact } from "@/types/artifact";

interface ArtifactGridProps {
  artifacts: Artifact[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg overflow-hidden animate-pulse"
      style={{ backgroundColor: "#FDFAF5", border: "1px solid #D4C5A9" }}
    >
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ArtifactGrid({ artifacts, isLoading }: ArtifactGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (artifacts.length === 0) {
    return (
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
          style={{ color: "#D4C5A9" }}
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          <path d="M10 9H8" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
        <h3 className="text-lg font-semibold" style={{ color: "#1A1208" }}>
          No artifacts found
        </h3>
        <p className="text-sm mt-1" style={{ color: "#8B7355" }}>
          Try adjusting your filters or check back later for new additions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.id} artifact={artifact} />
      ))}
    </div>
  );
}
