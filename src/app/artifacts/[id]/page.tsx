import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  CalendarIcon,
  GlobeIcon,
  ShieldIcon,
  LayersIcon,
  EyeIcon,
  UserIcon,
  ClockIcon,
} from "lucide-react";
import StaticMap from "@/components/artifacts/StaticMap";
import ArtifactAISection from "@/components/artifacts/ArtifactAISection";
import SimilarArtifactsSection from "@/components/artifacts/SimilarArtifactsSection";
import { ArtifactImage } from "@/components/artifacts/ArtifactImage";
import { getAgeColor } from "@/lib/ageColor";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/types/artifact";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const conditionStyles: Record<string, { bg: string; text: string; border: string }> = {
  Excellent: { bg: "bg-green-50", text: "text-green-700", border: "border-green-300" },
  Good: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-300" },
  Fair: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-300" },
  Poor: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-300" },
  Fragmentary: { bg: "bg-red-50", text: "text-red-700", border: "border-red-300" },
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

  const truncatedDescription = artifact.description
    ? artifact.description.slice(0, 155) + (artifact.description.length > 155 ? "…" : "")
    : `A ${artifact.age || "period unknown"} artifact from ${artifact.cultural_origin || "an unknown origin"}.`;

  const hasGeo =
    artifact.location?.coordinates?.latitude && artifact.location?.coordinates?.longitude;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ArchiveComponent",
    name: artifact.title,
    description: artifact.description,
    keywords: artifact.tags?.join(", ") || "",
    material: artifact.materials?.join(", ") || "",
    ...(artifact.image_url ? { image: artifact.image_url } : {}),
    ...(artifact.location?.city || artifact.location?.country
      ? {
          locationCreated: {
            "@type": "Place",
            name: [artifact.location?.city, artifact.location?.country]
              .filter(Boolean)
              .join(", "),
            ...(hasGeo
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: artifact.location!.coordinates!.latitude,
                    longitude: artifact.location!.coordinates!.longitude,
                  },
                }
              : {}),
          },
        }
      : {}),
    dateCreated: artifact.created_at
      ? typeof artifact.created_at === "object" && "_seconds" in artifact.created_at
        ? new Date(
            (artifact.created_at as { _seconds: number; _nanoseconds: number })._seconds * 1000
          ).toISOString()
        : artifact.created_at
      : undefined,
    condition: artifact.condition,
  };

  return {
    title: `${artifact.title} | GAD`,
    description: truncatedDescription,
    openGraph: {
      title: artifact.title,
      description: truncatedDescription,
      ...(artifact.image_url ? { images: [{ url: artifact.image_url }] } : {}),
    },
    other: {
      "application/ld+json": JSON.stringify(jsonLd),
    },
  };
}

export default async function ArtifactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const artifact = await fetchArtifact(id);

  if (!artifact) {
    notFound();
  }

  const ageColor = getAgeColor(artifact.age);
  const conditionStyle = conditionStyles[artifact.condition] || conditionStyles.Fair;

  // Resolve coordinates from either top-level or nested location
  const lat = artifact.latitude ?? artifact.location?.coordinates?.latitude ?? null;
  const lng = artifact.longitude ?? artifact.location?.coordinates?.longitude ?? null;

  const locationParts = [
    artifact.location?.city,
    artifact.location?.state,
    artifact.location?.country,
  ].filter(Boolean);

  // Metadata rows for the details card
  const metadataRows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null }[] = [
    {
      icon: MapPinIcon,
      label: "Origin",
      value: [artifact.location?.city, artifact.location?.country]
        .filter(Boolean)
        .join(", ") || null,
    },
    { icon: CalendarIcon, label: "Period", value: artifact.age },
    { icon: GlobeIcon, label: "Civilization", value: artifact.cultural_origin },
    { icon: ShieldIcon, label: "Condition", value: artifact.condition },
    {
      icon: LayersIcon,
      label: "Materials",
      value: artifact.materials?.length ? artifact.materials.join(", ") : null,
    },
    {
      icon: EyeIcon,
      label: "Views",
      value: artifact.view_count?.toLocaleString() || null,
    },
    {
      icon: UserIcon,
      label: "Submitted by",
      value: artifact.uploader_name || "Anonymous",
    },
    {
      icon: ClockIcon,
      label: "Added",
      value: artifact.created_at ? formatDate(artifact.created_at) : null,
    },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-background">
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/artifacts" className="hover:text-foreground transition-colors">
              Collection
            </Link>
          </li>
          <li><ChevronRightIcon className="h-3 w-3" aria-hidden="true" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]" aria-current="page">
            {artifact.title}
          </li>
        </ol>
      </nav>
      <article className="max-w-7xl mx-auto">
        {/* ===== HERO SECTION ===== */}
        <div className="relative">
          {/* Back navigation */}
          <div className="absolute top-4 left-4 z-10">
            <Link
              href="/artifacts"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         bg-white/80 backdrop-blur-sm text-xs font-medium
                         text-foreground shadow-warm-sm hover:bg-white
                         hover:shadow-warm-md transition-all duration-200"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              Collection
            </Link>
          </div>

          {/* Hero image */}
          <div className="relative h-[55vh] max-h-[500px] min-h-[300px] overflow-hidden bg-muted">
            {artifact.image_url ? (
              <ArtifactImage
                src={artifact.image_url}
                alt={artifact.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            ) : (
              <ArtifactPlaceholder title={artifact.title} ageColor={ageColor} />
            )}

            {/* Bottom gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <div className="max-w-3xl">
                {/* Age badge */}
                <div
                  className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1
                              rounded-full text-[11px] font-medium text-white
                              bg-white/20 backdrop-blur-sm border border-white/20"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: ageColor }}
                  />
                  {artifact.age || "Period unknown"}
                </div>

                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2">
                  {artifact.title}
                </h1>

                <p className="text-white/80 text-sm">
                  {artifact.cultural_origin}
                  {artifact.location?.country && ` · ${artifact.location.country}`}
                </p>
              </div>
            </div>

            {/* Age color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: ageColor }}
            />
          </div>
        </div>

        {/* ===== TWO-COLUMN CONTENT ===== */}
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-8">
            {/* LEFT COLUMN — narrative content */}
            <div className="space-y-8">
              {/* Description */}
              {artifact.description && (
                <section>
                  <h2 className="font-display text-xl font-semibold mb-4 pb-2 border-b border-secondary/40">
                    Description
                  </h2>
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {artifact.description}
                  </div>
                </section>
              )}

              {/* Tags */}
              {artifact.tags?.length > 0 && (
                <section>
                  <h2 className="font-display text-xl font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {artifact.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/artifacts?tag=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 rounded-full text-xs font-medium
                                   bg-muted text-muted-foreground border border-secondary/60
                                   hover:bg-primary/10 hover:text-primary
                                   hover:border-primary/30 transition-all duration-200"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* AI Analysis — Client Component */}
              <ArtifactAISection
                artifactId={artifact.id}
                existingAnalysis={artifact.ai_analysis}
              />
            </div>

            {/* RIGHT COLUMN — structured data */}
            <aside className="space-y-6">
              {/* Metadata Card */}
              <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-secondary/30">
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Artifact Details
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {metadataRows.map(
                    ({ icon: Icon, label, value }) =>
                      value && (
                        <div key={label} className="flex items-start gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                              {label}
                            </span>
                            {label === "Condition" ? (
                              <span
                                className={cn(
                                  "inline-block text-xs font-medium px-2 py-0.5 rounded-full border mt-0.5",
                                  conditionStyle.bg,
                                  conditionStyle.text,
                                  conditionStyle.border
                                )}
                              >
                                {value}
                              </span>
                            ) : (
                              <span className="text-sm text-foreground font-medium">
                                {value}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="rounded-xl border border-secondary/40 bg-white shadow-warm-sm overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-secondary/30">
                  <h2 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                    Location Found
                  </h2>
                </div>
                {lat && lng ? (
                  <>
                    <StaticMap
                      lat={lat}
                      lng={lng}
                      className="w-full h-40 object-cover"
                    />
                    {locationParts.length > 0 && (
                      <div className="p-3 text-xs text-muted-foreground">
                        {locationParts.join(", ")}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    {locationParts.length > 0
                      ? locationParts.join(", ")
                      : "Location data not available"}
                  </div>
                )}
              </div>

              {/* Similar Artifacts — Client Component */}
              <SimilarArtifactsSection artifactId={artifact.id} />
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
}

/* ===== ARTIFACT PLACEHOLDER =====
 * Shown when artifact has no image_url.
 * Renders a gradient div with the age color, a decorative glyph, and the title. */
function ArtifactPlaceholder({
  title,
  ageColor,
}: {
  title: string;
  ageColor: string;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${ageColor}22, ${ageColor}44)`,
      }}
    >
      <span className="text-6xl mb-4 opacity-60" aria-hidden="true">
        ⚱
      </span>
      <span
        className="font-display text-2xl text-center px-6 text-foreground/60"
      >
        {title}
      </span>
    </div>
  );
}
