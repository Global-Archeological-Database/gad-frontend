"use client";

import { useState, useCallback } from "react";
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

interface GalleryFilterBarProps {
  /** Current search query */
  searchQuery: string;
  /** Called when search input changes */
  onSearchChange: (value: string) => void;
  /** Current condition filter value */
  condition: string;
  /** Called when condition filter changes */
  onConditionChange: (value: string | null) => void;
  /** Current type filter */
  activeType: "all" | "2d" | "3d";
  /** Called when type filter changes */
  onTypeChange: (type: "all" | "2d" | "3d") => void;
  /** Current country filter value */
  country: string;
  /** Called when country filter changes */
  onCountryChange: (value: string | null) => void;
  /** Total count of filtered results */
  filteredCount: number;
  /** Whether any filters are active (to show clear button) */
  hasActiveFilters: boolean;
  /** Called to clear all filters */
  onClearFilters: () => void;
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
  condition,
  onConditionChange,
  activeType,
  onTypeChange,
  country,
  onCountryChange,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
}: GalleryFilterBarProps) {
  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
        {/* Search within gallery */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-8 pl-8 pr-3 text-xs w-48 rounded-full border-secondary/60 bg-muted/50"
            placeholder="Search artifacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Condition filter — shadcn Select */}
        <Select value={condition} onValueChange={onConditionChange}>
          <SelectTrigger className="h-8 text-xs rounded-full w-[120px] border-secondary/60 bg-muted/50">
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
                "h-7 px-3 text-xs rounded-full transition-all duration-200",
                activeType === type.value
                  ? "bg-white shadow-warm-xs text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onTypeChange(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Country filter — simple text input */}
        <Input
          className="h-8 text-xs w-36 rounded-full border-secondary/60 bg-muted/50 flex-shrink-0"
          placeholder="Country..."
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        />

        {/* Result count — pushed to the right */}
        <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
          {filteredCount} artifact{filteredCount !== 1 ? "s" : ""}
        </div>

        {/* Clear filters — only when any filter active */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex-shrink-0 text-xs text-primary hover:underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
