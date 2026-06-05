import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import StaticMap from "@/components/artifacts/StaticMap";
import { formatDate } from "@/lib/utils";
import type { Artifact } from "@/types/artifact";
import type { Metadata } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const conditionColors: Record<Artifact["condition"], string> = {
  Excellent: "bg-green-100 text-green-800 border-green-300",
  Good: "bg-blue-100 text-blue-800 border-blue-300",
  Fair: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Poor: "bg-orange-100 text-orange-800 border-orange-300",
  Fragmentary: "bg-red-100 text-red-800 border-red-300",
};

async function fetchArtifact(id: string): Promise<Artifact | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/artifacts/${id}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const artifact = await fetchArtifact(id);

  if (!artifact) {
    return { title: "Artifact Not Found — Global Archaeological Database" };
  }

  const description = artifact.description
    ? artifact.description.slice(0, 155) + (artifact.description.length > 155 ? "…" : "")
    : `A ${artifact.age} artifact from ${artifact.cultural_origin || "an unknown origin"}.`;

  return {
    title: `${artifact.title} — Global Archaeological Database`,
    description,
    openGraph: {
      title: artifact.title,
      description,
      ...(artifact.image_url ? { images: [{ url: artifact.image_url }] } : {}),
    },
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ArchiveComponent",
        name: artifact.title,
        description: artifact.description,
        ...(artifact.image_url ? { image: artifact.image_url } : {}),
        ...(artifact.location?.country
          ? { locationCreated: artifact.location.country }
          : {}),
        dateCreated: artifact.created_at
          ? typeof artifact.created_at === "object" && "_seconds" in artifact.created_at
            ? new Date(
                (artifact.created_at as { _seconds: number; _nanoseconds: number })._seconds *
                  1000
              ).toISOString()
            : artifact.created_at
          : undefined,
        material: artifact.materials,
        condition: artifact.condition,
      }),
    },
  };
}

export default async function ArtifactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const artifact = await fetchArtifact(id);

  if (!artifact) {
    notFound();
  }

  // Backend stores coordinates at top level (latitude/longitude) and optionally in location.coordinates
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude;
  const mapSrc = lat && lng
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=400x200&markers=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}`
    : null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" style={{ color: "#8B7355" }}>
          <Link href="/artifacts" className="hover:underline" style={{ color: "#B8860B" }}>
            Artifact Gallery
          </Link>
          <span className="mx-2">/</span>
          <span>{artifact.title}</span>
        </nav>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column — image & map */}
          <div>
            {/* Main image */}
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
              {artifact.image_url ? (
                <Image
                  src={artifact.image_url}
                  alt={artifact.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
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

            {/* Static map */}
            {mapSrc && (
              <div className="mt-4 rounded-lg overflow-hidden border" style={{ borderColor: "#D4C5A9" }}>
                <StaticMap
                  src={mapSrc}
                  alt={`Map showing ${artifact.title} location`}
                />
              </div>
            )}
          </div>

          {/* Right column — metadata */}
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#1A1208" }}>
              {artifact.title}
            </h1>

            <p className="text-sm mb-4" style={{ color: "#8B7355" }}>
              {artifact.age}
              {artifact.cultural_origin ? ` · ${artifact.cultural_origin}` : ""}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {artifact.is_3d && (
                <Badge variant="secondary" className="bg-purple-600 text-white border-none">
                  3D
                </Badge>
              )}
              <Badge
                variant="outline"
                className={conditionColors[artifact.condition]}
              >
                {artifact.condition}
              </Badge>
            </div>

            {/* Materials */}
            {artifact.materials.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A1208" }}>
                  Materials
                </h3>
                <div className="flex flex-wrap gap-1">
                  {artifact.materials.map((material) => (
                    <span
                      key={material}
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: "#FDFAF5",
                        borderColor: "#D4C5A9",
                        color: "#8B7355",
                      }}
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            {(artifact.location || artifact.country) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A1208" }}>
                  Location
                </h3>
                <p className="text-sm" style={{ color: "#8B7355" }}>
                  {artifact.location
                    ? [artifact.location.city, artifact.location.state, artifact.location.country]
                        .filter(Boolean)
                        .join(", ") +
                      (artifact.location.region ? ` (${artifact.location.region})` : "")
                    : artifact.country}
                </p>
              </div>
            )}

            {/* Description */}
            {artifact.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-1" style={{ color: "#1A1208" }}>
                  Description
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#4A3728" }}>
                  {artifact.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {artifact.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#1A1208" }}>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {artifact.tags.map((tag) => (
                    <Link key={tag} href={`/artifacts?tag=${encodeURIComponent(tag)}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100 transition-colors"
                        style={{ borderColor: "#D4C5A9", color: "#8B7355" }}
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Uploader info */}
            <div className="text-xs space-y-1 mb-6" style={{ color: "#8B7355" }}>
              <p>
                Uploaded by{" "}
                <span className="font-medium" style={{ color: "#1A1208" }}>
                  {artifact.uploader_name || artifact.uploader_email}
                </span>
              </p>
              <p>Added {formatDate(artifact.created_at)}</p>
              {artifact.updated_at !== artifact.created_at && (
                <p>Updated {formatDate(artifact.updated_at)}</p>
              )}
              <p>{artifact.view_count} views</p>
            </div>

            {/* Placeholder sections */}
            <div
              className="rounded-lg p-4 mb-4 border text-center"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#D4C5A9" }}
            >
              <p className="text-sm font-medium" style={{ color: "#B8860B" }}>
                🔍 AI Analysis
              </p>
              <p className="text-xs mt-1" style={{ color: "#8B7355" }}>
                Login to use AI features
              </p>
            </div>

            <div
              className="rounded-lg p-4 border text-center"
              style={{ backgroundColor: "#FFFFFF", borderColor: "#D4C5A9" }}
            >
              <p className="text-sm font-medium" style={{ color: "#B8860B" }}>
                🔗 Similar Artifacts
              </p>
              <p className="text-xs mt-1" style={{ color: "#8B7355" }}>
                Login to use AI features
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
