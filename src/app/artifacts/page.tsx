"use client";

import { useState, useCallback } from "react";
import { useArtifacts } from "@/hooks/useArtifacts";
import ArtifactGrid from "@/components/artifacts/ArtifactGrid";

const conditionOptions = [
  { value: "", label: "All Conditions" },
  { value: "Excellent", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Poor", label: "Poor" },
  { value: "Fragmentary", label: "Fragmentary" },
];

export default function ArtifactsPage() {
  const [country, setCountry] = useState("");
  const [condition, setCondition] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "2d" | "3d">("all");

  const filters: Record<string, string> = {};
  if (country.trim()) filters.country = country.trim();
  if (condition) filters.condition = condition;
  if (typeFilter === "3d") filters.is_3d = "true";
  if (typeFilter === "2d") filters.is_3d = "false";

  const { data, isLoading } = useArtifacts(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const artifacts = data?.artifacts ?? [];
  const count = data?.count ?? artifacts.length;

  const handleCountryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setCountry(e.target.value),
    []
  );

  const handleConditionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value),
    []
  );

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FDFAF5" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page title */}
        <h1 className="text-3xl font-bold mb-6" style={{ color: "#1A1208" }}>
          Artifact Gallery
        </h1>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg border" style={{ backgroundColor: "#FFFFFF", borderColor: "#D4C5A9" }}>
          {/* Country input */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="country-filter" className="block text-xs font-medium mb-1" style={{ color: "#8B7355" }}>
              Country
            </label>
            <input
              id="country-filter"
              type="text"
              placeholder="Filter by country..."
              value={country}
              onChange={handleCountryChange}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#D4C5A9", backgroundColor: "#FDFAF5", color: "#1A1208" }}
            />
          </div>

          {/* Condition select */}
          <div className="min-w-[160px]">
            <label htmlFor="condition-filter" className="block text-xs font-medium mb-1" style={{ color: "#8B7355" }}>
              Condition
            </label>
            <select
              id="condition-filter"
              value={condition}
              onChange={handleConditionChange}
              className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: "#D4C5A9", backgroundColor: "#FDFAF5", color: "#1A1208" }}
            >
              {conditionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type toggle */}
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium mb-1" style={{ color: "#8B7355" }}>
              Type
            </label>
            <div className="flex rounded-md overflow-hidden border" style={{ borderColor: "#D4C5A9" }}>
              {(["all", "2d", "3d"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className="flex-1 px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: typeFilter === type ? "#B8860B" : "#FDFAF5",
                    color: typeFilter === type ? "#FFFFFF" : "#1A1208",
                  }}
                >
                  {type === "all" ? "All" : type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Count text */}
        <p className="text-sm mb-4" style={{ color: "#8B7355" }}>
          Showing {count} artifact{count !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        <ArtifactGrid artifacts={artifacts} isLoading={isLoading} />
      </div>
    </main>
  );
}
