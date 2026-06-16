'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, MapPin, Sparkles } from 'lucide-react';
import { useArtifact } from '@/hooks/useArtifacts';
import { useAuthStore } from '@/store/authStore';
import StaticMap from '@/components/artifacts/StaticMap';
import { ArtifactImage } from '@/components/artifacts/ArtifactImage';
import { getAgeColor } from '@/lib/ageColor';
import { formatDateStr } from '@/lib/utils';

interface ArtifactDetailPanelProps {
  artifactId: string | null;
  onClose: () => void;
}

/** Condition → hex colour mapping for the condition badge. */
function getConditionColor(condition: string): string {
  switch (condition) {
    case 'Excellent':
      return '#2D5A27';
    case 'Good':
      return '#4A6FA5';
    case 'Fair':
      return '#B8860B';
    case 'Poor':
      return '#8B4513';
    case 'Fragmentary':
      return '#722F37';
    default:
      return '#888780';
  }
}

export default function ArtifactDetailPanel({
  artifactId,
  onClose,
}: ArtifactDetailPanelProps) {
  const { data: artifact, isLoading, isError } = useArtifact(artifactId);
  const user = useAuthStore((state) => state.user);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const ageColor = useMemo(
    () => getAgeColor(artifact?.age),
    [artifact?.age],
  );

  const conditionColor = useMemo(
    () => getConditionColor(artifact?.condition ?? ''),
    [artifact?.condition],
  );

  /** Build a static-map URL from artifact coordinates. */
  const staticMapSrc = useMemo(() => {
    const lat =
      artifact?.latitude ?? artifact?.location?.coordinates?.latitude;
    const lng =
      artifact?.longitude ?? artifact?.location?.coordinates?.longitude;
    if (lat == null || lng == null) return null;
    // Generate a Mapbox static map URL for the artifact location.
    // Replace the access token with a valid Mapbox public token in production.
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+B8860B(${lng},${lat})/${lng},${lat},10,0/400x80@2x?access_token=pk.placeholder`;
  }, [artifact]);

  return (
    <AnimatePresence>
      {artifactId && (
        <motion.div
          key={artifactId}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-[100dvh] w-full lg:w-[480px] 
                     bg-background border-l border-secondary/60 shadow-warm-2xl 
                     z-40 flex flex-col overflow-hidden"
        >
          {/* ── 1. AGE ACCENT BAR ── */}
          <div
            className="w-full shrink-0"
            style={{ height: 3, backgroundColor: ageColor }}
          />

          {/* ── 2. PANEL HEADER ── */}
          <div className="flex items-center justify-between p-4 border-b border-secondary/40 shrink-0">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full 
                         bg-secondary/20 hover:bg-secondary/40 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-xs text-muted-foreground tracking-wider uppercase font-medium">
              Artifact Detail
            </span>
            <span className="w-8" /> {/* spacer for centering */}
          </div>

          {/* ── 3. SCROLLABLE CONTENT ── */}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          )}

          {isError && (
            <div className="flex-1 flex items-center justify-center text-sm text-destructive">
              Failed to load artifact details.
            </div>
          )}

          {artifact && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* ── 3a. HERO IMAGE ── */}
              <div className="relative h-56 w-full bg-secondary/30">
                {artifact.image_url ? (
                  <ArtifactImage
                    src={artifact.image_url}
                    alt={artifact.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 100vw, 480px"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-age-ancient/20 via-age-medieval/20 to-age-early-modern/20" />
                )}

                {/* Gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background/80" />

                {/* Condition badge — top-right */}
                <span
                  className="absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 
                             rounded-full text-xs font-medium shadow-sm"
                  style={{
                    backgroundColor: `${conditionColor}20`,
                    color: conditionColor,
                  }}
                >
                  {artifact.condition}
                </span>

                {/* 3D badge — top-left */}
                {artifact.is_3d && (
                  <span
                    className="absolute top-3 left-3 inline-flex items-center px-2 py-0.5 
                               rounded text-xs font-bold shadow-sm bg-background/70 
                               text-foreground backdrop-blur-sm"
                  >
                    3D
                  </span>
                )}
              </div>

              {/* ── 3b. TITLE & AGE SECTION ── */}
              <div className="px-4 pt-4 pb-2 space-y-1">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {artifact.title}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full 
                               text-xs font-medium"
                    style={{
                      backgroundColor: `${ageColor}20`,
                      color: ageColor,
                    }}
                  >
                    {artifact.age}
                  </span>
                  {artifact.cultural_origin && (
                    <span className="text-sm text-muted-foreground italic">
                      {artifact.cultural_origin}
                    </span>
                  )}
                </div>
              </div>

              {/* ── 3c. LOCATION SECTION ── */}
              <div className="px-4 pb-2 space-y-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {[
                      artifact.location?.country ?? artifact.country,
                      artifact.location?.region,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>

                {staticMapSrc && artifact && (
                  <div className="rounded-lg overflow-hidden h-20">
                    <StaticMap
                      lat={artifact.latitude ?? artifact?.location?.coordinates?.latitude ?? 0}
                      lng={artifact.longitude ?? artifact?.location?.coordinates?.longitude ?? 0}
                    />
                  </div>
                )}
              </div>

              {/* ── 3d. METADATA GRID ── */}
              <div className="px-4 pb-2 grid grid-cols-2 gap-3">
                <MetadataCell
                  label="Materials"
                  value={artifact.materials?.join(', ')}
                />
                <MetadataCell label="Condition" value={artifact.condition} />
                <MetadataCell label="Period" value={artifact.age} />
                <MetadataCell
                  label="Discoverer"
                  value={artifact.uploader_name ?? artifact.uploader_email}
                />
              </div>

              {/* ── 3e. DESCRIPTION ── */}
              {artifact.description && (
                <div className="px-4 pb-2">
                  <div
                    className={`text-sm text-foreground leading-relaxed prose-archaeological ${
                      !descriptionExpanded ? 'line-clamp-3' : ''
                    }`}
                  >
                    {artifact.description}
                  </div>
                  {artifact.description.length > 180 && (
                    <button
                      onClick={() =>
                        setDescriptionExpanded(!descriptionExpanded)
                      }
                      className="mt-1 text-xs font-medium text-age-ancient hover:text-age-ancient/80 transition-colors"
                    >
                      {descriptionExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}

              {/* ── 3f. AI ANALYSIS SECTION ── */}
              <div className="px-4 py-4 border-t border-secondary/40">
                {artifact.ai_analysis ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-age-ancient" />
                      <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                        AI Analysis
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {artifact.ai_analysis}
                    </p>
                  </div>
                ) : user ? (
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-secondary/60 text-sm font-medium text-foreground bg-transparent hover:bg-secondary/20 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-age-ancient" />
                    Analyze with AI
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in to use AI features
                  </p>
                )}
              </div>

              {/* ── 3g. FIND SIMILAR SECTION ── */}
              <div className="px-4 py-4 border-t border-secondary/40">
                <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground block mb-3">
                  Similar Artifacts
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {/* Placeholder mini cards */}
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="shrink-0 w-16 h-16 rounded-lg bg-secondary/40 border border-secondary/60"
                    />
                  ))}
                  {user && (
                    <button
                      type="button"
                      className="shrink-0 w-16 h-16 rounded-lg border border-dashed border-secondary/60 flex items-center justify-center text-xs text-muted-foreground hover:bg-secondary/20 transition-colors"
                      aria-label="Find similar artifacts"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. PANEL FOOTER ── */}
          {artifact && (
            <div className="p-4 border-t border-secondary/40 shrink-0 flex items-center justify-between">
              <Link
                href={`/artifacts/${artifactId}`}
                className="text-sm font-medium text-age-ancient hover:text-age-ancient/80 transition-colors"
              >
                View Full Details &rarr;
              </Link>
              <div className="text-xs text-muted-foreground text-right">
                {artifact.created_at && (
                  <div>
                    Added {formatDateStr(artifact.created_at)}
                  </div>
                )}
                <div>{artifact.view_count ?? 0} views</div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Small helper components ─── */

function MetadataCell({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
