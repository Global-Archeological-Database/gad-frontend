"use client";

import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface ViewModeToggleProps {
  /** Current active view mode */
  value: ViewMode;
  /** Called when view mode changes */
  onChange: (mode: ViewMode) => void;
}

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
];

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-lg border border-secondary/60 bg-muted/50 p-0.5 gap-0.5">
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all duration-200",
            value === option.value
              ? "bg-card shadow-warm-xs text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label={`${option.label} view`}
          aria-pressed={value === option.value}
        >
          {option.value === "grid" ? <GridIcon /> : <ListIcon />}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function GridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
