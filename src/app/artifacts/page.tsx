"use client";

import { useState, useCallback, useMemo } from "react";
import { useArtifacts, useInfiniteArtifacts } from "@/hooks/useArtifacts";
import ArtifactGrid from "@/components/artifacts/ArtifactGrid";
import GalleryFilterBar from "@/components/artifacts/GalleryFilterBar";
import { Button } from "@/components/ui/button";

export default function ArtifactsPage() {
  // ── Filter State ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [condition, setCondition] = useState("");
  const [activeType, setActiveType] = useState<"all" | "2d" | "3d">("all");
  const [country, setCountry] = useState("");

  // ── Transform into API filter params ──────────────────────────
  const filters = useMemo(() => {
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (condition) params.condition = condition;
    if (activeType === "3d") params.is_3d = "true";
    if (activeType === "2d") params.is_3d = "false";
    if (country.trim()) params.country = country.trim();
    return params;
  }, [searchQuery, condition, activeType, country]);

  // ── Fetch unfiltered count for header stats ───────────────────
  const { data: allData } = useArtifacts();

  // ── Fetch filtered/paginated data ─────────────────────────────
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteArtifacts(filters);

  const artifacts = useMemo(
    () => data?.pages.flatMap((page) => page.artifacts) ?? [],
    [data]
  );
  const totalCount = data?.pages[0]?.count ?? 0;
  const allTotalCount = allData?.count ?? 0;

  // ── Compute unique countries count ────────────────────────────
  const countryCount = useMemo(() => {
    if (data?.pages) {
      const countries = new Set<string>();
      data.pages.forEach((page) =>
        page.artifacts.forEach((a) => {
          if (a.location?.country) countries.add(a.location.country);
          else if (a.country) countries.add(a.country);
        })
      );
      return countries.size;
    }
    return 0;
  }, [data]);

  // ── Has any filter active? ────────────────────────────────────
  const hasActiveFilters = useMemo(
    () =>
      searchQuery !== "" ||
      condition !== "" ||
      activeType !== "all" ||
      country !== "",
    [searchQuery, condition, activeType, country]
  );

  // ── Clear all filters ─────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setCondition("");
    setActiveType("all");
    setCountry("");
  }, []);

  // ── Filter key for stagger re-animation ───────────────────────
  const filterKey = useMemo(
    () => JSON.stringify(filters),
    [filters]
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          The Collection
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {allTotalCount} artifact{allTotalCount !== 1 ? "s" : ""} from{" "}
          {countryCount} countr{countryCount !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Filter Bar */}
      <GalleryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        condition={condition}
        onConditionChange={(value) => setCondition(value ?? "")}
        activeType={activeType}
        onTypeChange={setActiveType}
        country={country}
        onCountryChange={(value) => setCountry(value ?? "")}
        filteredCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              We couldn't load the artifacts. Please try again later.
            </p>
          </div>
        ) : (
          <ArtifactGrid
            artifacts={artifacts}
            isLoading={isLoading}
            filterKey={filterKey}
            onClearFilters={clearFilters}
          />
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="border-secondary hover:bg-muted hover:shadow-warm-sm text-foreground"
            >
              {isFetchingNextPage ? "Loading..." : "Load more artifacts"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
