"use client";

import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/types/artifact";

interface GalleryFilterBarProps {
  /** Current search query */
  searchQuery: string;
  /** Called when search input changes */
  onSearchChange: (value: string) => void;
  /** Current filter state object */
  filters: { country: string; condition: string; type: "all" | "2d" | "3d"; tag: string };
  /** Called to update filters */
  onFiltersChange: (filters: any) => void;
  /** Whether any filters are active (to show clear button) */
  hasActiveFilters: boolean;
  /** Called to clear all filters */
  onClearFilters: () => void;
  /** Count of filtered results */
  filteredCount: number;
  /** Total count of all artifacts */
  totalCount: number;
  /** Full artifacts array for computing suggestions */
  artifacts: Artifact[];
}

const CONDITION_OPTIONS = [
  { value: "", label: "Any condition" },
  { value: "Excellent", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Poor", label: "Poor" },
  { value: "Fragmentary", label: "Fragmentary" },
];

const TYPE_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "2d" as const, label: "2D" },
  { value: "3d" as const, label: "3D" },
];

export default function GalleryFilterBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  hasActiveFilters,
  onClearFilters,
  filteredCount,
  totalCount,
  artifacts,
}: GalleryFilterBarProps) {
  // ── Compute country suggestions from artifacts ────────────────
  const countrySuggestions = useMemo(() => {
    if (!filters.country.trim()) return [];
    const query = filters.country.toLowerCase();
    const allCountries = [...new Set(
      artifacts
        .map(a => a.location?.country)
        .filter(Boolean) as string[]
    )];
    return allCountries.filter(c =>
      c.toLowerCase().includes(query)
    ).sort();
  }, [artifacts, filters.country]);

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
        {/* Search within gallery */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-10 pl-8 pr-3 text-xs w-48 rounded-full border-secondary/60 bg-muted/50"
            placeholder="Search artifacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Condition filter — shadcn Select */}
        <Select
          value={filters.condition}
          onValueChange={(value) => onFiltersChange((prev: any) => ({ ...prev, condition: value }))}
        >
          <SelectTrigger className="h-10 text-xs rounded-full w-[120px] border-secondary/60 bg-muted/50">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter — segmented control */}
        <div className="flex rounded-full border border-secondary/60 bg-muted/50 p-0.5 gap-0.5 flex-shrink-0">
          {TYPE_OPTIONS.map((type) => (
            <button
              key={type.value}
              className={cn(
                "h-9 px-4 text-xs rounded-full transition-all duration-200",
                filters.type === type.value
                  ? "bg-card shadow-warm-xs text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onFiltersChange((prev: any) => ({ ...prev, type: type.value }))}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Country filter — text input with suggestions dropdown */}
        <div className="relative flex-shrink-0">
          <Input
            value={filters.country}
            onChange={(e) => onFiltersChange((prev: any) => ({ ...prev, country: e.target.value }))}
            placeholder="Filter by location..."
            className="h-10 text-xs w-44 rounded-full border-secondary/60 bg-muted/50"
          />
          {/* Suggestions dropdown */}
          {filters.country.length >= 1 && countrySuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 bg-popover border border-secondary/40 rounded-lg shadow-warm-md z-50 min-w-[160px] overflow-hidden">
              {countrySuggestions.slice(0, 6).map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => onFiltersChange((prev: any) => ({ ...prev, country }))}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors text-foreground"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Result count — pushed to the right */}
        <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
          Showing {filteredCount} of {totalCount} artifact{totalCount !== 1 ? "s" : ""}
        </div>

        {/* Clear filters — only when any filter active */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex-shrink-0 text-xs text-primary hover:underline whitespace-nowrap px-3 py-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
