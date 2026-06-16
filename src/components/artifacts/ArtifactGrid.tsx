"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import ArtifactCard from "./ArtifactCard";
import { ArtifactCardSkeleton } from "./ArtifactCardSkeleton";
import { queryClient } from "@/lib/queryClient";
import type { Artifact } from "@/types/artifact";

interface ArtifactGridProps {
  artifacts: Artifact[];
  isLoading: boolean;
  filterKey?: string;
  onClearFilters?: () => void;
}

// ── Framer Motion Stagger Variants ─────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.165, 0.84, 0.44, 1] as const },
  },
};


// ── Empty State ────────────────────────────────────────────────────
function EmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      {/* Amphora outline SVG */}
      <svg
        className="w-20 h-20 text-secondary mb-6"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Amphora body */}
        <path d="M20 8h24l-4 8v8c0 12-8 20-8 20s-8-8-8-20v-8l-4-8z" />
        {/* Handles */}
        <path d="M28 16c-4 4-6 12-6 12" />
        <path d="M36 16c4 4 6 12 6 12" />
        {/* Neck rim */}
        <path d="M20 8c0 2 2 4 4 4h16c2 0 4-2 4-4" />
        {/* Base */}
        <path d="M24 48h16" />
        <path d="M22 52h20" />
        <path d="M24 44c-2 4-3 8-2 8h20c1 0 0-4-2-8" />
      </svg>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        No artifacts found
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Try adjusting your search or filters to discover more of the
        world's archaeological heritage.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center justify-center rounded-full border border-secondary/60 bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted hover:shadow-warm-sm transition-all duration-200"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ArtifactGrid({
  artifacts,
  isLoading,
  filterKey,
  onClearFilters,
}: ArtifactGridProps) {
  // Loading state — 12 warm skeleton cards
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ArtifactCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Empty state
  if (artifacts.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  // Prefetch first 5 artifact detail pages for instant navigation
  useEffect(() => {
    if (artifacts && artifacts.length > 0) {
      artifacts.slice(0, 5).forEach(artifact => {
        queryClient.prefetchQuery({
          queryKey: ['artifact', artifact.id],
          queryFn: () => fetch(`/api/artifacts/${artifact.id}`).then(r => r.json()),
          staleTime: 5 * 60 * 1000,
        })
      })
    }
  }, [artifacts])

  // Populated state with stagger animation
  return (
    <motion.div
      key={filterKey ?? "grid"}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      {artifacts.map((artifact) => (
        <motion.div key={artifact.id} variants={itemVariants}>
          <ArtifactCard artifact={artifact} />
        </motion.div>
      ))}
    </motion.div>
  );
}
