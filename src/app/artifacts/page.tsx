"use client";

import { useMemo } from "react";
import { useArtifacts } from "@/hooks/useArtifacts";
import { useArtifactSearch } from "@/hooks/useArtifactSearch";
import ArtifactGrid from "@/components/artifacts/ArtifactGrid";
import GalleryFilterBar from "@/components/artifacts/GalleryFilterBar";

export default function ArtifactsPage() {
  // ── Fetch up to 500 artifacts for client-side filtering ──────
  const { data, isLoading } = useArtifacts({ limit: '500' });
  const artifacts = data?.artifacts || [];

  // ── Client-side fuzzy search hook ─────────────────────────────
  const {
    searchQuery, setSearchQuery,
    filters, setFilters,
    filteredArtifacts,
    hasActiveFilters, clearFilters,
    totalCount, filteredCount
  } = useArtifactSearch(artifacts);

  // ── Compute unique countries count ────────────────────────────
  const countryCount = useMemo(() => {
    const countries = new Set<string>();
    artifacts.forEach((a: any) => {
      if (a.location?.country) countries.add(a.location.country);
      else if (a.country) countries.add(a.country);
    });
    return countries.size;
  }, [artifacts]);

  // ── Filter key for stagger re-animation ───────────────────────
  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  return (
    <main id="main-content" className="min-h-[100dvh] bg-background">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          The Collection
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {totalCount} artifact{totalCount !== 1 ? "s" : ""} from{" "}
          {countryCount} countr{countryCount !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Filter Bar */}
      <GalleryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filteredCount={filteredCount}
        totalCount={totalCount}
        artifacts={artifacts}
      />

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ArtifactGrid
          artifacts={filteredArtifacts}
          isLoading={isLoading}
          filterKey={filterKey}
          onClearFilters={clearFilters}
        />
      </div>
    </main>
  );
}
