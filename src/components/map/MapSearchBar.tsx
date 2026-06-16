'use client';

import { useEffect, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface MapSearchBarProps {
  /** Called when search query changes (debounced, trimmed) */
  onSearch: (query: string) => void;
  /** Total number of artifacts loaded */
  totalCount: number;
  /** Number of artifacts matching the current filter (only shown when filter is active) */
  filteredCount: number;
  /** Whether a search is active (controls visibility of result count) */
  isFilterActive: boolean;
  /** Whether artifacts are still loading (show spinner) */
  isLoading: boolean;
}

export default function MapSearchBar({
  onSearch,
  totalCount,
  filteredCount,
  isFilterActive,
  isLoading,
}: MapSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // ── Debounce search input — 300ms delay ──────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      {/* Search bar container */}
      <div
        className="flex items-center gap-2 bg-background/90 backdrop-blur-md
                    border border-secondary/80 rounded-full
                    shadow-warm-lg hover:shadow-warm-xl
                    transition-shadow duration-300
                    w-[min(480px,calc(100vw-32px))] px-4 h-12"
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          placeholder="Search artifacts, sites, or civilizations..."
          className="flex-1 bg-transparent text-sm outline-none
                     placeholder:text-muted-foreground text-foreground"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button type="button" onClick={handleClear} aria-label="Clear search">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
        )}
      </div>

      {/* Result count — always visible */}
      <div
        className="mt-2 text-center text-xs text-muted-foreground bg-background/80 backdrop-blur-sm
                    rounded-full px-3 py-1 shadow-warm-sm"
      >
        {isFilterActive
          ? `Showing ${filteredCount} of ${totalCount} artifacts`
          : `${totalCount} artifacts on map`}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Loading artifacts...</span>
        </div>
      )}
    </div>
  );
}
