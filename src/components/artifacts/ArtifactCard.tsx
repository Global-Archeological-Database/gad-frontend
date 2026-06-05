import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Artifact } from "@/types/artifact";

const conditionColors: Record<Artifact["condition"], string> = {
  Excellent: "bg-green-100 text-green-800 border-green-300",
  Good: "bg-blue-100 text-blue-800 border-blue-300",
  Fair: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Poor: "bg-orange-100 text-orange-800 border-orange-300",
  Fragmentary: "bg-red-100 text-red-800 border-red-300",
};

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  return (
    <Link
      href={`/artifacts/${artifact.id}`}
      className="group block rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-lg"
      style={{ backgroundColor: "#FDFAF5", border: "1px solid #D4C5A9" }}
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        {artifact.image_url ? (
          <Image
            src={artifact.image_url}
            alt={artifact.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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

        {/* 3D badge */}
        {artifact.is_3d && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 bg-purple-600 text-white border-none"
          >
            3D
          </Badge>
        )}

        {/* Condition badge */}
        <Badge
          variant="outline"
          className={`absolute top-2 right-2 ${conditionColors[artifact.condition]}`}
        >
          {artifact.condition}
        </Badge>
      </div>

      {/* Content area */}
      <div className="p-3 space-y-1">
        <h3 className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
          {artifact.title}
        </h3>
        <p className="text-xs" style={{ color: "#8B7355" }}>
          {artifact.age}
          {artifact.cultural_origin ? ` · ${artifact.cultural_origin}` : ""}
        </p>
      </div>
    </Link>
  );
}
