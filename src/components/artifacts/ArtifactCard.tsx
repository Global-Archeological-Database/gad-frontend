import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { ArtifactImage } from "@/components/artifacts/ArtifactImage";
import type { Artifact } from "@/types/artifact";

// Age → color mapping (museum catalog accent colors)
const AGE_COLORS: Record<string, string> = {
  Ancient: "#B8860B",
  Medieval: "#722F37",
  "Early Modern": "#2D5A27",
  Modern: "#4A6FA5",
};

function getAgeColor(age?: string): string {
  if (!age) return "#888780";
  return AGE_COLORS[age] ?? "#888780";
}

// Condition badge variant mapping
const CONDITION_VARIANTS: Record<Artifact["condition"], string> = {
  Excellent: "bg-green-50 text-green-700 border-green-200",
  Good: "bg-blue-50 text-blue-700 border-blue-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
  Poor: "bg-orange-50 text-orange-700 border-orange-200",
  Fragmentary: "bg-red-50 text-red-700 border-red-200",
};

interface ArtifactCardProps {
  artifact: Artifact;
  adminMode?: boolean;
  onDelete?: (artifact: Artifact) => void;
}

export default function ArtifactCard({ artifact, adminMode, onDelete }: ArtifactCardProps) {
  const cardContent = (
    <>
      {/* IMAGE ZONE — ~65% of card height via aspect-[4/3] */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ArtifactImage
          src={artifact.thumbnail_url || artifact.image_url || ""}
          alt={artifact.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Age color accent bar at very top of image */}
        <div
          className="absolute top-0 left-0 right-0 h-1 z-10"
          style={{ backgroundColor: getAgeColor(artifact.age) }}
        />

        {/* Badges top-right */}
        <div className="absolute top-3 right-3 flex flex-wrap flex-col gap-1 z-10">
          {artifact.is_3d && (
            <Badge className="bg-primary/90 text-white text-[10px] px-1.5 py-0.5 backdrop-blur-sm border-none uppercase tracking-wider">
              3D
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0.5 border",
              CONDITION_VARIANTS[artifact.condition],
            )}
          >
            {artifact.condition}
          </Badge>
        </div>

        {/* Hover overlay — "View Details" */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 z-10">
          <span className="text-white text-xs font-medium tracking-widest uppercase">
            View Details
          </span>
        </div>
      </div>

      {/* METADATA ZONE — ~35% of card height */}
      <div className="p-3 space-y-1">
        <h3 className="font-display font-semibold text-sm leading-snug text-foreground line-clamp-2">
          {artifact.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: getAgeColor(artifact.age) }}
          />
          <span className="truncate">{artifact.age || "Period unknown"}</span>
          {(artifact.location?.country || artifact.country) && (
            <>
              <span className="text-secondary/60">·</span>
              <span className="truncate">
                {artifact.location?.country || artifact.country}
              </span>
            </>
          )}
        </div>
        {/* Uploader name shown in admin mode */}
        {adminMode && (
          <p className="text-[11px] text-muted-foreground truncate pt-0.5 border-t border-secondary/20 mt-1">
            by {artifact.uploader_name || artifact.uploader_email}
          </p>
        )}
      </div>
    </>
  );

  if (adminMode) {
    return (
      <div className="group relative">
        <div className="block rounded-xl overflow-hidden bg-card border border-secondary/40 shadow-warm-sm card-hover">
          {cardContent}
        </div>

        {/* Delete button overlay — visible on hover */}
        {onDelete && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <Button
              variant="destructive"
              size="sm"
              className="bg-destructive/90 hover:bg-destructive shadow-warm-sm text-destructive-foreground h-10 w-10 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(artifact);
              }}
              aria-label="Delete artifact"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/artifacts/${artifact.id}`}
      className="group block relative rounded-xl overflow-hidden bg-card border border-secondary/40 shadow-warm-sm hover:shadow-warm-lg transition-all duration-300 ease-out-quart hover:-translate-y-1 cursor-pointer"
    >
      {cardContent}
    </Link>
  );
}
